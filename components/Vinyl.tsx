"use client";

import { useTexture } from "@react-three/drei";
import { useState, useRef } from "react";
import { GroupProps } from "@react-three/fiber";
import { useStore } from "@/store"; // Pour vérifier si le son est coupé

interface VinylProps extends GroupProps {
  image: string;
  index: number;
}

export const Vinyl = ({ image, index, ...props }: VinylProps) => {
  const texture = useTexture(image);
  const [hovered, setHover] = useState(false);
  
  // Récupération de l'état Mute
  const isMuted = useStore((state) => state.isMuted);
  
  // Création du son (chargé une seule fois)
  // Assure-toi d'avoir le fichier public/sounds/hover.mp3
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  if (!audioRef.current && typeof window !== "undefined") {
      audioRef.current = new Audio("/sounds/hover.mp3");
      audioRef.current.volume = 0.2;
  }

  const playHoverSound = () => {
    if (isMuted || !audioRef.current) return;
    
    // Clone pour permettre des lectures rapides successives
    const sound = audioRef.current.cloneNode() as HTMLAudioElement;
    sound.volume = 0.2; 
    sound.play().catch(() => {});
  };

  return (
    <group 
      {...props} 
      onPointerOver={(e) => {
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = 'pointer';
        playHoverSound(); // <--- BING !
        if (props.onPointerEnter) props.onPointerEnter(e);
      }}
      onPointerOut={(e) => {
        setHover(false);
        document.body.style.cursor = 'auto';
        if (props.onPointerOut) props.onPointerOut(e);
      }}
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
          <meshBasicMaterial map={texture} />
        </mesh>
        
        {/* Macaron Verso */}
        <mesh position={[0, -0.011, 0]} rotation-x={Math.PI / 2}>
          <circleGeometry args={[0.35, 32]} />
          <meshBasicMaterial map={texture} />
        </mesh>

      </group>
    </group>
  );
};