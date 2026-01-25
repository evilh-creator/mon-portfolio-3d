import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { useStore } from "@/store"; 

const ITEMS = [
  { id: 1, type: 'video', title: 'ALLEMANDE SANS TOIT - mewa', videoId: 'T5KjYfrZYhY', img: '/textures/allemande1.jpg', x: -0.7, y: 0.4, rot: 0.05 },
  { id: 2, type: 'video', title: 'plus que tu le peux - mewa', videoId: 'l7J-TIg_ViQ', img: '/textures/plus1.jpg', x: 0.0, y: 0.45, rot: -0.02 },
  { id: 3, type: 'video', title: 'moi ou eux - mewa', videoId: 'wHL7i1zGLDk', img: '/textures/moi.jpg', x: 0.7, y: 0.35, rot: 0.08 },
  { id: 4, type: 'cover', title: 'Cover Allemande sans toit', img: '/textures/CoverAllemandesanstoitFINAL.jpg', x: -0.6, y: -0.35, rot: -0.1 },
  { id: 5, type: 'video', title: 'sousou - mewa', videoId: '2ZWPY3EVnIo', img: '/textures/sousou.jpg', x: 0.1, y: -0.3, rot: 0.03 },
  { id: 6, type: 'cover', title: 'Cover plus que tu le peux', img: '/textures/Plusquetulepeux-COVER.jpg', x: 0.75, y: -0.4, rot: -0.05 },
];

function Polaroid({ item, activeId, setActiveId }: any) {
  const mesh = useRef<THREE.Mesh>(null);
  const isActive = activeId === item.id;
  const isOtherActive = activeId !== null && activeId !== item.id;
  
  // ✅ On récupère setFocus pour pouvoir changer la caméra
  const { focus, setFocus } = useStore(); 
  
  const texture = useTexture(item.img);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    const targetPos = new THREE.Vector3(item.x, item.y, 0.06); 
    const targetRot = new THREE.Euler(0, 0, item.rot); 

    if (isActive) {
      targetPos.set(0, 0, 2.5); 
      targetRot.set(0, 0, 0); 
    }

    const speed = 4 * delta;
    mesh.current.position.lerp(targetPos, speed);
    const q = new THREE.Quaternion().setFromEuler(targetRot);
    mesh.current.quaternion.slerp(q, speed);
  });

  return (
    <mesh
      ref={mesh}
      position={[item.x, item.y, 0.05]}
      rotation={[0, 0, item.rot]}
      
      // --- C'EST ICI QUE ÇA SE PASSE ---
      onClick={(e) => {
        e.stopPropagation(); // On arrête le clic ici quoi qu'il arrive

        if (focus !== 'board') {
            // CAS 1 : On est loin -> On zoome sur le board
            setFocus('board');
        } else {
            // CAS 2 : On est déjà sur le board -> On ouvre la photo
            if (!isActive) setActiveId(item.id);
        }
      }}

      // On laisse le curseur pointer même de loin pour montrer que c'est cliquable
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      
      onPointerOut={(e) => {
         document.body.style.cursor = 'auto';
      }}
      
      scale={isActive ? 1.5 : 1} 
    >
      <boxGeometry args={[0.6, 0.75, 0.01]} />
      <meshStandardMaterial color="#f0f0f0" roughness={0.5} />

      <mesh position={[0, 0.08, 0.01]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial 
            map={texture as any} 
            color="#ffffff"
            roughness={0.2}
            metalness={0.1}
            envMapIntensity={0.5}
            transparent
            opacity={isOtherActive ? 0.3 : 1}
        />
      </mesh>

      <Text
        position={[0, -0.28, 0.02]} 
        fontSize={0.035}
        color="#222"
        anchorX="center"
        anchorY="middle"
      >
        {item.title.toUpperCase()}
      </Text>

      {isActive && item.type === 'video' && (
        <Html transform position={[0, 0.05, 0.02]} scale={0.12}>
          <div className="w-[450px] flex flex-col shadow-2xl rounded-lg overflow-hidden">
            <div className="bg-black text-white h-12 flex items-center justify-between px-4 w-full z-50">
                <span className="font-bold text-sm uppercase tracking-widest text-white/70">LECTURE</span>
                <button 
                    onClick={(e) => { e.stopPropagation(); setActiveId(null); }}
                    className="bg-red-600 hover:bg-red-700 text-white rounded px-3 py-1 text-xs font-bold transition-colors cursor-pointer"
                >
                    FERMER
                </button>
            </div>
            <div className="w-full h-[400px] bg-black">
                <iframe
                width="100%" height="100%"
                src={`https://www.youtube.com/embed/${item.videoId}?autoplay=1`}
                title="YouTube" frameBorder="0" allowFullScreen
                ></iframe>
            </div>
          </div>
        </Html>
      )}

      {isActive && (
         <mesh position={[0, 0, -0.1]} scale={[10, 10, 1]} onClick={(e) => { e.stopPropagation(); setActiveId(null); }}>
             <planeGeometry args={[10, 10]} />
             <meshBasicMaterial visible={false} />
         </mesh>
      )}

      <mesh position={[0, 0.35, 0.01]}>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshStandardMaterial color="#d93025" roughness={0.3} />
      </mesh>
    </mesh>
  );
}

export function Corkboard(props: any) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const focus = useStore((state) => state.focus);

  useEffect(() => {
    if (focus !== 'board') {
        setActiveId(null);
    }
  }, [focus]);

  return (
    <group {...props}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2.4, 1.8, 0.05]} />
        <meshStandardMaterial color="#3d2817" roughness={0.8} />
      </mesh>

      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[2.2, 1.6, 0.02]} />
        <meshStandardMaterial color="#a67b5b" roughness={1} /> 
      </mesh>

      <group position={[0, 0, 0.05]}>
        {ITEMS.map((item) => (
          <Polaroid key={item.id} item={item} activeId={activeId} setActiveId={setActiveId} />
        ))}
      </group>
    </group>
  );
}