
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation, useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialUserType = searchParams.get('type') === 'supplier' ? 'supplier' : 'buyer';
  const [step, setStep] = useState(initialUserType === 'supplier' ? 2 : 1);
  const [userType, setUserType] = useState<'buyer' | 'supplier'>(initialUserType);
  const [formData, setFormData] = useState({
    // Informations personnelles
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    
    // Informations entreprise (pour fournisseurs)
    businessName: '',
    businessDescription: '',
    category: '',
    address: '',
    city: '',
    state: '',
    website: '',
    
    // Acceptation des conditions
    acceptTerms: false,
    acceptMarketing: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingUserType, setPendingUserType] = useState<'buyer' | 'supplier' | null>(null);
  const { signIn } = useAuthActions();
  const signUpBuyer = useMutation(api.users.signUpBuyer);
  const signUpSupplier = useMutation(api.users.signUpSupplier);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const meData = useQuery(api.users.me, {});
  const navigate = useNavigate();

  // Effect pour gérer l'inscription une fois l'utilisateur authentifié
  useEffect(() => {
    if (!isLoading && isAuthenticated && pendingUserType && !meData?.user) {
      const createUserProfile = async () => {
        try {
          if (pendingUserType === 'supplier') {
            await signUpSupplier({
              firstName: formData.firstName,
              lastName: formData.lastName,
              business_name: formData.businessName,
              email: formData.email,
              phone: formData.phone,
              description: formData.businessDescription,
              category: formData.category,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              website: formData.website,
            });
          } else {
            await signUpBuyer({
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
            });
          }
          setPendingUserType(null);
          setLoading(false);
        } catch (err: any) {
          console.error('Erreur lors de la création du profil:', err);
          setError(err?.message || 'Erreur lors de la création du profil');
          setPendingUserType(null);
          setLoading(false);
        }
      };
      createUserProfile();
    }
  }, [isLoading, isAuthenticated, pendingUserType, meData, signUpBuyer, signUpSupplier, formData]);

  // Effect pour rediriger selon le rôle
  useEffect(() => {
    if (!isLoading && isAuthenticated && meData?.user && !pendingUserType) {
      // Rediriger les utilisateurs déjà connectés selon leur rôle
      if (meData.user.user_type === 'supplier') {
        navigate('/dashboard');
      } else if (meData.user.user_type === 'user') {
        navigate('/');
      }
    }
  }, [isLoading, isAuthenticated, meData, navigate, pendingUserType]);

  const categories = [
    'Agriculture', 'Textile', 'Électronique', 'Alimentation', 
    'Construction', 'Automobile', 'Santé & Beauté', 'Éducation', 'Services'
  ];

  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
    'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
    'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
    'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!formData.acceptTerms) {
      setError('Vous devez accepter les conditions d\'utilisation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Création du compte utilisateur côté Convex Auth avec flow="signUp"
      await signIn('password', {
        flow: 'signUp',
        email: formData.email,
        password: formData.password,
      });
      
      // Définir le pendingUserType pour déclencher la création du profil dans le useEffect
      setPendingUserType(userType);
      
      // Le loading sera mis à false une fois le profil créé dans le useEffect
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la création du compte');
      setLoading(false);
      setPendingUserType(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center">
          <span className="text-3xl font-bold text-green-600" style={{ fontFamily: "Pacifico, serif" }}>
            NaijaFind
          </span>
        </Link>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Créer votre compte
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <Link to="/auth/login" className="font-medium text-green-600 hover:text-green-500">
            connectez-vous à votre compte existant
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center">
              {[1, 2, 3].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {stepNumber}
                  </div>
                  {stepNumber < 3 && (
                    <div className={`w-12 h-1 mx-2 ${
                      step > stepNumber ? 'bg-green-600' : 'bg-gray-200'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Étape {step} sur 3: {
                step === 1 ? 'Type de compte' :
                step === 2 ? 'Informations personnelles' :
                'Informations entreprise'
              }
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              <i className="ri-error-warning-line mr-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Étape 1: Type de compte */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Quel type de compte souhaitez-vous créer ?
                  </h3>
                  
                  <div className="space-y-4">
                    <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      userType === 'buyer' ? 'border-green-600 bg-green-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="userType"
                        value="buyer"
                        checked={userType === 'buyer'}
                        onChange={(e) => setUserType(e.target.value as 'buyer' | 'supplier')}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                          <i className="ri-shopping-cart-line text-2xl text-blue-600"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Acheteur</h4>
                          <p className="text-sm text-gray-600">
                            Je recherche des fournisseurs pour mon entreprise
                          </p>
                        </div>
                      </div>
                    </label>

                    <label className={`relative flex cursor-pointer rounded-lg border p-4 focus:outline-none ${
                      userType === 'supplier' ? 'border-green-600 bg-green-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="userType"
                        value="supplier"
                        checked={userType === 'supplier'}
                        onChange={(e) => setUserType(e.target.value as 'buyer' | 'supplier')}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                          <i className="ri-store-line text-2xl text-green-600"></i>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Fournisseur</h4>
                          <p className="text-sm text-gray-600">
                            Je veux promouvoir mon entreprise et mes produits
                          </p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Étape 2: Informations personnelles */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Nom *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+234 xxx xxx xxxx"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Mot de passe *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirmer le mot de passe *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            )}

            {/* Étape 3: Informations entreprise (pour fournisseurs) ou finalisation */}
            {step === 3 && (
              <div className="space-y-6">
                {userType === 'supplier' ? (
                  <>
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                        Nom de l'entreprise *
                      </label>
                      <input
                        type="text"
                        id="businessName"
                        name="businessName"
                        required
                        value={formData.businessName}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                        Catégorie *
                      </label>
                      <select
                        id="category"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 pr-8"
                      >
                        <option value="">Sélectionnez une catégorie</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="businessDescription" className="block text-sm font-medium text-gray-700">
                        Description de l'entreprise *
                      </label>
                      <textarea
                        id="businessDescription"
                        name="businessDescription"
                        required
                        rows={3}
                        value={formData.businessDescription}
                        onChange={handleChange}
                        maxLength={500}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Décrivez votre entreprise et vos produits/services..."
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          Ville *
                        </label>
                        <input
                          type="text"
                          id="city"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                          État *
                        </label>
                        <select
                          id="state"
                          name="state"
                          required
                          value={formData.state}
                          onChange={handleChange}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 pr-8"
                        >
                          <option value="">Sélectionnez un état</option>
                          {nigerianStates.map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                        Adresse complète *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        required
                        value={formData.address}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                        Site web (optionnel)
                      </label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://votre-site.com"
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ri-check-line text-2xl text-green-600"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Presque terminé !
                    </h3>
                    <p className="text-gray-600">
                      Acceptez les conditions pour finaliser votre inscription
                    </p>
                  </div>
                )}

                {/* Conditions d'utilisation */}
                <div className="space-y-4">
                  <div className="flex items-start">
                    <input
                      id="acceptTerms"
                      name="acceptTerms"
                      type="checkbox"
                      checked={formData.acceptTerms}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                      J'accepte les{' '}
                      <Link to="/privacy" className="text-green-600 hover:text-green-500">
                        conditions d'utilisation
                      </Link>{' '}
                      et la{' '}
                      <Link to="/privacy" className="text-green-600 hover:text-green-500">
                        politique de confidentialité
                      </Link>
                    </label>
                  </div>

                  <div className="flex items-start">
                    <input
                      id="acceptMarketing"
                      name="acceptMarketing"
                      type="checkbox"
                      checked={formData.acceptMarketing}
                      onChange={handleChange}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="acceptMarketing" className="ml-2 block text-sm text-gray-900">
                      J'accepte de recevoir des emails marketing et des mises à jour (optionnel)
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex justify-between">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 whitespace-nowrap"
                >
                  <i className="ri-arrow-left-line mr-2"></i>
                  Précédent
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="ml-auto flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                    Création...
                  </>
                ) : step < 3 ? (
                  <>
                    Suivant
                    <i className="ri-arrow-right-line ml-2"></i>
                  </>
                ) : (
                  <>
                    <i className="ri-check-line mr-2"></i>
                    Créer le compte
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-green-600 hover:text-green-500 font-medium">
            <i className="ri-arrow-left-line mr-1"></i>
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
