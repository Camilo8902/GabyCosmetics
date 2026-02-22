import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package,
  AlertTriangle,
  Search,
  Filter,
  Edit,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  History,
} from 'lucide-react';
import { useCompanyId } from '@/hooks/useCompanyMetrics';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

// Tipos
interface InventoryProduct {
  id: string;
  name: string;
  sku?: string;
  stock_quantity: number;
  low_stock_threshold: number;
  images?: string[];
  price: number;
  is_active: boolean;
}

interface StockAdjustment {
  product_id: string;
  quantity: number;
  type: 'add' | 'subtract' | 'set';
  reason: string;
}

// Hook para obtener productos con inventario
function useInventoryProducts(companyId: string | null, filters?: { search?: string; status?: string }) {
  return useQuery({
    queryKey: ['inventoryProducts', companyId, filters],
    queryFn: async (): Promise<InventoryProduct[]> => {
      if (!companyId) return [];

      let query = supabase
        .from('products')
        .select('id, name, sku, stock_quantity, low_stock_threshold, images, price, is_active')
        .eq('company_id', companyId);

      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.status === 'low') {
        query = query.lt('stock_quantity', 10);
      } else if (filters?.status === 'out') {
        query = query.eq('stock_quantity', 0);
      } else if (filters?.status === 'ok') {
        query = query.gte('stock_quantity', 10);
      }

      const { data, error } = await query.order('stock_quantity', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });
}

// Hook para ajustar stock
function useAdjustStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (adjustment: StockAdjustment) => {
      // Obtener stock actual
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', adjustment.product_id)
        .single();

      if (fetchError) throw fetchError;

      let newQuantity: number;
      const currentStock = product?.stock_quantity || 0;

      switch (adjustment.type) {
        case 'add':
          newQuantity = currentStock + adjustment.quantity;
          break;
        case 'subtract':
          newQuantity = Math.max(0, currentStock - adjustment.quantity);
          break;
        case 'set':
          newQuantity = adjustment.quantity;
          break;
      }

      // Actualizar stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: newQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', adjustment.product_id);

      if (updateError) throw updateError;

      // Registrar movimiento (si existe la tabla)
      try {
        await supabase
          .from('inventory_movements')
          .insert({
            product_id: adjustment.product_id,
            quantity: adjustment.quantity,
            movement_type: adjustment.type,
            reason: adjustment.reason,
            previous_stock: currentStock,
            new_stock: newQuantity,
          });
      } catch {
        // La tabla puede no existir, ignoramos el error
      }

      return { productId: adjustment.product_id, newQuantity };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryProducts'] });
      queryClient.invalidateQueries({ queryKey: ['companyMetrics'] });
    },
  });
}

