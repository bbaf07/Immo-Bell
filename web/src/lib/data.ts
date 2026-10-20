import seed from "./seed.json";
import type { Property } from "./types";

/** Coordonnées approchées des quartiers de Douala : [latitude, longitude]. */
export const QUARTIERS = seed.quartiers as unknown as Record<string, [number, number]>;
const SEED = seed.properties as Property[];

const API_URL = process.env.IMMOBELL_API_URL;

/**
 * Lit les biens depuis l'API FastAPI si IMMOBELL_API_URL est défini,
 * sinon renvoie les données de démonstration (utile tant que l'API n'est pas déployée).
 */
export async function getProperties(): Promise<Property[]> {
  if (API_URL) {
    try {
      const r = await fetch(`${API_URL}/api/v1/properties`, { next: { revalidate: 60 } });
      if (r.ok) return (await r.json()) as Property[];
    } catch {
      /* repli silencieux sur les données de démonstration */
    }
  }
  return SEED;
}

export async function getProperty(ref: string): Promise<Property | undefined> {
  return (await getProperties()).find((p) => p.ref === ref);
}

export const formatFCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/ /g, " ") + " FCFA";
