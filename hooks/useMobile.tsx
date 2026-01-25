import { useState, useEffect } from "react";

export const useMobile = () => {
  // On suppose false par défaut (pour le serveur)
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Vérification initiale
    checkMobile();

    // Écoute les redimensionnements
    window.addEventListener("resize", checkMobile);
    
    // Nettoyage
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
};