import type { Metadata } from "next";
import seed from "@/lib/seed.json";
import { BienView } from "@/components/demo/bien-view";

export function generateStaticParams() {
  return (seed.properties as { ref: string }[]).map((p) => ({ ref: p.ref }));
}

export async function generateMetadata({ params }: { params: Promise<{ ref: string }> }): Promise<Metadata> {
  const { ref } = await params;
  const p = (seed.properties as { ref: string; title: string; desc: string }[]).find((x) => x.ref === ref);
  return p ? { title: p.title, description: p.desc } : { title: "Bien introuvable" };
}

export default function Bien() {
  return <BienView />;
}
