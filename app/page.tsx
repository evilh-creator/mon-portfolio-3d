"use client";

import { Canvas } from "@react-three/fiber";
import { Experience } from "@/components/Experience";
import { Overlay } from "@/components/Overlay";
import { LoadingScreen } from "@/components/LoadingScreen";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";

export default function Home() {
  return (
    <main className="relative h-screen w-screen bg-black overflow-hidden bg-[#020202]">
      
      <div className="absolute top-0 left-0 w-full h-full z-[100] pointer-events-none">
         <LoadingScreen />
      </div>

      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
        <Overlay />
      </div>

      <div className="absolute top-0 left-0 w-full h-full z-0">
       <Canvas 
          // 1. QUALITÉ : On remet la netteté pour les écrans HD/Retina
          dpr={[1, 1.5]} 
          performance={{ min: 0.5 }}
          style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100vw',  // Force la largeur fenêtre
      height: '100vh', // Force la hauteur fenêtre
      overflow: 'hidden'
   }}
          
          shadows={false}
          
          gl={{ 
            // 2. STABILITÉ : Ces réglages empêchent le clignotement
            autoClear: false,
            stencil: false,
            depth: true,
            alpha: false,
            
            // 3. PUISSANCE : On redonne toute la puissance au GPU
            powerPreference: "high-performance",
            antialias: false // On laisse le Post-Processing gérer, c'est plus performant
          }} 
          
          // 4. POSITION : On démarre DIRECTEMENT près (pas de zoom qui vient de loin)
          camera={{ position: [0, 2, 3], fov: 45 }} 
        >
          <color attach="background" args={["#111"]} />
          
          <Experience />

         

        </Canvas>
      </div>

    </main>
  );
}