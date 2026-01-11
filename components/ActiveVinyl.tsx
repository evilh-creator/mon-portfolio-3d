"use client";

import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { projects } from "@/data/projects";

interface ActiveVinylProps {
  projectIndex: number;
}

export const ActiveVinyl = ({ projectIndex }: ActiveVinylProps) => {
  const texture = useTexture(projects[projectIndex].image);
  const groupRef = useRef<Group>(null);

  // C'est ici que la boucle d'animation se fait (60fps)
  useFrame((state, delta) => {
    if (groupRef.current) {
      // On fait tourner sur l'axe Y
      // delta = le temps écoulé depuis la dernière image (pour que la vitesse soit constante)
      groupRef.current.rotation.y += delta * 1.5; // 1.5 = Vitesse de rotation (33 tours/min environ)
    }
  });

  return (
    <group 
      ref={groupRef}
      // Tes réglages de position validés :
      position={[-0.04, 0.15, 0]} 
      scale={0.15}
    >
      <mesh>
        <cylinderGeometry args={[1, 1, 0.02, 64]} />
        <meshStandardMaterial color="#111" roughness={0.1} />
      </mesh>
      
      <mesh position={[0, 0.0101, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.35, 32]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </group>
  );
};