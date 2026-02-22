import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, X, Save, GripVertical } from 'lucide-react';
import type { ProductVariant } from '@/types';

interface VariantManagerProps {
  productId?: string;
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice: number;
}

interface VariantFormData {
  name: string;
  name_en: string;
  sku: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  barcode?: string;
  weight?: number;
  is_active: boolean;
  attributes: Record<string, string>;
  inventory_quantity: number;
}

// Common attributes for cosmetics
const ATTRIBUTE_TYPES = [
  { key: 'size', name: 'Tamaño', name_en: 'Size', values: ['15ml', '30ml', '50ml', '100ml', '200ml'] },
  { key: 'color', name: 'Color', name_en: 'Color', values: ['Rojo', 'Rosa', 'Nude', 'Marrón', 'Vino'] },
  { key: 'presentation', name: 'Presentación', name_en: 'Presentation', values: ['Crema', 'Líquido', 'Gel', 'Polvo', 'Bálsamo'] },
  { key: 'finish', name: 'Acabado', name_en: 'Finish', values: ['Mate', 'Brillante', 'Satinado', 'Metálico'] },
];

export function VariantManager({ productId, variants, onChange, basePrice }: VariantManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<VariantFormData>({
    name: '',
    name_en: '',
    sku: '',
    price: basePrice,
    compare_at_price: undefined,
    cost_price: undefined,
    barcode: '',
    weight: undefined,
    is_active: true,
    attributes: {},
    inventory_quantity: 0,
  });

  // Reset form when base price changes
  useEffect(() => {
    if (!editingId) {
      setFormData(prev => ({ ...prev, price: basePrice }));
    }
  }, [basePrice]);

  const handleAddAttribute = (key: string, value: string) => {
    setSelectedAttributes(prev => ({ ...prev, [key]: value }));
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [key]: value },
    }));
  };

  const handleRemoveAttribute = (key: string) => {
    const newAttributes = { ...selectedAttributes };
    delete newAttributes[key];
    const formAttributes = { ...formData.attributes };
    delete formAttributes[key];
    setSelectedAttributes(newAttributes);
    setFormData(prev => ({ ...prev, attributes: formAttributes }));
  };

  const handleSave = () => {
    const newVariant: ProductVariant = {
      id: editingId || `temp-${Date.now()}`,
      product_id: productId || '',
      name: formData.name,
      name_en: formData.name_en,
      sku: formData.sku || `SKU-${Date.now()}`,
      price: formData.price,
      compare_at_price: formData.compare_at_price,
      cost_price: formData.cost_price,
      barcode: formData.barcode,
      weight: formData.weight,
      is_active: formData.is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attributes: formData.attributes,
      inventory: {
        id: `inv-${Date.now()}`,
        product_id: productId || '',
        quantity: formData.inventory_quantity,
        low_stock_threshold: 5,
        track_inventory: true,
        allow_backorder: false,
        updated_at: new Date().toISOString(),
      },
    };

    if (editingId) {
      onChange(variants.map(v => v.id === editingId ? newVariant : v));
    } else {
      onChange([...variants, newVariant]);
    }

    // Reset form
    setIsAdding(false);
    setEditingId(null);
    setSelectedAttributes({});
    setFormData({
      name: '',
      name_en: '',
      sku: '',
      price: basePrice,
      compare_at_price: undefined,
      cost_price: undefined,
      barcode: '',
      weight: undefined,
      is_active: true,
      attributes: {},
      inventory_quantity: 0,
    });
  };

  const handleEdit = (variant: ProductVariant) => {
    setEditingId(variant.id);
    setSelectedAttributes(variant.attributes || {});
    setFormData({
      name: variant.name,
      name_en: variant.name_en || '',
      sku: variant.sku,
      price: variant.price,
      compare_at_price: variant.compare_at_price,
      cost_price: variant.cost_price,
      barcode: variant.barcode || '',
      weight: variant.weight,
      is_active: variant.is_active,
      attributes: variant.attributes || {},
      inventory_quantity: variant.inventory?.quantity || 0,
    });
  };

  const handleDelete = (id: string) => {
    onChange(variants.filter(v => v.id !== id));
  };

  const generateVariantName = () => {
    const nameParts = Object.values(formData.attributes);
    return nameParts.join(' - ') || formData.name;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Variantes del Producto</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus size={20} />
          Agregar Variante
        </button>
      </div>

      {/* Variants List */}
      {variants.length > 0 ? (
        <div className="space-y-3">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border"
            >
              <GripVertical className="text-gray-400 cursor-move" size={20} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{variant.name}</span>
                  {variant.inventory && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      variant.inventory.quantity > 5 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Stock: {variant.inventory.quantity}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  SKU: {variant.sku} | Precio: ${variant.price.toFixed(2)}
                </div>
                {variant.attributes && Object.keys(variant.attributes).length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {Object.entries(variant.attributes).map(([key, value]) => (
                      <span key={key} className="px-2 py-0.5 bg-pink-100 text-pink-800 text-xs rounded">
                        {value}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(variant)}
                  className="p-2 text-gray-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(variant.id)}
                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">
          No hay variantes agregadas. Las variantes permiten ofrecer el mismo producto en diferentes opciones como tamaño, color, etc.
        </p>
      )}

      {/* Add/Edit Form Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? 'Editar Variante' : 'Nueva Variante'}
              </h3>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setSelectedAttributes({});
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Attribute Selection */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Atributos de la Variante</h4>
                <div className="grid grid-cols-2 gap-4">
                  {ATTRIBUTE_TYPES.map((attr) => (
                    <div key={attr.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {attr.name}
                      </label>
                      <select
                        value={selectedAttributes[attr.key] || ''}
                        onChange={(e) => handleAddAttribute(attr.key, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        <option value="">Seleccionar...</option>
                        {attr.values.map((v) => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                {/* Selected Attributes */}
                {Object.keys(selectedAttributes).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Object.entries(selectedAttributes).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm"
                      >
                        {value}
                        <button
                          onClick={() => handleRemoveAttribute(key)}
                          className="hover:text-pink-900"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Variant Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Variante
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={generateVariantName() || 'Ej: Rojo - 15ml'}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Precio Anterior
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.compare_at_price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Costo
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, cost_price: e.target.value ? parseFloat(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              {/* SKU and Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="SKU-VARIANTE"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Inventory */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.inventory_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, inventory_quantity: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Variante activa (visible en la tienda)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                  setSelectedAttributes({});
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Save size={18} />
                {editingId ? 'Guardar Cambios' : 'Agregar Variante'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
