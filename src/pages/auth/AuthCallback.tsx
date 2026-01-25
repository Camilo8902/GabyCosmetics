import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function AuthCallback() {
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Procesando callback de autenticación...');
        
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error al obtener sesión:', sessionError);
          toast.error('Error al procesar la autenticación');
          navigate('/auth/login');
          return;
        }

        if (session) {
          console.log('✅ Sesión encontrada, obteniendo perfil de usuario...');
          await fetchUser();
          toast.success('¡Autenticación exitosa!');
          navigate('/');
        } else {
          console.log('⚠️ No se encontró sesión');
          // Wait a bit for the session to be established
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              await fetchUser();
              toast.success('¡Autenticación exitosa!');
              navigate('/');
            } else {
              toast.error('No se pudo completar la autenticación');
              navigate('/auth/login');
            }
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Error inesperado en callback:', error);
        toast.error('Error al procesar la autenticación');
        navigate('/auth/login');
      }
    };

    handleAuthCallback();
  }, [navigate, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Procesando autenticación...</p>
      </div>
    </div>
  );
}
