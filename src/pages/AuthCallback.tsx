import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if there's an error in the URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          navigate(`/auth?error=${encodeURIComponent(errorDescription || error)}`);
          return;
        }

        // Get the return origin and path from sessionStorage (stored before OAuth redirect)
        let returnPath = sessionStorage.getItem('oauth_return_path') || '/';
        const returnOrigin = sessionStorage.getItem('oauth_return_origin');
        
        // Never redirect to /auth on successful login - always go to homepage
        if (returnPath === '/auth' || returnPath.startsWith('/auth/')) {
          returnPath = '/';
        }
        
        // If we're on the wrong origin (e.g., redirected to production instead of localhost),
        // redirect to the correct origin with the callback path
        if (returnOrigin && returnOrigin !== window.location.origin) {
          // Clear the stored values before redirecting
          sessionStorage.removeItem('oauth_return_path');
          sessionStorage.removeItem('oauth_return_origin');
          // Redirect to the correct origin with the callback path
          window.location.href = `${returnOrigin}/auth/callback${window.location.search}`;
          return;
        }
        
        // Clear the stored values
        sessionStorage.removeItem('oauth_return_path');
        sessionStorage.removeItem('oauth_return_origin');
        
        const returnTo = returnPath;

        // Supabase should automatically handle the code exchange with detectSessionInUrl: true
        // Wait a bit for the session to be established
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Get the session after OAuth callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          navigate('/');
          return;
        }

        if (session) {
          // Navigate back to the original path or homepage
          navigate(returnTo === '/auth' ? '/' : returnTo);
        } else {
          // If no session, try to get it from the URL hash/query
          const code = searchParams.get('code');
          if (code) {
            // The code is in the URL, but Supabase should have handled it
            // If we still don't have a session, there might be an issue
            console.warn('OAuth code present but no session found');
            navigate('/');
          } else {
            navigate('/');
          }
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        navigate('/');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;

