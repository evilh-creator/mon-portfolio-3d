/* DANS src/components/LevitatingLogo.tsx */

import { Float, PresentationControls, useCursor, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useMemo } from "react";
import * as THREE from "three";

export const LevitatingLogo = (props: any) => {
  // État local (Autonome)
  const [isActive, setIsActive] = useState(false);
  
  const { scene } = useGLTF('/logooda.glb');
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHover] = useState(false);
  
  useCursor(hovered && !isActive);

  // --- CONFIG ---
  const localStartPos = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  const localStartScale = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  
  // Tes valeurs personnalisées
  const localTargetPos = useMemo(() => new THREE.Vector3(-5, 9.5, 12), []); 
  const localTargetScale = useMemo(() => new THREE.Vector3(1.5, 1.5, 1.5), []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    const speed = 4 * delta;
    
    const goalPos = isActive ? localTargetPos : localStartPos;
    const goalScale = isActive ? localTargetScale : localStartScale;

    groupRef.current.position.lerp(goalPos, speed);
    groupRef.current.scale.lerp(goalScale, speed);

    if (!isActive) {
        const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0));
        groupRef.current.quaternion.slerp(q, speed);
    }
  });

  return (
    <group {...props}>
      
      {/* SOCLE FIXE */}
      <group position={[0, -0.6, 0]}>
        <mesh receiveShadow>
            <cylinderGeometry args={[0.3, 0.4, 0.2, 32]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.28, 0.3, 32]} />
            <meshBasicMaterial color={isActive ? "#ffffff" : "#444"} toneMapped={false} />
        </mesh>
      </group>

      {/* GROUPE ANIMÉ */}
      <group ref={groupRef}>
          <PresentationControls
            enabled={isActive}
            global={false}
            cursor={isActive}
            snap={true}
            speed={2}
            zoom={1}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Infinity, Infinity]}
          >
            <Float speed={isActive ? 0 : 2} rotationIntensity={isActive ? 0 : 1} floatIntensity={isActive ? 0 : 1}>
                
                {/* HITBOX INVISIBLE */}
                <mesh 
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsActive(!isActive);
                    }}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                >
                    <boxGeometry args={[1, 1, 0.5]} />
                    <meshBasicMaterial transparent opacity={0} />
                </mesh>

                {/* LOGO */}
                <primitive 
                    object={scene}
                    scale={0.5} 
                    pointerEvents="none" 
                    rotation={[120 * (Math.PI / 180) / 2, 0, 2*Math.PI]}
                />
                
                <pointLight position={[0, -0.4, 0]} distance={1.5} intensity={0.07} color="white" />

                {/* J'AI SUPPRIMÉ LE BLOC <Html> ICI */}

            </Float>
          </PresentationControls>
      </group>

      {/* Zone de clic arrière pour fermer */}
      {isActive && (
         <mesh 
            position={[-5, 9.5, 12]} 
            onClick={(e) => { e.stopPropagation(); setIsActive(false); }} 
            visible={false}
         >
            <planeGeometry args={[20, 20]} />
         </mesh>
      )}
    </group>
  );
};

useGLTF.preload('/logooda.glb');