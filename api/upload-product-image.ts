import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { productId, fileName, fileContent, contentType, altText, isPrimary } = req.body;

    if (!productId || !fileName || !fileContent || !contentType) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    console.log('🔵 [API] Subiendo imagen para:', productId);

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Faltan variables de entorno' });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ [API] Supabase client creado');

    // Convertir base64 a buffer
    const fileBuffer = Buffer.from(fileContent, 'base64');

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
      return res.status(500).json({ error: 'Error al subir imagen', details: uploadError.message });
    }

    console.log('✅ [API] Archivo subido:', uploadData.path);

    // Obtener URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    console.log('🔵 [API] Public URL:', publicUrl);

    // Usar RPC para insertar (bypassea RLS)
    console.log('🔵 [API] Intentando insertar via RPC...');
    
    const { data: imageData, error: rpcError } = await supabase.rpc('insert_product_image_bypass_rls', {
      p_product_id: productId,
      p_url: publicUrl,
      p_alt_text: altText || fileName,
      p_order_index: 0,
      p_is_primary: isPrimary || false,
    });

    if (rpcError) {
      console.warn('⚠️ [API] RPC error, intentando insert directo:', rpcError);
      
      // Fallback: intentar insert directo
      const { data: insertData, error: insertError } = await supabase
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
        console.error('❌ [API] Insert directo también falló:', insertError);
        return res.status(200).json({
          success: true,
          url: publicUrl,
          warning: 'Imagen subida pero no registrada en DB',
          error: insertError.message
        });
      }

      return res.status(200).json({ success: true, image: insertData, url: publicUrl });
    }

    console.log('✅ [API] Imagen registrada via RPC:', imageData);
    return res.status(200).json({ success: true, image: imageData, url: publicUrl });

  } catch (error: any) {
    console.error('❌ [API] Error:', error.message);
    return res.status(500).json({ error: error.message || 'Error interno' });
  }
}
