import { redirect } from "next/navigation";

/** La connexion se fait depuis « Mon espace » (profils de démonstration). */
export default function Connexion() {
  redirect("/espace");
}
