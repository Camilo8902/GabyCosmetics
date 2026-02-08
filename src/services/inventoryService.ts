import { supabase } from '@/lib/supabase';
import type { Inventory, ProductVariant, LowStockAlert } from '@/types';

// ==========================================
// SERVICIOS DE INVENTARIO
// ==========================================

/**
 * Obtener inventario de una variante
 */
export async function getVariantInventory(variantId: string): Promise<Inventory | null> {
  try {
    const { data, error } = await supabase
      .from('variant_inventory')
      .select('*')
      .eq('variant_id', variantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as Inventory;
  } catch (error) {
    console.error('Error getting variant inventory:', error);
    throw error;
  }
}

/**
 * Actualizar inventario de una variante
 */
export async function updateVariantInventory(
  variantId: string,
  updates: Partial<Inventory>
): Promise<Inventory> {
  try {
    const { data, error } = await supabase
      .from('variant_inventory')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('variant_id', variantId)
      .select()
      .single();

    if (error) throw error;

    return data as Inventory;
  } catch (error) {
    console.error('Error updating variant inventory:', error);
    throw error;
  }
}

/**
 * Ajustar cantidad de inventario
 */
export async function adjustInventoryQuantity(
  variantId: string,
  adjustment: number,
  reason: string
): Promise<Inventory> {
  try {
    // Get current inventory
    const current = await getVariantInventory(variantId);
    const newQuantity = (current?.quantity || 0) + adjustment;

    if (newQuantity < 0) {
      throw new Error('No hay suficiente stock para realizar este ajuste');
    }

    const { data, error } = await supabase
      .from('variant_inventory')
      .upsert({
        variant_id: variantId,
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data as Inventory;
  } catch (error) {
    console.error('Error adjusting inventory:', error);
    throw error;
  }
}

/**
 * Obtener todos los productos con stock bajo
 */
export async function getLowStockProducts(
  companyId?: string,
  threshold?: number
): Promise<LowStockAlert[]> {
  try {
    let query = supabase
      .from('variant_inventory')
      .select(`
        *,
        variant:product_variants(
          id,
          name,
          sku,
          product_id,
          product:products(
            id,
            name,
            image_url
          )
        )
      `)
      .lte('quantity', threshold || 10);

    if (companyId) {
      query = query.eq('variant.product.company_id', companyId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to LowStockAlert format
    const alerts: LowStockAlert[] = (data || []).map((item: any) => ({
      id: `alert-${item.variant_id}`,
      variant_id: item.variant_id,
      product_id: item.variant?.product_id,
      product_name: item.variant?.product?.name || 'Producto sin nombre',
      variant_name: item.variant?.name || '',
      sku: item.variant?.sku || '',
      current_stock: item.quantity,
      low_stock_threshold: item.low_stock_threshold,
      product_image: item.variant?.product?.image_url,
      created_at: new Date().toISOString(),
    }));

    return alerts;
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
}

/**
 * Obtener inventario de todos los productos de una empresa
 */
export async function getCompanyInventory(
  companyId: string
): Promise<{ variant: ProductVariant; inventory: Inventory }[]> {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products(id, name, image_url),
        inventory:variant_inventory(*)
      `)
      .eq('product.company_id', companyId);

    if (error) throw error;

    return (data || []).map((item: any) => ({
      variant: item as ProductVariant,
      inventory: item.inventory?.[0] as Inventory || {
        id: '',
        variant_id: item.id,
        quantity: 0,
        low_stock_threshold: 10,
        track_inventory: true,
        allow_backorder: false,
        updated_at: new Date().toISOString(),
      },
    }));
  } catch (error) {
    console.error('Error getting company inventory:', error);
    throw error;
  }
}

/**
 * Verificar disponibilidad de stock para una variante
 */
export async function checkStockAvailability(
  variantId: string,
  requestedQuantity: number
): Promise<{ available: boolean; currentStock: number }> {
  try {
    const inventory = await getVariantInventory(variantId);
    const currentStock = inventory?.quantity || 0;

    return {
      available: currentStock >= requestedQuantity,
      currentStock,
    };
  } catch (error) {
    console.error('Error checking stock availability:', error);
    return { available: false, currentStock: 0 };
  }
}

/**
 * Reservar inventario (para carrito de compras)
 */
export async function reserveInventory(
  variantId: string,
  quantity: number
): Promise<boolean> {
  try {
    const current = await getVariantInventory(variantId);
    if (!current || current.quantity < quantity) {
      return false;
    }

    await updateVariantInventory(variantId, {
      quantity: current.quantity - quantity,
      reserved_quantity: (current.reserved_quantity || 0) + quantity,
    });

    return true;
  } catch (error) {
    console.error('Error reserving inventory:', error);
    return false;
  }
}

/**
 * Liberar reserva de inventario (cuando se elimina del carrito)
 */
export async function releaseReservation(
  variantId: string,
  quantity: number
): Promise<void> {
  try {
    const current = await getVariantInventory(variantId);
    if (!current) return;

    await updateVariantInventory(variantId, {
      quantity: current.quantity + quantity,
      reserved_quantity: Math.max(0, (current.reserved_quantity || 0) - quantity),
    });
  } catch (error) {
    console.error('Error releasing reservation:', error);
  }
}

/**
 * Confirmar venta (mover de reservado a vendido)
 */
export async function confirmSale(
  variantId: string,
  quantity: number
): Promise<void> {
  try {
    const current = await getVariantInventory(variantId);
    if (!current) return;

    await updateVariantInventory(variantId, {
      reserved_quantity: Math.max(0, (current.reserved_quantity || 0) - quantity),
    });
  } catch (error) {
    console.error('Error confirming sale:', error);
  }
}
