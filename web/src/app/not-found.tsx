import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-24 text-center">
      <h1 className="text-4xl font-extrabold">Page introuvable</h1>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center bg-ink px-5 font-semibold text-bg">Retour à l&apos;accueil</Link>
    </section>
  );
}
