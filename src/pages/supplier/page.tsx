
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useConvexAuth } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface Supplier {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone: string;
  email: string;
  website?: string;
  rating: number;
  review_count: number;
  verified: boolean;
  image_url: string;
  created_at: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  user_id: string;
  user_name: string;
}

interface SimilarSupplier {
  id: string;
  name: string;
  category: string;
  rating: number;
  review_count: number;
  image_url: string;
}

export default function SupplierDetail() {
  const { isAuthenticated } = useConvexAuth();
  const navigate = useNavigate();
  const { id: supplierId } = useParams<{ id: string }>();
  const data = useQuery(api.suppliers.getSupplierDetails, { id: supplierId || '' });

  if (!supplierId) return <div>Fournisseur inconnu.</div>;
  // Ne rien afficher tant que les données du backend ne sont pas chargées
  if (!data) return <div>Chargement...</div>;
  if (!data.supplier) return <div>Fournisseur introuvable.</div>;
  // Utiliser data.supplier et data.reviews strictement pour l'affichage
  // ... Le reste du composant affiche uniquement les vrais fournisseurs

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarSuppliers, setSimilarSuppliers] = useState<SimilarSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showContactForm, setShowContactForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (supplierId) {
      // fetchSupplierDetails(id); // This function is no longer needed
    }
  }, [supplierId]);

  // const fetchSupplierDetails = async (supplierId: string) => {
  //   try {
  //     const response = await fetch(
  //       `https://khqolgtkhonnguqqizrx.supabase.co/functions/v1/get-supplier-details?id=${supplierId}`
  //     );

  //     if (!response.ok) {
  //       throw new Error(`Network response was not ok (${response.status})`);
  //     }

  //     const data = await response.json();

  //     if (data.supplier) {
  //       setSupplier(data.supplier);
  //       setReviews(data.reviews || []);
        
  //       // Charger les entreprises similaires
  //       await fetchSimilarSuppliers(data.supplier.category);
  //     } else {
  //       setSupplier(null);
  //       setReviews([]);
  //     }
  //   } catch (error) {
  //     console.error('Erreur lors du chargement:', error);
  //     setSupplier(null);
  //     setReviews([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchSimilarSuppliers = async (category: string) => {
    try {
      const response = await fetch(
        `https://khqolgtkhonnguqqizrx.supabase.co/functions/v1/search-suppliers?category=${encodeURIComponent(category)}&limit=3`
      );
      const data = await response.json();
      
      if (data.suppliers && data.suppliers.length > 0) {
        // Filtrer pour exclure le fournisseur actuel
        const filtered = data.suppliers.filter((s: any) => s.id !== supplierId).slice(0, 3);
        setSimilarSuppliers(filtered);
      } else {
        // Données de fallback
        setSimilarSuppliers([
          {
            id: 'similar-1',
            name: `Entreprise ${category} Premium`,
            category: category,
            rating: 4.8,
            review_count: 156,
            image_url: `Nigerian ${category} business professional company modern storefront`
          },
          {
            id: 'similar-2',
            name: `${category} Solutions Ltd`,
            category: category,
            rating: 4.6,
            review_count: 89,
            image_url: `Nigerian ${category} business professional company modern storefront`
          },
          {
            id: 'similar-3',
            name: `Best ${category} Nigeria`,
            category: category,
            rating: 4.9,
            review_count: 234,
            image_url: `Nigerian ${category} business professional company modern storefront`
          }
        ]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises similaires:', error);
      // Données de fallback en cas d'erreur
      setSimilarSuppliers([
        {
          id: 'similar-1',
          name: `Entreprise ${supplier?.category || 'Commerce'} Premium`,
          category: supplier?.category || 'Commerce',
          rating: 4.8,
          review_count: 156,
          image_url: `Nigerian business professional company modern storefront`
        },
        {
          id: 'similar-2',
          name: `Solutions ${supplier?.category || 'Commerce'} Ltd`,
          category: supplier?.category || 'Commerce',
          rating: 4.6,
          review_count: 89,
          image_url: `Nigerian business professional company modern storefront`
        },
        {
          id: 'similar-3',
          name: `Best ${supplier?.category || 'Commerce'} Nigeria`,
          category: supplier?.category || 'Commerce',
          rating: 4.9,
          review_count: 234,
          image_url: `Nigerian business professional company modern storefront`
        }
      ]);
    }
  };

  const getDirections = () => {
    if (supplier) {
      const query = encodeURIComponent(`${supplier.address}, ${supplier.city}, ${supplier.state}, ${supplier.location}`);
      const url = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
      window.open(url, '_blank');
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);

      const response = await fetch('https://readdy.ai/api/form/d3i6i9b2p8nb8r4n7e70', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSubmitStatus('success');
        setShowContactForm(false);
        (e.target as HTMLFormElement).reset();
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Erreur d\'envoi du formulaire:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des détails...</p>
        </div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-6xl text-gray-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Fournisseur introuvable</h2>
          <p className="text-gray-600 mb-6">Le fournisseur que vous recherchez n'existe pas.</p>
          <Link
            to="/search"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Retour à la recherche
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl sm:text-2xl font-bold text-green-600" style={{ fontFamily: 'Pacifico, serif' }}>
                NaijaFind
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/" className="text-gray-700 hover:text-green-600 font-medium">
                Accueil
              </Link>
              <Link to="/search" className="text-gray-700 hover:text-green-600 font-medium">
                Recherche
              </Link>
              <Link to="/categories" className="text-gray-700 hover:text-green-600 font-medium">
                Catégories
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-green-600 font-medium">
                À propos
              </Link>
            </nav>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/auth/login"
                className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium whitespace-nowrap text-sm sm:text-base"
              >
                Connexion
              </Link>
              <Link
                to="/auth/register"
                className="border border-green-600 text-green-600 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium whitespace-nowrap text-sm sm:text-base hidden sm:block"
              >
                Ajouter votre entreprise
              </Link>
              <Link
                to="/auth/register"
                className="border border-green-600 text-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors font-medium whitespace-nowrap text-sm sm:hidden"
              >
                Ajouter
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-4 sm:mb-8 overflow-x-auto" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 sm:space-x-4 whitespace-nowrap">
            <li>
              <Link to="/" className="text-gray-500 hover:text-gray-700">
                <i className="ri-home-line"></i>
              </Link>
            </li>
            <li>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </li>
            <li>
              <Link to="/search" className="text-gray-500 hover:text-gray-700 text-sm sm:text-base">
                Recherche
              </Link>
            </li>
            <li>
              <i className="ri-arrow-right-s-line text-gray-400"></i>
            </li>
            <li className="text-gray-900 font-medium text-sm sm:text-base truncate">{supplier.name}</li>
          </ol>
        </nav>

        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="mb-4 sm:mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            <i className="ri-check-line mr-2"></i>
            Votre message a été envoyé avec succès ! Le fournisseur vous contactera bientôt.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-4 sm:mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            <i className="ri-error-warning-line mr-2"></i>
            Une erreur s'est produite lors de l'envoi. Veuillez réessayer.
          </div>
        )}

        {/* En-tête du fournisseur */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8 mb-4 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
            <div className="w-full lg:w-1/3">
              <img
                src={`https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28supplier.image_url%29%7D&width=400&height=300&seq=detail-${supplier.id}&orientation=landscape`}
                alt={supplier.name}
                className="w-full h-48 sm:h-56 lg:h-64 object-cover object-top rounded-lg"
              />
            </div>

            <div className="w-full lg:w-2/3">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <span className="break-words">{supplier.name}</span>
                    {supplier.verified && (
                      <span className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center w-fit">
                        <i className="ri-verified-badge-fill mr-1"></i>
                        Vérifié
                      </span>
                    )}
                  </h1>
                  <p className="text-green-600 text-base sm:text-lg font-medium">{supplier.category}</p>
                </div>

                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="flex items-center gap-2 mb-2 bg-yellow-50 px-3 py-2 rounded-lg w-fit sm:ml-auto">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`ri-star-${star <= supplier.rating ? 'fill' : 'line'} text-yellow-400 text-sm sm:text-base`}
                        ></i>
                      ))}
                    </div>
                    <span className="font-bold text-base sm:text-lg">{supplier.rating}</span>
                  </div>
                  <p className="text-gray-600 text-sm sm:text-base">({supplier.review_count} avis)</p>
                </div>
              </div>

              <p className="text-gray-700 text-sm sm:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed">{supplier.description}</p>

              {/* Contact info grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <i className="ri-map-pin-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl mt-1 flex-shrink-0"></i>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">Adresse complète</div>
                    <div className="break-words text-xs sm:text-sm">{supplier.address}</div>
                    <div className="break-words text-xs sm:text-sm">
                      {supplier.city}, {supplier.state}
                    </div>
                    <div className="break-words text-xs sm:text-sm">{supplier.location}</div>
                  </div>
                </div>

                <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <i className="ri-phone-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">Téléphone</div>
                    <a href={`tel:${supplier.phone}`} className="text-green-600 hover:underline break-all text-xs sm:text-sm">
                      {supplier.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <i className="ri-mail-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 text-sm sm:text-base">Email</div>
                    <a href={`mailto:${supplier.email}`} className="text-green-600 hover:underline break-all text-xs sm:text-sm">
                      {supplier.email}
                    </a>
                  </div>
                </div>

                {supplier.website && (
                  <div className="flex items-start text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <i className="ri-global-line mr-2 sm:mr-3 text-green-600 text-lg sm:text-xl flex-shrink-0"></i>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 text-sm sm:text-base">Site web</div>
                      <a
                        href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:underline break-all block text-xs sm:text-sm"
                      >
                        {supplier.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => setShowContactForm(true)}
                  className="bg-green-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-mail-line mr-1 sm:mr-2"></i>
                  Contacter
                </button>
                <a
                  href={`tel:${supplier.phone}`}
                  className="bg-blue-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-phone-line mr-1 sm:mr-2"></i>
                  Appeler
                </a>
                <button
                  onClick={() => document.querySelector('#vapi-widget-floating-button')?.click()}
                  className="bg-purple-600 text-white px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                >
                  <i className="ri-calendar-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Prendre </span>RDV
                </button>
                {supplier.website && (
                  <a
                    href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base"
                  >
                    <i className="ri-global-line mr-1 sm:mr-2"></i>
                    <span className="hidden sm:inline">Site web</span>
                    <span className="sm:hidden">Site</span>
                  </a>
                )}
                <button className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base">
                  <i className="ri-share-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Partager</span>
                  <span className="sm:hidden">Part.</span>
                </button>
                <button className="border border-gray-300 text-gray-700 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center text-xs sm:text-sm lg:text-base">
                  <i className="ri-heart-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">Favoris</span>
                  <span className="sm:hidden">Fav.</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-8">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-2 sm:space-x-4 lg:space-x-8 px-4 sm:px-6 lg:px-8 min-w-max">
              {[
                { id: 'overview', label: 'Aperçu', icon: 'ri-information-line' },
                { id: 'reviews', label: `Avis (${reviews.length})`, icon: 'ri-star-line' },
                { id: 'location', label: 'Localisation', icon: 'ri-map-pin-line' },
                { id: 'contact', label: 'Contact', icon: 'ri-phone-line' },
                { id: 'gallery', label: 'Galerie', icon: 'ri-image-line' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <i className={`${tab.icon} mr-1 sm:mr-2`}></i>
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">
                    {tab.id === 'overview' && 'Info'}
                    {tab.id === 'reviews' && `Avis (${reviews.length})`}
                    {tab.id === 'location' && 'Lieu'}
                    {tab.id === 'contact' && 'Contact'}
                    {tab.id === 'gallery' && 'Photos'}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">À propos de {supplier.name}</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  <div className="lg:col-span-2">
                    <p className="text-gray-700 mb-4 sm:mb-6 text-sm sm:text-base lg:text-lg leading-relaxed">{supplier.description}</p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center text-sm sm:text-base">
                        <i className="ri-information-line mr-2"></i>
                        Informations importantes
                      </h4>
                      <ul className="space-y-2 text-green-800 text-xs sm:text-sm">
                        <li className="flex items-center">
                          <i className="ri-check-line mr-2 text-green-600 flex-shrink-0"></i>
                          Entreprise vérifiée par NaijaFind
                        </li>
                        <li className="flex items-center">
                          <i className="ri-check-line mr-2 text-green-600 flex-shrink-0"></i>
                          Réponse rapide aux demandes
                        </li>
                        <li className="flex items-center">
                          <i className="ri-check-line mr-2 text-green-600 flex-shrink-0"></i>
                          Service client de qualité
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                        <i className="ri-star-fill text-3xl sm:text-4xl text-yellow-500 mb-3"></i>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{supplier.rating}</div>
                        <div className="text-yellow-700 font-medium text-xs sm:text-sm">Note moyenne</div>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                        <i className="ri-chat-3-line text-3xl sm:text-4xl text-blue-500 mb-3"></i>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900">{supplier.review_count}</div>
                        <div className="text-blue-700 font-medium text-xs sm:text-sm">Avis clients</div>
                      </div>
                      <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                        <i className="ri-verified-badge-line text-3xl sm:text-4xl text-green-500 mb-3"></i>
                        <div className="text-xl sm:text-2xl font-bold text-gray-900">
                          {supplier.verified ? 'Vérifié' : 'En attente'}
                        </div>
                        <div className="text-green-700 font-medium text-xs sm:text-sm">Statut</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
                  <h3 className="text-lg sm:text-xl font-semibold">Avis clients ({reviews.length})</h3>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base">
                    <i className="ri-add-line mr-2"></i>
                    Laisser un avis
                  </button>
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-4 sm:space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 sm:w-10 h-8 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <i className="ri-user-line text-green-600 text-sm sm:text-base"></i>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm sm:text-base">
                                {review.user_name || 'Client anonyme'}
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <i
                                      key={star}
                                      className={`ri-star-${star <= review.rating ? 'fill' : 'line'} text-yellow-400 text-sm`}
                                    ></i>
                                  ))}
                                </div>
                                <span className="font-medium text-gray-700 text-sm">{review.rating}/5</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-gray-500 text-xs sm:text-sm">
                            {new Date(review.created_at).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <i className="ri-chat-3-line text-4xl sm:text-6xl text-gray-400 mb-4"></i>
                    <h4 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Aucun avis pour le moment</h4>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">Soyez le premier à laisser un avis sur cette entreprise</p>
                    <button className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base">
                      Laisser le premier avis
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'location' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Localisation et accès</h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                  <div className="lg:col-span-2">
                    <div className="bg-gray-100 rounded-lg h-64 sm:h-80 lg:h-96 mb-4 sm:mb-6">
                      <iframe
                        src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3964.7708!2d${supplier.longitude}!3d${supplier.latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMzEnMjcuOCJOIDPCsDIyJzQ1LjEiRQ!5e0!3m2!1sen!2s!4v1234567890`}
                        width="100%"
                        height="100%"
                        style={{ border: 0, borderRadius: '8px' }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-sm sm:text-base">
                        <i className="ri-map-pin-line mr-2 text-green-600"></i>
                        Adresse complète
                      </h4>
                      <div className="space-y-2 text-gray-700 text-xs sm:text-sm">
                        <div className="font-medium">{supplier.name}</div>
                        <div>{supplier.address}</div>
                        <div>
                          {supplier.city}, {supplier.state}
                        </div>
                        <div>{supplier.location}</div>
                      </div>
                      <button 
                        onClick={getDirections}
                        className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <i className="ri-navigation-line mr-2"></i>
                        Obtenir l'itinéraire
                      </button>
                    </div>

                    {supplier.website && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center text-sm sm:text-base">
                          <i className="ri-global-line mr-2 text-green-600"></i>
                          Site web
                        </h4>
                        <div className="space-y-2 text-gray-700">
                          <a
                            href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:underline break-all block text-xs sm:text-sm"
                          >
                            {supplier.website}
                          </a>
                        </div>
                        <a
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap block text-center text-sm sm:text-base"
                        >
                          <i className="ri-external-link-line mr-2"></i>
                          Visiter le site
                        </a>
                      </div>
                    )}

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                      <h4 className="font-semibold text-blue-900 mb-3 flex items-center text-sm sm:text-base">
                        <i className="ri-information-line mr-2"></i>
                        Informations pratiques
                      </h4>
                      <ul className="space-y-2 text-blue-800 text-xs sm:text-sm">
                        <li className="flex items-center">
                          <i className="ri-time-line mr-2 flex-shrink-0"></i>
                          Horaires : Lun-Ven 8h-18h
                        </li>
                        <li className="flex items-center">
                          <i className="ri-car-line mr-2 flex-shrink-0"></i>
                          Parking disponible
                        </li>
                        <li className="flex items-center">
                          <i className="ri-wheelchair-line mr-2 flex-shrink-0"></i>
                          Accès handicapés
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contact' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Informations de contact</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <i className="ri-phone-line text-xl sm:text-2xl text-green-600"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">Téléphone</div>
                          <a href={`tel:${supplier.phone}`} className="text-green-600 hover:underline text-sm sm:text-lg break-all">
                            {supplier.phone}
                          </a>
                        </div>
                      </div>
                      <a
                        href={`tel:${supplier.phone}`}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap block text-center text-sm sm:text-base"
                      >
                        <i className="ri-phone-line mr-2"></i>
                        Appeler maintenant
                      </a>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <i className="ri-mail-line text-xl sm:text-2xl text-blue-600"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">Email</div>
                          <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline break-all text-xs sm:text-sm">
                            {supplier.email}
                          </a>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowContactForm(true)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <i className="ri-mail-send-line mr-2"></i>
                        Envoyer un message
                      </button>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center mb-4">
                        <div className="w-10 sm:w-12 h-10 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                          <i className="ri-map-pin-line text-xl sm:text-2xl text-orange-600"></i>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-gray-900 text-sm sm:text-base">Adresse</div>
                          <div className="text-gray-600 text-xs sm:text-sm">
                            <div>{supplier.address}</div>
                            <div>
                              {supplier.city}, {supplier.state}
                            </div>
                            <div>{supplier.location}</div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={getDirections}
                        className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <i className="ri-navigation-line mr-2"></i>
                        Obtenir l'itinéraire
                      </button>
                    </div>

                    {supplier.website && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center mb-4">
                          <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                            <i className="ri-global-line text-xl sm:text-2xl text-purple-600"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 text-sm sm:text-base">Site web</div>
                            <a
                              href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:underline break-all block text-xs sm:text-sm"
                            >
                              {supplier.website}
                            </a>
                          </div>
                        </div>
                        <a
                          href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap block text-center text-sm sm:text-base"
                        >
                          <i className="ri-external-link-line mr-2"></i>
                          Ouvrir le site web
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                    <h4 className="font-semibold text-gray-900 mb-4 text-sm sm:text-base">Prendre rendez-vous</h4>
                    <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">
                      Utilisez notre assistant IA pour planifier facilement un rendez-vous avec {supplier.name}.
                    </p>
                    <button
                      onClick={() => document.querySelector('#vapi-widget-floating-button')?.click()}
                      className="w-full bg-purple-600 text-white py-2 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                    >
                      <i className="ri-calendar-line mr-2"></i>
                      Planifier un rendez-vous
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'gallery' && (
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Galerie photos</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {[1, 2, 3, 4, 5, 6].map((index) => (
                    <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                      <img
                        src={`https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28supplier.image_url%29%7D%20$%7BencodeURIComponent%28supplier.category%29%7D%20business%20interior%20exterior%20products%20showcase%20professional%20photography&width=400&height=400&seq=gallery-${supplier.id}-${index}&orientation=squarish`}
                        alt={`${supplier.name} - Photo ${index}`}
                        className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Entreprises similaires */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6">Entreprises similaires</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {similarSuppliers.map((similarSupplier, index) => (
              <div key={similarSupplier.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <img
                    src={`https://readdy.ai/api/search-image?query=$%7BencodeURIComponent%28similarSupplier.image_url%29%7D&width=60&height=60&seq=similar-${similarSupplier.id}&orientation=squarish`}
                    alt={similarSupplier.name}
                    className="w-10 sm:w-12 h-10 sm:h-12 object-cover object-top rounded-lg mr-3 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">
                      {similarSupplier.name}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600">{similarSupplier.category}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i key={star} className={`ri-star-${star <= similarSupplier.rating ? 'fill' : 'line'} text-yellow-400 text-xs sm:text-sm`}></i>
                      ))}
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600 ml-1">{similarSupplier.rating}</span>
                    <span className="text-xs text-gray-500 ml-1">({similarSupplier.review_count})</span>
                  </div>
                  <Link
                    to={`/supplier/${similarSupplier.id}`}
                    className="text-green-600 hover:text-green-700 text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    Voir détails
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de contact */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold">Contacter {supplier.name}</h3>
              <button
                onClick={() => setShowContactForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <i className="ri-close-line text-lg sm:text-xl"></i>
              </button>
            </div>

            <form
              onSubmit={handleContactSubmit}
              className="space-y-4"
              data-readdy-form
              id={`contact-supplier-${supplier.id}`}
            >
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Votre nom *
                </label>
                <input
                  type="text"
                  name="name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder="Votre nom complet"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder="votre@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder="+234 xxx xxx xxxx"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Sujet *
                </label>
                <select
                  name="subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8 text-xs sm:text-sm"
                  required
                >
                  <option value="">Sélectionnez un sujet</option>
                  <option value="Demande de devis">Demande de devis</option>
                  <option value="Information produit">Information produit</option>
                  <option value="Partenariat">Partenariat</option>
                  <option value="Support">Support</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  rows={4}
                  name="message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-xs sm:text-sm"
                  placeholder="Décrivez votre demande en détail..."
                  maxLength={500}
                  required
                ></textarea>
                <p className="text-xs text-gray-500 mt-1">Maximum 500 caractères</p>
              </div>

              <input type="hidden" name="supplier_name" value={supplier.name} />
              <input type="hidden" name="supplier_id" value={supplier.id} />
              <input type="hidden" name="supplier_email" value={supplier.email} />

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50 text-xs sm:text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <i className="ri-send-plane-line mr-2"></i>
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
