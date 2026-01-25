"use client";

import { useEffect } from "react";
import { useStore } from "@/store";
import { projects } from "@/data/projects";

export const MusicManager = () => {
  const { isMuted, activeProject } = useStore();

  useEffect(() => {
    // 1. On récupère ou on crée le lecteur GLOBAL attaché à la fenêtre
    // @ts-ignore
    if (!window.globalAudioPlayer) {
      // @ts-ignore
      window.globalAudioPlayer = new Audio();
      // @ts-ignore
      window.globalAudioPlayer.loop = true;
      // @ts-ignore
      window.globalAudioPlayer.volume = 0.5;
    }

    // @ts-ignore
    const audio = window.globalAudioPlayer as HTMLAudioElement;

    // 2. LOGIQUE DE LECTURE
    const stopMusic = () => {
      if (!audio.paused) {
        audio.pause();
      }
    };

    // SCÉNARIO : Tout couper
    if (isMuted || activeProject === null) {
      stopMusic();
      return;
    }

    // SCÉNARIO : Jouer la musique
    if (activeProject !== null && !isMuted) {
      const project = projects[activeProject];

      if (!project || !project.audio) {
        stopMusic();
        return;
      }

      const musicPath = project.audio;

      // Si ce n'est pas la même musique, on change la source
      if (!audio.src.includes(musicPath)) {
        audio.src = musicPath;
        audio.load();
      }

      // On lance (si ce n'est pas déjà en lecture)
      if (audio.paused) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Lecture empêchée (normal si pas d'interaction) :", error);
          });
        }
      }
    }
  }, [isMuted, activeProject]);

  return null;
};