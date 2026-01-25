"use client";

import { useTexture } from "@react-three/drei";
import { useState, useRef } from "react";
// ❌ ON A SUPPRIMÉ L'IMPORT DE GroupProps QUI FAISAIT PLANTER
import { useStore } from "@/store"; 

// ✅ On passe en "any" pour accepter toutes les props (scale, position, etc.) sans erreur
export const Vinyl = (props: any) => {
  // On extrait les variables spécifiques, et on garde le reste dans "...rest"
  const { image, index, ...rest } = props;

  const texture = useTexture(image);
  const [hovered, setHover] = useState(false);
  
  // Récupération de l'état Mute
  const isMuted = useStore((state) => state.isMuted);
  
  // Création du son
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio("/music/madef.mp3");
      audioRef.current.volume = 0.2;
  }

  const playHoverSound = () => {
    if (isMuted || !audioRef.current) return;
    
    const sound = audioRef.current.cloneNode() as HTMLAudioElement;
    sound.volume = 0.2; 
    sound.play().catch(() => {});
  };

  return (
    <group 
      {...rest} // 👈 C'est ici que le scale et la position du parent sont appliqués
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
        playHoverSound();
        // On appelle la fonction du parent si elle existe
        if (props.onPointerOver) props.onPointerOver(e);
        if (props.onPointerEnter) props.onPointerEnter(e);
      }}
      onPointerOut={(e) => {
        setHover(false);
        document.body.style.cursor = 'auto';
        if (props.onPointerOut) props.onPointerOut(e);
      }}
      // On s'assure que le clic passe aussi
      onClick={props.onClick}
    >
      {/* Animation légère au survol (Sort du rang) */}
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