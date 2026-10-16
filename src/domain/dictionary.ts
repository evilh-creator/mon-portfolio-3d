import type { DictionaryVersion } from "./action";

export interface DictionaryRecord {
  version: DictionaryVersion;
  created_at: string;
  label: string;
}

export const DICTIONARIES: readonly DictionaryRecord[] = [
  { version: "v2", created_at: "2026-01-01", label: "Dictionnaire V2 – saison 2026" },
];
