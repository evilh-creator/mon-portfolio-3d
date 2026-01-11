"use client";

import { GroupProps } from "@react-three/fiber";

export const GoldRecord = (props: GroupProps) => {
  return (
    <group {...props}>
      {/* CADRE NOIR */}
      <mesh>
        <boxGeometry args={[0.8, 1, 0.05]} />
        <meshStandardMaterial color="#111" roughness={0.2} />
      </mesh>

      {/* FOND DU CADRE (Passe-partout) */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.7, 0.9, 0.01]} />
        <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
      </mesh>

      {/* LE DISQUE D'OR */}
      <mesh position={[0, 0.1, 0.04]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 64]} />
        <meshStandardMaterial 
            color="#FFD700" // Or
            metalness={1}   // Très métallique
            roughness={0.1} // Très brillant
        />
      </mesh>

      {/* PLAQUE DE TEXTE (Simulée en bas) */}
      <mesh position={[0, -0.3, 0.04]}>
         <boxGeometry args={[0.4, 0.1, 0.01]} />
         <meshStandardMaterial color="#FFD700" metalness={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
};