"use client";

import { useEffect } from "react";
import { useStore } from "@/store";
import { projects } from "@/data/projects";

// --- LA SOLUTION EST ICI ---
// On crée le lecteur EN DEHORS du composant.
// Il devient unique et global. React ne peut plus le dupliquer.
const globalAudio = typeof window !== "undefined" ? new Audio() : null;

export const MusicManager = () => {
  const { isMuted, activeProject } = useStore();

  // 1. Configuration initiale (Volume / Loop)
  useEffect(() => {
    if (globalAudio) {
      globalAudio.loop = true;
      globalAudio.volume = 0.5;
    }
    
    // Sécurité : Quand on quitte le site, on coupe tout
    return () => {
      if (globalAudio) globalAudio.pause();
    };
  }, []);

  // 2. Gestion de la lecture
  useEffect(() => {
    if (!globalAudio) return;

    // SCÉNARIO 1 : On doit couper le son
    // Si Mute est activé OU qu'aucun projet n'est sélectionné
    if (isMuted || activeProject === null) {
      globalAudio.pause();
      return;
    }

    // SCÉNARIO 2 : On doit jouer le son
    if (activeProject !== null && !isMuted) {
      const project = projects[activeProject];
      
      // Sécurité : Si le projet n'a pas de fichier audio, on coupe
      if (!project || !project.audio) {
          globalAudio.pause();
          return;
      }

      const musicPath = project.audio;

      // Est-ce qu'on change de musique ou c'est la même ?
      // On compare l'URL actuelle avec la nouvelle pour éviter de redémarrer le morceau à 0
      const currentSrc = globalAudio.src;
      // L'URL dans audio.src est absolue (http://...), musicPath est relatif (/music...)
      // Donc on vérifie si l'absolue CONTIENT la relative.
      if (!currentSrc.includes(musicPath)) {
         globalAudio.src = musicPath;
         globalAudio.load();
      }

      // On lance la lecture (avec gestion d'erreur navigateur)
      const playPromise = globalAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Autoplay bloqué (normal si pas d'interaction):", error);
        });
      }
    }
  }, [isMuted, activeProject]); // Se relance quand ces variables changent

  return null;
};