// Componente de edición de stock inline
function StockEditor({ 
  product, 
  onSave, 
  onCancel 
}: { 
  product: InventoryProduct; 
  onSave: (quantity: number, type: 'add' | 'subtract' | 'set', reason: string) => void;
  onCancel: () => void;
}) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'subtract' | 'set'>('set');
  const [quantity, setQuantity] = useState(product.stock_quantity);
  const [reason, setReason] = useState('');

  const handleSave = () => {
    if (adjustmentType === 'set' && quantity === product.stock_quantity) {
      onCancel();
      return;
    }
    if (adjustmentType !== 'set' && quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    onSave(quantity, adjustmentType, reason || 'Ajuste manual');
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
      <select
        value={adjustmentType}
        onChange={(e) => setAdjustmentType(e.target.value as 'add' | 'subtract' | 'set')}
        className="text-sm border rounded px-2 py-1"
      >
        <option value="set">Establecer</option>
        <option value="add">Agregar</option>
        <option value="subtract">Quitar</option>
      </select>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
        className="w-20 text-sm border rounded px-2 py-1"
        min={0}
      />
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Razón (opcional)"
        className="flex-1 text-sm border rounded px-2 py-1"
      />
      <button
        onClick={handleSave}
        className="p-1 text-green-600 hover:bg-green-100 rounded"
      >
        <Save className="w-4 h-4" />
      </button>
      <button
        onClick={onCancel}
        className="p-1 text-gray-400 hover:bg-gray-200 rounded"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function CompanyInventoryPage() {
  const { companyId } = useCompanyId();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<string | null>(null);

  const { data: products, isLoading } = useInventoryProducts(companyId, { search, status: statusFilter });
  const adjustStock = useAdjustStock();

  const handleSaveStock = (productId: string, quantity: number, type: 'add' | 'subtract' | 'set', reason: string) => {
    adjustStock.mutate(
      { product_id: productId, quantity, type, reason },
      {
        onSuccess: () => {
          toast.success('Stock actualizado');
          setEditingProduct(null);
        },
        onError: (error) => {
          console.error('Error adjusting stock:', error);
          toast.error('Error al actualizar stock');
        },
      }
    );
  };

  // Estadísticas rápidas
  const stats = {
    total: products?.length || 0,
    lowStock: products?.filter(p => p.stock_quantity > 0 && p.stock_quantity < 10).length || 0,
    outOfStock: products?.filter(p => p.stock_quantity === 0).length || 0,
    ok: products?.filter(p => p.stock_quantity >= 10).length || 0,
  };

  if (!companyId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">No tienes una empresa asociada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-500">Controla el stock de tus productos</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="text-sm text-gray-500">Total productos</p>
        </div>
        <button
          onClick={() => setStatusFilter(statusFilter === 'ok' ? '' : 'ok')}
          className={cn(
            'rounded-xl p-4 text-left transition-all',
            statusFilter === 'ok' ? 'bg-green-100 ring-2 ring-green-500' : 'bg-white shadow-sm'
          )}
        >
          <p className="text-2xl font-bold text-green-600">{stats.ok}</p>
          <p className="text-sm text-gray-500">Stock OK</p>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'low' ? '' : 'low')}
          className={cn(
            'rounded-xl p-4 text-left transition-all',
            statusFilter === 'low' ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-white shadow-sm'
          )}
        >
          <p className="text-2xl font-bold text-amber-600">{stats.lowStock}</p>
          <p className="text-sm text-gray-500">Stock bajo</p>
        </button>
        <button
          onClick={() => setStatusFilter(statusFilter === 'out' ? '' : 'out')}
          className={cn(
            'rounded-xl p-4 text-left transition-all',
            statusFilter === 'out' ? 'bg-red-100 ring-2 ring-red-500' : 'bg-white shadow-sm'
          )}
        >
          <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
          <p className="text-sm text-gray-500">Sin stock</p>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </div>

      {/* Products List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products && products.length > 0 ? (
          <div className="divide-y">
            {products.map((product) => (
              <div
                key={product.id}
                className={cn(
                  'p-4 hover:bg-gray-50 transition-colors',
                  product.stock_quantity === 0 && 'bg-red-50',
                  product.stock_quantity > 0 && product.stock_quantity < 10 && 'bg-amber-50'
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Imagen */}
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        {product.sku && (
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Stock indicator */}
                    {editingProduct === product.id ? (
                      <div className="mt-3">
                        <StockEditor
                          product={product}
                          onSave={(qty, type, reason) => handleSaveStock(product.id, qty, type, reason)}
                          onCancel={() => setEditingProduct(null)}
                        />
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium',
                              product.stock_quantity === 0
                                ? 'bg-red-100 text-red-700'
                                : product.stock_quantity < 10
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                            )}
                          >
                            {product.stock_quantity === 0 ? (
                              <>
                                <X className="w-4 h-4" />
                                Sin stock
                              </>
                            ) : product.stock_quantity < 10 ? (
                              <>
                                <AlertTriangle className="w-4 h-4" />
                                {product.stock_quantity} unidades
                              </>
                            ) : (
                              <>
                                <Package className="w-4 h-4" />
                                {product.stock_quantity} unidades
                              </>
                            )}
                          </span>
                          {!product.is_active && (
                            <span className="text-xs text-gray-400">(Inactivo)</span>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingProduct(product.id)}
                          className="text-sm text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Edit className="w-4 h-4" />
                          Ajustar stock
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search || statusFilter ? 'No se encontraron productos' : 'No tienes productos'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search || statusFilter
                ? 'Intenta con otros filtros'
                : 'Agrega productos para controlar su inventario'}
            </p>
            {!search && !statusFilter && (
              <Link
                to="/company/products/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                Agregar Producto
              </Link>
            )}
          </div>
        )}
      </motion.div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          to="/company/products"
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <Package className="w-5 h-5 text-rose-600" />
          <div>
            <p className="font-medium text-gray-900">Gestionar Productos</p>
            <p className="text-sm text-gray-500">Ver y editar catálogo</p>
          </div>
        </Link>
        <button
          onClick={() => toast.success('Historial de movimientos próximamente')}
          className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow text-left"
        >
          <History className="w-5 h-5 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900">Historial de Movimientos</p>
            <p className="text-sm text-gray-500">Ver ajustes de stock</p>
          </div>
        </button>
      </div>
    </div>
  );
}