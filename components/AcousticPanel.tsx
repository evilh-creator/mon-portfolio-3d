"use client";

import { GroupProps } from "@react-three/fiber";

export const AcousticPanel = (props: GroupProps) => {
  return (
    <mesh {...props}>
      {/* Un carré de 50cm x 50cm */}
      <boxGeometry args={[0.5, 0.5, 0.1]} />
      <meshStandardMaterial 
        color="#222222" // Gris anthracite
        roughness={1}   // Mousse très mate, ne reflète rien
        metalness={0}
      />
    </mesh>
  );
};