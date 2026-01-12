"use client";

import { useStore } from "@/store";
import { useFrame } from "@react-three/fiber";
import { Vector3 } from "three";
import { easing } from "maath";
import * as THREE from 'three';

export const CameraManager = () => {
  const focus = useStore((state) => state.focus);

  useFrame((state, delta) => {
    let targetPosition = new Vector3();
    let targetLookAt = new Vector3();

    switch (focus) {
      case 'intro':
        targetPosition.set(0, 2, 5);
        targetLookAt.set(0, 1.2, 0);
        break;

      case 'turntable':
        targetPosition.set(0, 1.7, 3);
        targetLookAt.set(0, 0.5, 0);
        break;

      case 'poster':
        // ZOOM POSTER
        // On descend la caméra à y=2.2 (au lieu de 2.5)
        targetPosition.set(-0.8, 1.5, -0.5); 
        targetLookAt.set(-0.8, 1.5, -3);
        break;

      case 'record':
        // ZOOM DISQUE D'OR
        // Idem, on descend à y=2.2
        targetPosition.set(1.2, 1.5, -0.5);
        targetLookAt.set(1.2, 1.5, -3);
        break;
    }

    easing.damp3(state.camera.position, targetPosition, 0.4, delta);
    
    const controls = state.controls as any;
    if (controls) {
      easing.damp3(controls.target, targetLookAt, 0.4, delta);
    }
  });
  // ... imports

useFrame((state, delta) => {
  // ... (code existant pour intro, poster, turntable...)

  // === AJOUTE CE BLOC ===
  if (focus === 'experience') {
    // 1. Position de la caméra (Juste au-dessus du carnet pour lire)
    // On se met en X=0.8 (aligné), Y=2.2 (en hauteur), Z=1 (un peu reculé)
    state.camera.position.lerp(new THREE.Vector3(0.8, 2.2, 1), 2 * delta);
    
    // 2. Point visé (Le carnet lui-même)
    // Coordonnées exactes de ton carnet : 0.8, 0.7, -0.2
    state.controls?.target.lerp(new THREE.Vector3(0.8, 0.7, -0.2), 2 * delta);
  }
});

  return null;
};