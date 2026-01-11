"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store";

export const AudioManager = () => {
  const { activeProject, isMuted } = useStore();
  
  // On garde les références des objets Audio en mémoire pour ne pas les recharger à chaque fois
  const crackleRef = useRef<HTMLAudioElement | null>(null);
  const startRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialisation (au chargement de la page)
  useEffect(() => {
    crackleRef.current = new Audio("/sounds/crackle.mp3");
    crackleRef.current.loop = true; // Le bruit de fond tourne en boucle
    crackleRef.current.volume = 0.4; // Pas trop fort

    startRef.current = new Audio("/sounds/start.mp3");
    startRef.current.volume = 0.6;
  }, []);

  // 2. Gestion du MUTE global
  useEffect(() => {
    if (crackleRef.current) {
        crackleRef.current.muted = isMuted;
    }
    if (startRef.current) {
        startRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // 3. Réaction aux changements de PROJETS
  useEffect(() => {
    if (!crackleRef.current || !startRef.current) return;

    if (activeProject !== null) {
      // --- UN PROJET EST ACTIVÉ ---
      
      // On lance le bruit de fond
      crackleRef.current.play().catch(() => {
        // Ignorer l'erreur si le navigateur bloque l'autoplay (classique)
      });

      // On lance le bruit de démarrage (Needle Drop)
      startRef.current.currentTime = 0; // Rembobiner
      startRef.current.play().catch(() => {});

    } else {
      // --- RETOUR À L'ACCUEIL ---
      
      // On coupe le son
      crackleRef.current.pause();
    }
  }, [activeProject]);

  return null; // Ce composant est invisible
};