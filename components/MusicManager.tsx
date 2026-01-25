"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { projects } from "@/data/projects";

export const MusicManager = () => {
  const { isMuted, activeProject } = useStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Initialisation de l'objet Audio (une seule fois)
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio();
      audioRef.current.loop = true; // Musique en boucle ? (À toi de voir)
      audioRef.current.volume = 0.5;
    }
  }, []);

  // 2. Gestion Play / Pause / Changement de piste
  useEffect(() => {
    if (!audioRef.current) return;

    // CAS A : Tout couper (Mute activé OU Pas de vinyle sur la platine)
    if (isMuted || activeProject === null) {
      audioRef.current.pause();
      return;
    }

    // CAS B : On a un vinyle et le son est ON -> On joue
    if (activeProject !== null && !isMuted) {
      // On récupère le chemin de la musique du projet
      const musicPath = projects[activeProject].audio; // Assure-toi que tes projets ont une propriété "music"
      
      // Si c'est une nouvelle musique, on change la source
      // (On compare src pour éviter de recharger si c'est déjà la bonne)
      if (!audioRef.current.src.includes(musicPath)) {
         audioRef.current.src = musicPath;
         audioRef.current.load();
      }

      // On lance la lecture
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Lecture bloquée par le navigateur (normal au début):", error);
        });
      }
    }
  }, [isMuted, activeProject]); // <-- Ce useEffect se relance à chaque changement d'état

  return null; // Ce composant n'affiche rien, il gère juste le son
};