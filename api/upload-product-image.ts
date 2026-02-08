import { VercelRequest, VercelResponse } from '@vercel/node';

// We'll use dynamic import to avoid build issues
let supabaseAdmin: any = null;

async function getSupabaseAdmin() {
  if (supabaseAdmin) return supabaseAdmin;
  
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  
  supabaseAdmin = createClient(supabaseUrl, supabaseKey);
  return supabaseAdmin;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { productId, fileName, fileContent, contentType, altText, isPrimary } = req.body;

    // Validar campos requeridos
    if (!productId || !fileName || !fileContent || !contentType) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: productId, fileName, fileContent, contentType',
      });
    }

    console.log('🔵 [API] Subiendo imagen para producto:', productId);
    console.log('🔵 [API] fileName:', fileName);

    // Obtener cliente Supabase Admin
    const supabase = await getSupabaseAdmin();

    // Convertir base64 a buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');

    // Subir archivo a Supabase Storage usando admin client
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [API] Error subiendo archivo:', uploadError);
      return res.status(500).json({
        error: 'Error al subir archivo a Storage',
        details: uploadError.message,
      });
    }

    console.log('✅ [API] Archivo subido:', uploadData.path);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    // Insertar en la tabla product_images
    const { data: imageData, error: insertError } = await supabase
      .from('product_images')
      .insert({
        product_id: productId,
        url: publicUrl,
        alt_text: altText || fileName,
        order_index: 0,
        is_primary: isPrimary || false,
      })
      .select()
      .single();

    if (insertError) {
      console.warn('⚠️ [API] Error insertando en DB:', insertError);
      return res.status(200).json({
        success: true,
        url: publicUrl,
        warning: 'Imagen subida pero no registrada en DB',
      });
    }

    return res.status(200).json({
      success: true,
      image: imageData,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('❌ [API] Error general:', error);
    return res.status(500).json({
      error: error.message || 'Error interno del servidor',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
