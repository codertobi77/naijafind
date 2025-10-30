
import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './router';

function App() {
  const [showTop, setShowTop] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(()=>{
    const onScroll = ()=>setShowTop(window.scrollY > 100);
    window.addEventListener('scroll', onScroll);
    // Onboarding auto au premier chargement
    if (!localStorage.getItem('onboarded')) setShowOnboarding(true);
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarded','1');
  };

  return (
    <BrowserRouter>
      <AppRoutes />
      {showTop && (
        <button
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}
          aria-label="Retour en haut"
          className="bg-green-600 hover:bg-green-700 text-white shadow rounded-full w-12 h-12 flex items-center justify-center animate-bounce transition-all"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <i className="ri-arrow-up-line text-2xl"></i>
        {/* End of button */}

        </button>
      )}
      <button style={{position:'fixed',bottom:24,left:24,zIndex:45}} className="bg-gray-50 border border-green-700 text-green-700 px-4 py-2 rounded-full shadow hover:bg-white text-xs font-bold" onClick={()=>setShowOnboarding(true)}>
        Voir le guide d'utilisation
      </button>
      {showOnboarding && (
        <div style={{position:'fixed',inset:0,zIndex:100,background:'#0006'}} className="flex items-center justify-center">
          <div className="bg-white p-6 max-w-lg w-full rounded-lg shadow-md relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={handleCloseOnboarding}><i className="ri-close-line text-2xl"></i></button>
            <div className="mb-3 flex items-center gap-2 text-green-700 text-xl font-bold"><i className="ri-seedling-fill"></i> Bienvenue sur NaijaFind !</div>
            <div className="mb-4 text-gray-800">Découvre comment profiter au maximum du service :</div>
            <ul className="space-y-3 mb-5">
              <li className="flex items-start gap-2"><i className="ri-search-line text-green-600 mt-1"></i> <span>Utilise la recherche et filtre les fournisseurs par catégorie, ville, note et distance.</span></li>
              <li className="flex items-start gap-2"><i className="ri-upload-cloud-2-line text-green-600 mt-1"></i> <span>Ajoute ton entreprise gratuitement depuis le bouton en haut à droite.</span></li>
              <li className="flex items-start gap-2"><i className="ri-dashboard-line text-green-600 mt-1"></i> <span>Accède à ton tableau de bord pour gérer produits, commandes et avis.</span></li>
              <li className="flex items-start gap-2"><i className="ri-vip-crown-2-fill text-yellow-500 mt-1"></i> <span>Profite des analyses avancées et fonctionnalités premium (en souscrivant à un abonnement).</span></li>
              <li className="flex items-start gap-2"><i className="ri-shield-user-line text-green-600 mt-1"></i> <span>Tes informations sont protégées, et notre équipe support reste disponible !</span></li>
            </ul>
            <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 rounded" onClick={handleCloseOnboarding}>Découvrir</button>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}

export default App;
