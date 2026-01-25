"use client";

import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { useState } from "react";
import { useMobile } from "@/hooks/useMobile"; 
import { useStore } from "@/store"; // 👈 AJOUT : On importe le store ici

export const CameraManager = () => { // 👈 PLUS DE PROPS (C'est vide ici)
  
  // 1. On récupère le focus directement depuis le store
  const focus = useStore((state) => state.focus);
  
  const isMobile = useMobile();
  
  const [targetPosition] = useState(new Vector3(0, 3, 8));
  const [targetLookAt] = useState(new Vector3(0, 0, 0));

  useFrame((state, delta) => {
    // --- DÉFINITION DES POSITIONS CIBLES ---
    switch (focus) {
      case 'intro':
        if (isMobile) {
            targetPosition.set(0, 4, 11);
            targetLookAt.set(0, -1, 0);
        } else {
            targetPosition.set(0, 3, 8);
            targetLookAt.set(0, 0, 0);
        }
        break;

      case 'rack':
        if (isMobile) {
            targetPosition.set(-1.5, 1, 3);
            targetLookAt.set(-2.4, 1, -1.5);
        } else {
            targetPosition.set(-1, 1, 1.5);
            targetLookAt.set(-2.4, 1, -1.5);
        }
        break;

      case 'turntable':
        if (isMobile) {
             targetPosition.set(0, 3, 1);
        } else {
             targetPosition.set(0, 2, 2);
        }
        targetLookAt.set(0, 0.7, -0.4);
        break;

      case 'poster':
        targetPosition.set(-0.8, 2.5, isMobile ? 4 : 2); 
        targetLookAt.set(-0.8, 2.5, 0);
        break;
        
      case 'board':
         targetPosition.set(3, 2.5, isMobile ? 3 : 1);
         targetLookAt.set(3, 2.5, -2.95);
         break;

      case 'experience':
        targetPosition.set(0.6, 1.5, isMobile ? 2.5 : 1.5);
        targetLookAt.set(0.6, 0.7, -0.3);
        break;
        
      case 'record':
        targetPosition.set(1.2, 2.5, isMobile ? 3 : 1.5);
        targetLookAt.set(1.2, 2.5, 0);
        break;
    }

    // --- LISSAGE ---
    state.camera.position.lerp(targetPosition, 2 * delta);
    state.camera.lookAt(targetLookAt);
    
    // Si tu as OrbitControls activé ailleurs, ça aide à synchroniser la cible
    if (state.controls) {
        const controls = state.controls as any;
        controls.target.lerp(targetLookAt, 2 * delta);
        controls.update();
    }
  });

  return null;
};