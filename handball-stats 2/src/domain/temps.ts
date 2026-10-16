export function formatChronoMs(ms: number): string {
  const totalSecondes = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSecondes / 60);
  const secondes = totalSecondes % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secondes).padStart(2, "0")}`;
}
