import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

// Validate environment variables
const isConfigValid = 
  supabaseUrl && 
  supabaseUrl !== 'your_supabase_url' && 
  supabaseUrl !== '' &&
  supabaseAnonKey && 
  supabaseAnonKey !== 'your_supabase_anon_key' && 
  supabaseAnonKey !== '';

if (!isConfigValid) {
  console.error('❌ Supabase configuration error:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET (but may be invalid)' : 'NOT SET');
  console.error('');
  console.error('📝 Para solucionar esto:');
  console.error('1. Ve a Vercel Dashboard → Settings → Environment Variables');
  console.error('2. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  console.error('3. Asegúrate de seleccionar Production, Preview y Development');
  console.error('4. Redesplega el proyecto después de agregar las variables');
  console.error('');
}

// Create Supabase client with fallback to prevent crashes
// Use dummy values if not configured (will fail gracefully on API calls)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'sb-auth-token',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'x-client-info': 'gaby-cosmetics',
      },
    },
  }
);

// Export a function to check if Supabase is configured
export const isSupabaseConfigured = () => isConfigValid;

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  try {
    if (!isConfigValid) {
      return {
        data: null,
        error: {
          message: 'Supabase no está configurado. Por favor configura las variables de entorno en Vercel.',
        } as any,
      };
    }

    console.log('🔐 Intentando autenticar usuario...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Error en signInWithPassword:', error);
    } else {
      console.log('✅ Autenticación exitosa');
    }
    
    return { data, error };
  } catch (error) {
    console.error('❌ Error inesperado en signInWithEmail:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Error inesperado al iniciar sesión',
      } as any,
    };
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
  fullName: string
) => {
  try {
    // Validate configuration before attempting signup
    if (!isConfigValid) {
      return {
        data: null,
        error: {
          message: 'Supabase no está configurado. Por favor configura las variables de entorno en Vercel.',
        } as any,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: 'customer',
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Supabase signup error:', error);
    }

    return { data, error };
  } catch (error) {
    console.error('Unexpected error in signUpWithEmail:', error);
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Error inesperado al crear la cuenta',
      } as any,
    };
  }
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { data, error };
};

export const updatePassword = async (newPassword: string) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  return { data, error };
};

export const getCurrentUser = async () => {
  try {
    // Try getSession first (more reliable)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return { user: null, error: sessionError };
    }
    return { user: session.user, error: null };
  } catch (error) {
    // Fallback to getUser if getSession fails
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (getUserError) {
      return { user: null, error: getUserError };
    }
  }
};

export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (err: any) {
    // getSession can throw AuthSessionMissingError - this is normal when not authenticated
    if (err?.name === 'AuthSessionMissingError' || 
        err?.message?.includes('Auth session missing')) {
      return { session: null, error: null }; // Not an error, just no session
    }
    return { session: null, error: err };
  }
};

/**
 * Safely check if user has an active session without throwing errors
 */
export const hasActiveSession = async (): Promise<boolean> => {
  try {
    const { session } = await getSession();
    return !!session;
  } catch {
    return false;
  }
};

// Storage helpers
export const uploadImage = async (
  bucket: string,
  path: string,
  file: File
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) return { url: null, error };

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return { url: publicUrl, error: null };
};

export const deleteImage = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  return { error };
};
