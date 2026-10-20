import type { Metadata } from "next";
import { Fiche } from "../../sheet";

export const metadata: Metadata = { title: "Fiche à imprimer", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  return <Fiche kind={kind} id={decodeURIComponent(id)} />;
}
