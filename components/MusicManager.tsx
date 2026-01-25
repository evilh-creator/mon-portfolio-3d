/* DANS src/components/MusicManager.tsx */

import { useEffect, useRef } from "react";
import { useStore } from "@/store"; // Ton index.ts
import { projects } from "@/data/projects";

// 👇 L'export est bien là pour corriger l'erreur précédente
export const MusicManager = () => {
  // On récupère les états depuis ton store mis à jour
  const { activeProject, isMuted } = useStore();
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ---------------------------------------------------------
  // 1. GESTION DU BOUTON MUTE (TEMPS RÉEL)
  // ---------------------------------------------------------
  // Ce useEffect ne se déclenche que quand tu cliques sur le bouton Sound ON/OFF
  useEffect(() => {
    if (audioRef.current) {
      // La propriété native .muted coupe le son sans arrêter la lecture
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // ---------------------------------------------------------
  // 2. GESTION DES VINYLES (CHANGEMENT DE MUSIQUE)
  // ---------------------------------------------------------
  // Ce useEffect ne se déclenche que quand tu changes de projet
  useEffect(() => {
    
    // A. NETTOYAGE (Si une musique jouait déjà)
    if (audioRef.current) {
        const oldAudio = audioRef.current;
        let vol = oldAudio.volume;
        
        // Petit effet de fade-out rapide pour ne pas couper sec
        const fadeOut = setInterval(() => {
            if (vol > 0.05) { 
                vol -= 0.05; 
                oldAudio.volume = vol; 
            } else { 
                oldAudio.pause(); 
                clearInterval(fadeOut); 
            }
        }, 50);
    }

    // B. SI AUCUN PROJET ACTIF, ON S'ARRÊTE LÀ
    if (activeProject === null) return;

    // C. RÉCUPÉRATION DU FICHIER AUDIO
    const musicUrl = projects[activeProject]?.audio;
    
    // Sécurité : si le projet n'a pas de lien audio, on ne fait rien
    if (!musicUrl) return;

    // D. CRÉATION ET LECTURE DU NOUVEAU SON
    const audio = new Audio(musicUrl);
    audio.volume = 0.4; // Volume par défaut (40%)
    audio.loop = true;  // La musique boucle
    
    // CRUCIAL : On applique l'état Mute dès la naissance du son.
    // Si l'utilisateur est en "Sound OFF", la musique se lance en silence.
    audio.muted = isMuted; 
    
    // On lance la lecture (le délai de 1.5s doit être inclus dans le MP3 silence+craquement)
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise.catch((error) => {
            console.warn("Lecture audio bloquée par le navigateur (Autoplay policy)", error);
        });
    }
    
    // On stocke la référence pour pouvoir le couper plus tard
    audioRef.current = audio;

  }, [activeProject]); // Note : On ne met PAS 'isMuted' ici pour ne pas recharger le MP3 quand on mute.

  // Ce composant n'affiche rien visuellement
  return null;
};