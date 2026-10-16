const LARGEUR = 800;
const HAUTEUR = 220;
const ESPACEMENT = 11;

/**
 * Toutes les lignes partagent la même fonction d'onde (seul `y0` varie) : elles restent donc
 * strictement parallèles, jamais sécantes — l'esprit "courbes de niveau" du fond de marque.
 */
function onde(x: number): number {
  return 16 * Math.sin((x / LARGEUR) * Math.PI * 2) + 7 * Math.sin((x / LARGEUR) * Math.PI * 5 + 1);
}

function chemin(y0: number): string {
  const segments = 20;
  const points: [number, number][] = Array.from({ length: segments + 1 }, (_, i) => {
    const x = (i / segments) * LARGEUR;
    return [x, y0 + onde(x)];
  });
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    d += ` Q ${x1},${y1} ${(x1 + x2) / 2},${(y1 + y2) / 2}`;
  }
  const [xf, yf] = points[points.length - 1];
  d += ` T ${xf},${yf}`;
  return d;
}

const NB_LIGNES = Math.ceil(HAUTEUR / ESPACEMENT) + 4;
const LIGNES = Array.from({ length: NB_LIGNES }, (_, i) => {
  const y0 = i * ESPACEMENT - ESPACEMENT * 2;
  const secondaire = i % 5 === 0;
  return { d: chemin(y0), secondaire };
});

/**
 * Motif décoratif "courbes de niveau" aux couleurs du club (fond de bannière). Purement
 * ornemental : masqué aux lecteurs d'écran, jamais support d'une information.
 */
export function FondLignes({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={`absolute inset-0 h-full w-full ${className}`}
    >
      {LIGNES.map((ligne, i) => (
        <path
          key={i}
          d={ligne.d}
          fill="none"
          stroke={ligne.secondaire ? "var(--color-club-secondary)" : "var(--color-club-primary)"}
          strokeWidth={ligne.secondaire ? 1.4 : 1.1}
          opacity={ligne.secondaire ? 0.55 : 0.35}
        />
      ))}
    </svg>
  );
}
