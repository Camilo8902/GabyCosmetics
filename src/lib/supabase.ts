import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!supabaseUrl || supabaseUrl === 'your_supabase_url' || !supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('❌ Supabase configuration error:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET (but may be invalid)' : 'NOT SET');
  console.error('Please configure your .env.local file with valid Supabase credentials.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Auth helpers
export const signInWithEmail = async (email: string, password: string) => {
  try {
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
    if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
      return {
        data: null,
        error: {
          message: 'Supabase no está configurado. Por favor configura VITE_SUPABASE_URL en tu archivo .env.local',
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
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  return { session, error };
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
