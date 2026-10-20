import type { Metadata } from "next";
import { Simulator } from "./simulator";

export const metadata: Metadata = { title: "Simulateur de loyer", description: "Calculez le loyer maximal conseillé selon votre revenu, avec la règle du tiers du pôle juridique." };

export default function Simulateur() {
  return (
    <section className="section">
      <h2 style={{ margin: "8px 0 8px" }}>Simulateur de budget et de loyer</h2>
      <p className="muted" style={{ maxWidth: "62ch", marginBottom: 28 }}>Même règle que celle du pôle juridique : le loyer, charges comprises, ne doit pas dépasser un tiers du revenu net mensuel.</p>
      <Simulator />
    </section>
  );
}
