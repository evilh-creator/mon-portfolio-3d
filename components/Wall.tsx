import React, { useLayoutEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export function Wall(props: any) {
  // Charge ton fichier mur.glb
  const { scene } = useGLTF('/models/mur.glb');

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        // CRUCIAL POUR L'AMBIANCE DARK UGC :
        // Le mur doit recevoir les ombres des objets (cadres, canapé...)
        child.receiveShadow = true; 
        
        // Le mur ne projette pas d'ombre (sauf s'il a du relief très fort)
        child.castShadow = false; 

        // Optimisation du matériau pour qu'il réagisse bien à la "lampe torche"
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (mat) {
            mat.roughness = 0.8; // Pas trop brillant (béton/plâtre)
            mat.metalness = 0.1; // Légère touche pour capter les reflets
            mat.envMapIntensity = 0.2; // Reste sombre dans le noir
        }
      }
    });
  }, [scene]);

  return <primitive object={scene} {...props} />;
}

// Préchargement pour éviter que le mur "pop" après le reste
useGLTF.preload('/models/mur.glb');