/* DANS src/components/Turntable.tsx */
"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber"; // ❌ On a retiré GroupProps d'ici
import { MathUtils } from "three";

// ❌ Plus besoin d'interface compliquée
// interface TurntableProps ... (Supprimé)

// ✅ On accepte "props: any" pour que scale, rotation, onClick passent sans erreur
export const Turntable = (props: any) => {
  // On sépare "isPlaying" (pour la logique) du reste des props (pour le groupe)
  const { isPlaying, ...rest } = props;

  // On charge le modèle
  const { scene, nodes } = useGLTF("/models/turntable.glb") as any;

  useFrame((state, delta) => {
    // CIBLAGE (Si ton objet s'appelle "Cylinder.010" dans Blender, remplace "nodes.bras" par nodes["Cylinder.010"])
    const armPart = nodes.bras || nodes["Cylinder.010"];

    if (armPart) {
      // --- 1. MOUVEMENT HORIZONTAL (Y) ---
      const targetRotationY = isPlaying ? -0.6 : 0;

      // On applique la rotation Y
      armPart.rotation.y = MathUtils.lerp(
        armPart.rotation.y,
        targetRotationY,
        delta * 2
      );

      // --- 2. MOUVEMENT VERTICAL (X - LEVÉE) ---
      
      // On calcule la distance restante à parcourir horizontalement
      const distanceRestante = Math.abs(targetRotationY - armPart.rotation.y);

      // LOGIQUE :
      // Si la distance est grande (> 0.1), on lève le bras.
      // Si on est presque arrivé (ou au repos), on le baisse (0).
      
      const HAUTEUR_LEVEE = -0.2; // Ajuste si nécessaire
      
      const targetRotationX = distanceRestante > 0.1 ? HAUTEUR_LEVEE : -0.1;

      // On applique la rotation X (plus rapide pour être réactif)
      armPart.rotation.x = MathUtils.lerp(
        armPart.rotation.x,
        targetRotationX,
        delta * 4 
      );
    }
  });

  return (
    // ✅ C'est ici que "...rest" applique le scale={1} et rotation={...} venant du parent
    <group {...rest}>
      <primitive object={scene} />
    </group>
  );
};