"use client";

import { useTexture } from "@react-three/drei";
import { useState } from "react";
// On n'a plus besoin du store ici car le son est géré ailleurs
// ni de useRef pour l'audio

export const Vinyl = (props: any) => {
  const { image, index, ...rest } = props;

  const texture = useTexture(image);
  const [hovered, setHover] = useState(false);

  // 🗑️ J'ai SUPPRIMÉ toute la partie "const audioRef..." et "playHoverSound"
  // C'est ça qui créait l'écho.

  return (
    <group 
      {...rest} 
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
        
        // 🗑️ SUPPRIMÉ : playHoverSound();
        
        if (props.onPointerOver) props.onPointerOver(e);
        if (props.onPointerEnter) props.onPointerEnter(e);
      }}
      onPointerOut={(e) => {
        setHover(false);
        document.body.style.cursor = 'auto';
        if (props.onPointerOut) props.onPointerOut(e);
      }}
      onClick={props.onClick}
    >
      <group position-x={hovered ? 0.2 : 0}> 
        
        {/* Disque Noir */}
        <mesh>
          <cylinderGeometry args={[1, 1, 0.02, 64]} />
          <meshStandardMaterial color="#111" roughness={0.1} metalness={0.5} />
        </mesh>

        {/* Macaron Recto */}
        <mesh position={[0, 0.011, 0]} rotation-x={-Math.PI / 2}>
          <circleGeometry args={[0.35, 32]} />
          <meshBasicMaterial map={texture as any} />
        </mesh>
        
        {/* Macaron Verso */}
        <mesh position={[0, -0.011, 0]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.35, 32]} />
          <meshBasicMaterial map={texture as any} />
        </mesh>

      </group>
    </group>
  );
};