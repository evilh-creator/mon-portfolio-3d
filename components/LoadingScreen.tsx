"use client";

import { useProgress } from "@react-three/drei";
import { useEffect, useState } from "react";

export const LoadingScreen = () => {
  const { progress } = useProgress();
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (progress === 100) {
      // Petit délai pour admirer le 100% avant le fade out
      const timer = setTimeout(() => {
        setFinished(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  return (
    <div 
      className={`fixed top-0 left-0 w-screen h-screen z-[9999] bg-black grid place-items-center transition-opacity duration-1000 
      ${finished ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <div className="flex flex-col items-center gap-4 w-full max-w-[600px] px-4">
        
        {/* TITRE MIS À JOUR */}
        <h1 className="text-white text-sm md:text-base font-bold uppercase tracking-[0.2em] mb-4 text-center leading-relaxed">
          Raphaël Liberge's <br/>
          <span className="text-gray-300">Portfolio</span>
        </h1>

        {/* BARRE */}
        <div className="w-full max-w-[300px] h-[2px] bg-gray-800 rounded-full overflow-hidden relative">
          <div 
            className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]"
            style={{ 
              width: `${progress}%`,
              transition: "width 0.2s ease-out" 
            }} 
          />
        </div>

        {/* POURCENTAGE */}
        <p className="text-gray-500 font-mono text-[10px] mt-2 text-center">
          {Math.round(progress)}%
        </p>

      </div>
    </div>
  );
};