import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function ChooseRole() {
  const { user, isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'user' | 'supplier' | 'admin' | null>(null);
  const [loading, setLoading] = useState(false);
  const ensureUser = useMutation(api.users.ensureUser);
  const meData = useQuery(api.users.me, {});

  // Si l'utilisateur a déjà un rôle, rediriger (seulement une fois)
  useEffect(() => {
    if (isLoaded && isSignedIn && meData !== undefined && meData?.user?.user_type) {
      // Ne rediriger que si on n'est pas en train de charger un rôle
      if (loading) return;
      
      if (meData.user.user_type === 'supplier' && !meData.supplier) {
        navigate('/auth/supplier-setup', { replace: true });
      } else if (meData.user.user_type === 'supplier' && meData.supplier) {
        navigate('/dashboard', { replace: true });
      } else if (meData.user.user_type === 'admin') {
        navigate('/admin', { replace: true });
      } else if (meData.user.user_type === 'user') {
        navigate('/', { replace: true });
      }
    }
  }, [isLoaded, isSignedIn, meData, navigate, loading]);

  const handleRoleSelection = async (role: 'user' | 'supplier' | 'admin') => {
    if (!isLoaded || !user) return;

    // Vérifier que l'utilisateur peut choisir le rôle admin
    if (role === 'admin' && meData?.user?.is_admin !== true && meData?.user?.user_type !== 'admin') {
      alert('Vous n\'êtes pas autorisé à devenir administrateur. Contactez un administrateur existant pour obtenir les droits.');
      return;
    }

    setSelectedRole(role);
    setLoading(true);

    try {
      // Créer l'utilisateur avec le rôle choisi
      await ensureUser({
        user_type: role,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        phone: user.primaryPhoneNumber || undefined,
      });

      // Rediriger selon le rôle
      if (role === 'supplier') {
        navigate('/auth/supplier-setup');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error: any) {
      alert(error.message || 'Erreur lors de la sélection du rôle');
      setLoading(false);
    }
  };

  // Rediriger si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate('/auth/register');
    }
  }, [isLoaded, isSignedIn, navigate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <span className="text-3xl font-bold text-green-600" style={{ fontFamily: 'Pacifico, serif' }}>
            NaijaFind
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Choisissez votre rôle
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sélectionnez le type de compte qui correspond à vos besoins
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Utilisateur standard */}
            <button
              onClick={() => handleRoleSelection('user')}
              disabled={loading}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedRole === 'user'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <i className="ri-user-line text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acheteur</h3>
              <p className="text-sm text-gray-600">
                Recherchez et contactez des fournisseurs
              </p>
            </button>

            {/* Supplier */}
            <button
              onClick={() => handleRoleSelection('supplier')}
              disabled={loading}
              className={`p-6 rounded-lg border-2 transition-all text-left ${
                selectedRole === 'supplier'
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <i className="ri-store-line text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fournisseur</h3>
              <p className="text-sm text-gray-600">
                Créez votre profil d'entreprise et gérez vos produits
              </p>
            </button>

            {/* Admin - Seulement si l'utilisateur est déjà marqué comme admin */}
            {meData?.user?.is_admin === true || meData?.user?.user_type === 'admin' ? (
              <button
                onClick={() => handleRoleSelection('admin')}
                disabled={loading}
                className={`p-6 rounded-lg border-2 transition-all text-left ${
                  selectedRole === 'admin'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                  <i className="ri-shield-user-line text-2xl text-purple-600"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Administrateur</h3>
                <p className="text-sm text-gray-600">
                  Gérer la plateforme et les catégories
                </p>
              </button>
            ) : null}
          </div>

          {loading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              <p className="mt-2 text-sm text-gray-600">Traitement en cours...</p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link to="/" className="text-green-600 hover:text-green-500 font-medium text-sm">
              <i className="ri-arrow-left-line mr-1"></i>
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

