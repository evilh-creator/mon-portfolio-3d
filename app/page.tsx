"use client";

import { Canvas } from "@react-three/fiber";
import { Experience } from "@/components/Experience";
import { Overlay } from "@/components/Overlay";
import { LoadingScreen } from "@/components/LoadingScreen";

export default function Home() {
  return (
    // MAIN : Prend tout l'écran, pas de scroll
    <main className="relative h-screen w-screen bg-black overflow-hidden">
      
      {/* 1. CHARGEMENT (Z-Index 100 - Tout devant) */}
      <div className="absolute top-0 left-0 w-full h-full z-[100] pointer-events-none">
         <LoadingScreen />
      </div>

      {/* 2. OVERLAY / INTERFACE (Z-Index 10 - Devant la 3D) */}
      {/* pointer-events-none laisse passer les clics au travers (sauf sur les boutons) */}
      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
        <Overlay />
      </div>

      {/* 3. SCÈNE 3D (Z-Index 0 - Au fond) */}
      <div className="absolute top-0 left-0 w-full h-full z-0">
        <Canvas
          shadows
          className="w-full h-full block" // Force le canvas à remplir la div
          camera={{ position: [0, 2, 5], fov: 30 }}
        >
          <color attach="background" args={["#111"]} />
          <Experience />
        </Canvas>
      </div>

    </main>
  );
}