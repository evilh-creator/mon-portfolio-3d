/* src/components/SceneAssets.tsx */
"use client";

import React from 'react';
import { useGLTF } from '@react-three/drei';
import { GroupProps } from '@react-three/fiber';

// --- COMPOSANT TABLE ---
export function TableModel(props: GroupProps) {
  // On charge le fichier
  const { scene } = useGLTF('/table.glb');
  // On retourne la scène 3D brute dans un groupe pour pouvoir la positionner
  return <primitive object={scene} {...props} />;
}

// --- COMPOSANT SOFA ---
export function SofaModel(props: GroupProps) {
  const { scene } = useGLTF('/sofa.glb');
  return <primitive object={scene} {...props} />;
}

// --- COMPOSANT MOUSSE ACOUSTIQUE ---
export function AcousticFoamModel(props: GroupProps) {
  const { scene } = useGLTF('/acousticfoam.glb');
  return <primitive object={scene} {...props} />;
}

// Pré-chargement des assets pour éviter qu'ils "pop" à l'écran
useGLTF.preload('/table.glb');
useGLTF.preload('/sofa.glb');
useGLTF.preload('/acousticfoam.glb');