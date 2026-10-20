import { NextResponse } from "next/server";

/**
 * Relais vers l'API FastAPI : l'adresse de l'API et la clé du modèle restent côté serveur.
 * Le navigateur ne parle qu'à ce point d'entrée, sur la même origine.
 */
const API_URL = process.env.IMMOBELL_API_URL;
const MAX_BODY = 48_000;

export async function POST(req: Request) {
  if (!API_URL) return NextResponse.json({ detail: "Assistant indisponible." }, { status: 503 });
  const body = await req.text();
  if (body.length > MAX_BODY) return NextResponse.json({ detail: "Conversation trop longue." }, { status: 413 });
  try {
    const r = await fetch(`${API_URL}/api/v1/assistant/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // transmet l'IP pour la limitation de débit côté API (à n'accepter que derrière le proxy de confiance)
        "X-Forwarded-For": req.headers.get("x-forwarded-for") ?? "",
        cookie: req.headers.get("cookie") ?? "",
      },
      body,
      signal: AbortSignal.timeout(60_000),
      cache: "no-store",
    });
    return new NextResponse(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ detail: "Assistant momentanément indisponible." }, { status: 502 });
  }
}
