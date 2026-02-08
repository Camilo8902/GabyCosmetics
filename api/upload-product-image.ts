import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

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
    console.log('🔵 [API] contentType:', contentType);

    // Convertir base64 a buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');

    // Subir archivo a Supabase Storage usando admin client (bypasses RLS)
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
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

    console.log('✅ [API] Archivo subido exitosamente:', uploadData.path);

    // Obtener URL pública
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('🔵 [API] publicUrl:', publicUrl);

    // Insertar en la tabla product_images usando admin client
    const { data: imageData, error: insertError } = await supabaseAdmin
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
      console.error('❌ [API] Error insertando en DB:', insertError);
      // Si falla el insert, igual retornamos la URL
      return res.status(200).json({
        success: true,
        url: publicUrl,
        warning: 'Imagen subida pero no se pudo registrar en DB',
      });
    }

    console.log('✅ [API] Imagen registrada en DB:', imageData);

    return res.status(200).json({
      success: true,
      image: imageData,
      url: publicUrl,
    });
  } catch (error) {
    console.error('❌ [API] Error general:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    });
  }
}
