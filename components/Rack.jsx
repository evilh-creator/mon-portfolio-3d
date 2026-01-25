"use client";

import { useGLTF } from "@react-three/drei";

export function Rack(props) {
  // On charge le modèle depuis le dossier public
  // Si le fichier est dans /public/models/, mets "/models/rack.glb"
  const { scene } = useGLTF("/rack.glb");

  return (
    <primitive 
      object={scene} 
      // On active les ombres pour que ce soit réaliste
      castShadow 
      receiveShadow
      // On passe les "props" (position, rotation, scale) données par le parent
      {...props} 
    />
  );
}

// Pré-chargement du modèle pour éviter les délais d'apparition
useGLTF.preload("/rack.glb");