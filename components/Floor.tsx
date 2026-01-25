/* DANS src/components/Floor.tsx */
import { useGLTF } from "@react-three/drei";

export const Floor = (props: any) => {
  // Le hook charge le modèle ET ses textures automatiquement
  const { scene } = useGLTF('/sol.glb');

  return (
    <primitive 
      object={scene} 
      {...props} // Permet de le bouger depuis Experience.tsx
    />
  );
};

useGLTF.preload('/sol.glb');