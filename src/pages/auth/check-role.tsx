import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useTranslation } from 'react-i18next';

export default function CheckRole() {
  const { t } = useTranslation();
  const { isSignedIn, isLoaded } = useAuth();
  const meData = useQuery(api.users.me, {});
  const navigate = useNavigate();
  const location = useLocation();

  // Check user role and redirect appropriately
  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        // If not signed in, redirect to login
        navigate('/auth/login', { replace: true });
      } else if (meData !== undefined) {
        // If user data is loaded, check their role
        if (!meData || !meData.user) {
          // If no user data exists, redirect to role selection to create user
          navigate('/auth/choose-role', { replace: true });
        } else if (meData.user && !meData.user.user_type) {
          // If user exists but no role selected, redirect to role selection
          navigate('/auth/choose-role', { replace: true });
        } else if (meData.user && meData.user.user_type === 'supplier') {
          // If supplier, check if they have a profile
          if (meData && !meData.supplier) {
            navigate('/auth/supplier-setup', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else if (meData.user && meData.user.user_type === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          // For regular users or when no specific redirect URL, go to home
          // Check if there's a redirect URL in the query parameters
          const searchParams = new URLSearchParams(location.search);
          const redirectUrl = searchParams.get('after_sign_in_url');
          if (redirectUrl) {
            // Decode the URL-encoded redirect URL
            try {
              const decodedUrl = decodeURIComponent(redirectUrl);
              // Only redirect to relative URLs within our app
              if (decodedUrl.startsWith('/')) {
                navigate(decodedUrl, { replace: true });
              } else {
                navigate('/', { replace: true });
              }
            } catch (e) {
              navigate('/', { replace: true });
            }
          } else {
            navigate('/', { replace: true });
          }
        }
      }
    }
  }, [isLoaded, isSignedIn, meData, navigate, location]);

  // Show loading state while checking authentication
  if (!isLoaded || meData === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">{t('redirecting')}</p>
      </div>
    </div>
  );
}