
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
    </BrowserRouter>
  );
}

export default App;
