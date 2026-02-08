import type { VercelRequest, VercelResponse } from '@vercel/node';

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

    console.log('🔵 [API] Request received');
    console.log('🔵 [API] productId:', productId);
    console.log('🔵 [API] fileName:', fileName);
    console.log('🔵 [API] fileContent length:', fileContent?.length);
    console.log('🔵 [API] contentType:', contentType);

    // Validar campos requeridos
    if (!productId || !fileName || !fileContent || !contentType) {
      return res.status(400).json({
        error: 'Faltan campos requeridos',
        received: { productId: !!productId, fileName: !!fileName, fileContent: !!fileContent, contentType: !!contentType },
      });
    }

    // Obtener variables de entorno
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔵 [API] SUPABASE_URL set:', !!supabaseUrl);
    console.log('🔵 [API] SUPABASE_SERVICE_ROLE_KEY set:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Missing environment variables',
        envVars: {
          SUPABASE_URL: !!supabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY: !!supabaseKey,
        },
      });
    }

    // Dynamic imports
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ [API] Supabase client created');

    // Convertir base64 a buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');
    console.log('🔵 [API] Buffer created, size:', fileBuffer.length);

    // Subir archivo a Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileBuffer, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('❌ [API] Storage error:', uploadError);
      return res.status(500).json({
        error: 'Storage error',
        details: uploadError.message,
      });
    }

    console.log('✅ [API] File uploaded:', uploadData.path);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('🔵 [API] Public URL:', publicUrl);

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
      console.warn('⚠️ [API] DB insert warning:', insertError);
      return res.status(200).json({
        success: true,
        url: publicUrl,
        warning: 'Image uploaded but not registered in DB',
      });
    }

    return res.status(200).json({
      success: true,
      image: imageData,
      url: publicUrl,
    });
  } catch (error: any) {
    console.error('❌ [API] Error:', error.message);
    console.error('❌ [API] Stack:', error.stack);
    return res.status(500).json({
      error: error.message || 'Internal server error',
    });
  }
}
