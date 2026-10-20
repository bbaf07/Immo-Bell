"use client";

import { useEffect, useRef, useState } from "react";
import { useDemo, getState, type Prop } from "@/lib/demo/store";

/** Visite à 360° : l'affiche d'abord, puis charge la visionneuse WebGL de la maquette au clic (pour économiser la connexion). */
export function TourSection({ p }: { p: Prop }) {
  const S = useDemo();
  const [on, setOn] = useState(false);
  const slot = useRef<HTMLDivElement>(null);
  useEffect(() => { setOn(false); }, [p.ref]);
  useEffect(() => {
    if (!on || !slot.current) return;
    let alive = true;
    import("@/lib/demo/engine/tour").then((m) => { if (alive && slot.current) m.mountTour(slot.current, p, () => getState().tours); });
    return () => { alive = false; import("@/lib/demo/engine/tour").then((m) => m.unmountTour()); };
  }, [on, p]);
  const mine = (S.tours[p.ref] ?? []).length;
  return (
    <section className="tour-sec" id="s-360" aria-labelledby="t360-h">
      <div className="row between" style={{ gap: 10, flexWrap: "wrap" }}><h2 id="t360-h">Visite à 360°</h2><span className="small muted">Glissez pour regarder autour de vous</span></div>
      <div id="tour-slot" className="tour-slot" data-ref={p.ref} ref={slot}>
        {!on && (
          <div className="tour-poster">
            <div className="tp-art" aria-hidden="true"><svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="60" cy="60" r="46" /><ellipse cx="60" cy="60" rx="46" ry="16" /><ellipse cx="60" cy="60" rx="16" ry="46" /><path d="M14 60h92M60 14v92" strokeWidth="1.5" /></svg></div>
            <div className="tp-body"><b style={{ fontSize: "1.1rem" }}>Visitez ce bien sans vous déplacer</b>
              <p className="small muted">Regardez dans toutes les directions, pièce par pièce. Le chargement ne démarre qu&apos;au clic, pour économiser votre connexion.</p>
              <div><button className="btn gold" onClick={() => setOn(true)}>Lancer la visite 360°</button></div>
              <p className="small muted">{mine ? "Photos 360° déposées par le propriétaire." : "Panoramas d'exemple générés pour la démonstration."}</p></div>
          </div>
        )}
      </div>
    </section>
  );
}
