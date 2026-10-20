"use client";

import { useEffect } from "react";

/** Boule Immo Bell en 3D (canvas) : rendu branché séparément. */
export function HeroSphere() {
  useEffect(() => { import("@/lib/demo/engine/sphere").then((m) => m.startSphere()); }, []);
  return <canvas id="sphere" tabIndex={0} role="img" aria-label="Boule Immo Bell en 3D : la case Sawa sur son île, la pirogue du Ngondo sur le Wouri et les quartiers de Douala reliés. Glissez ou utilisez les flèches pour la faire tourner." />;
}
