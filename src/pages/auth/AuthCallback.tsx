import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando autenticación...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔄 Procesando callback de autenticación...');
        
        // Check for error in URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('❌ Error en URL:', error, errorDescription);
          setStatus('error');
          setMessage(errorDescription || 'Error al procesar la autenticación');
          toast.error(errorDescription || 'Error al procesar la autenticación');
          setTimeout(() => navigate('/auth/login'), 3000);
          return;
        }

        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Error al obtener sesión:', sessionError);
          setStatus('error');
          setMessage('Error al procesar la autenticación');
          toast.error('Error al procesar la autenticación');
          setTimeout(() => navigate('/auth/login'), 3000);
          return;
        }

        if (session) {
          console.log('✅ Sesión encontrada, obteniendo perfil de usuario...');
          setStatus('success');
          setMessage('¡Email verificado! Cargando tu perfil...');
          await fetchUser();
          toast.success('¡Autenticación exitosa!');
          
          // Check if user needs to set password (new user)
          const { data: { user } } = await supabase.auth.getUser();
          if (user && !user.last_sign_in_at) {
            // New user - redirect to set password
            setMessage('Redirigiendo para establecer contraseña...');
            setTimeout(() => navigate('/auth/reset-password'), 1500);
          } else {
            setTimeout(() => navigate('/'), 1500);
          }
        } else {
          console.log('⚠️ No se encontró sesión, verificando token...');
          
          // Try to exchange the token from URL
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          const type = searchParams.get('type');
          
          if (accessToken && refreshToken) {
            console.log('🔄 Intentando establecer sesión con tokens...');
            const { data, error: setError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            
            if (setError) {
              console.error('❌ Error al establecer sesión:', setError);
              setStatus('error');
              setMessage('El enlace ha expirado o no es válido');
              toast.error('El enlace ha expirado. Solicita uno nuevo.');
              setTimeout(() => navigate('/auth/resend-verification'), 3000);
              return;
            }
            
            if (data.session) {
              setStatus('success');
              setMessage('¡Email verificado! Redirigiendo...');
              await fetchUser();
              toast.success('¡Email verificado exitosamente!');
              
              // If it's a recovery or signup, redirect to reset password
              if (type === 'recovery' || type === 'signup') {
                setTimeout(() => navigate('/auth/reset-password'), 1500);
              } else {
                setTimeout(() => navigate('/'), 1500);
              }
              return;
            }
          }
          
          // Wait a bit for the session to be established
          setTimeout(async () => {
            const { data: { session: retrySession } } = await supabase.auth.getSession();
            if (retrySession) {
              setStatus('success');
              setMessage('¡Autenticación exitosa!');
              await fetchUser();
              toast.success('¡Autenticación exitosa!');
              setTimeout(() => navigate('/'), 1500);
            } else {
              setStatus('error');
              setMessage('No se pudo completar la autenticación');
              toast.error('No se pudo completar la autenticación');
              setTimeout(() => navigate('/auth/login'), 3000);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('❌ Error inesperado en callback:', error);
        setStatus('error');
        setMessage('Error al procesar la autenticación');
        toast.error('Error al procesar la autenticación');
        setTimeout(() => navigate('/auth/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, fetchUser, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-amber-50">
      <div className="text-center max-w-md mx-auto p-6">
        {status === 'loading' && (
          <div className="w-16 h-16 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        )}
        {status === 'success' && (
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <p className="text-gray-600">{message}</p>
        {status === 'error' && (
          <p className="text-sm text-gray-500 mt-2">
            Serás redirigido en unos segundos...
          </p>
        )}
      </div>
    </div>
  );
}
