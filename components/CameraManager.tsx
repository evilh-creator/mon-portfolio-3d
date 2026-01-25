"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useState } from "react";
import { useMobile } from "@/hooks/useMobile"; 
import { useStore } from "@/store"; 

export const CameraManager = () => {
  const focus = useStore((state) => state.focus);
  const isMobile = useMobile();
  
  // Valeur par défaut (Intro)
  // J'ai changé le Z de 8 à 4.5 pour que ce soit plus proche sur PC
  const [targetPosition] = useState(new Vector3(0, 2, 4.5));
  const [targetLookAt] = useState(new Vector3(0, 0, 0));

  useFrame((state, delta) => {
    // --- DÉFINITION DES POSITIONS CIBLES ---
    switch (focus) {
      case 'intro':
        if (isMobile) {
            // MOBILE : On recule pour éviter que ça coupe
            targetPosition.set(0, 4, 11);
            targetLookAt.set(0, -1, 0);
        } else {
            // ORDI : On rapproche ! (z était à 8, je le passe à 4.5)
            // Tu peux baisser à 4 ou 3.5 si tu veux encore plus près
            targetPosition.set(0, 1.5, 4.5);
            targetLookAt.set(0, 0, 0);
        }
        break;

      case 'rack':
        if (isMobile) {
            targetPosition.set(-1.5, 1, 3);
            targetLookAt.set(-2.4, 1, -1.5);
        } else {
            // Zoom sur le rack (PC)
            targetPosition.set(-1, 0.8, 1.5);
            targetLookAt.set(-2.4, 1, -1.5);
        }
        break;

      case 'turntable':
        if (isMobile) {
             targetPosition.set(0, 3, 1);
        } else {
             // Zoom sur la platine (PC)
             targetPosition.set(0, 1.5, 1.5);
        }
        targetLookAt.set(0, 0.7, -0.4);
        break;

      case 'poster':
        // Zoom sur le poster
        targetPosition.set(-0.8, 2.5, isMobile ? 4 : 1.8); 
        targetLookAt.set(-0.8, 2.5, 0);
        break;
        
      case 'board':
         // Zoom sur le tableau en liège
         targetPosition.set(3, 2.5, isMobile ? 3 : 1.2);
         targetLookAt.set(3, 2.5, -2.95);
         break;

      case 'experience':
        // Zoom sur l'ordi portable
        targetPosition.set(0.6, 1.5, isMobile ? 2.5 : 1.2);
        targetLookAt.set(0.6, 0.7, -0.3);
        break;
        
      case 'record':
        // Zoom sur le disque d'or
        targetPosition.set(1.2, 2.5, isMobile ? 3 : 1.5);
        targetLookAt.set(1.2, 2.5, 0);
        break;
    }

    // --- LISSAGE ---
    state.camera.position.lerp(targetPosition, 2 * delta);
    state.camera.lookAt(targetLookAt);
    
    // Synchro OrbitControls si existant
    if (state.controls) {
        const controls = state.controls as any;
        controls.target.lerp(targetLookAt, 2 * delta);
        controls.update();
    }
  });

  return null;
};