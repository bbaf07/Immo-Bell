"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ROLES, fdt } from "@/lib/demo/consts";
import { Bell, BrandMark, Ic } from "@/lib/demo/icons";
import { loginAs, logout, mutate, resetDemo, syncSession, useDemo } from "@/lib/demo/store";
import { closeModal, initPrefs, openModal, setEco, setUI, toast, toggleLang, toggleMotion, toggleTheme, useUI } from "@/lib/demo/ui";
import { Awa } from "@/components/demo/awa-assistant";
import seed from "@/lib/demo/seed.json";
import { setTranslation, startReveal } from "@/lib/demo/dom-effects";
import { ModalHost } from "./modal-host";

const isEco = () => document.documentElement.classList.contains("eco");
const NAV: [string, string][] = [["/", "Accueil"], ["/biens", "Biens"], ["/services", "Services"], ["/juridique", "Pôle juridique"], ["/simulateur", "Simulateur"], ["/espace", "Mon espace"]];
const NOTE_ICON = (t: string) => /urgence|URG|intervention|serrure/i.test(t) ? "wrench" : /message/i.test(t) ? "msg" : /avis/i.test(t) ? "star" : /relevé|devis/i.test(t) ? "chart" : /pièce|dossier|attestation/i.test(t) ? "file" : /favori/i.test(t) ? "heart" : "home";

export const goTo = (v: string, tab?: string) => (v === "espace" ? `/espace${tab ? `?tab=${tab}` : ""}` : v === "home" ? "/" : `/${v}`);

export function Shell({ children }: { children: ReactNode }) {
  const ui = useUI(), S = useDemo(), path = usePathname();
  useEffect(() => {
    initPrefs();
    void syncSession();
    /* Fond animé et ouverture : moteurs de la maquette, chargés côté navigateur. */
    import("@/lib/demo/engine/bg").then((m) => m.startBg());
    import("@/lib/demo/engine/intro").then((m) => { if (!isEco()) m.startIntro(); });
    startReveal();
  }, []);
  /* Langue : traduit le texte affiché (et chaque mise à jour de React) ; remet le français sinon. */
  /* Léger délai : laisse React finir d'hydrater les zones différées avant de modifier le texte. */
  useEffect(() => { const t = setTimeout(() => setTranslation(ui.lang === "en"), 400); return () => clearTimeout(t); }, [ui.lang, path]);
  /* Notification « en direct » 6 s après la connexion à un profil (une fois par profil et par visite). */
  const role = S.user?.role, email = S.user?.email;
  useEffect(() => {
    if (!role || !email) return;
    const key = "ib_live_" + role;
    try { if (sessionStorage.getItem(key)) return; } catch { /* stockage indisponible : on notifie quand même */ }
    const t = setTimeout(() => {
      const [text, go] = (seed.NOTIF_LIVE as unknown as Record<string, [string, { v: string; tab?: string }]>)[role];
      try { sessionStorage.setItem(key, "1"); } catch { /* ignoré */ }
      mutate((s) => { s.notifs.unshift({ email, text, t: Date.now(), read: false, go }); });
      setUI({ ntoast: { text, go } });
    }, 6000);
    return () => clearTimeout(t);
  }, [role, email]);
  return (
    <>
      <Header />
      <main id="main" tabIndex={-1} className="wrap enter">{children}</main>
      <Footer />
      <ModalHost />
      <Awa />
      <NotifToast />
      <Toast />
    </>
  );
}

function Header() {
  const S = useDemo(), ui = useUI(), router = useRouter(), path = usePathname();
  const u = S.user;
  const cur = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  const mine = u ? S.notifs.filter((n) => n.email === u.email) : [];
  const unread = mine.filter((n) => !n.read).length;
  const first = u ? (/^(Mme|Me|M\.)$/.test(u.name.split(" ")[0]) ? u.name.split(" ").slice(0, 2).join(" ") : u.name.split(" ")[0]) : "";
  const readAll = () => mutate((s) => s.notifs.forEach((n) => { if (n.email === u?.email) n.read = true; }));
  const open = (i: number) => {
    const n = S.notifs[i]; if (!n) return;
    mutate((s) => { s.notifs[i].read = true; });
    setUI({ bell: false });
    const g = n.go ?? { v: "espace", tab: "notifs" };
    router.push(goTo(g.v || "espace", g.tab));
  };
  return (
    <>
      <a className="skip" href="#main">Aller au contenu</a>
      {ui.ecoAuto && (
        <div className="ecobar" role="status"><span>Connexion ou appareil limité détecté : le mode économie est activé (animations coupées).</span><button onClick={() => setEco(false)}>Réactiver les animations</button></div>
      )}
      <header className="top">
        <div className="wrap">
          <button className="brand" onClick={() => router.push("/")} aria-label="Immo Bell, accueil"><BrandMark /></button>
          <nav aria-label="Navigation principale">
            {NAV.map(([href, l]) => <button key={href} onClick={() => router.push(href)} aria-current={cur(href) ? "page" : undefined}>{l}</button>)}
          </nav>
          <div className="acct">
            <button className="langbtn" onClick={toggleLang} aria-label={ui.lang === "en" ? "Passer en français" : "Switch to English"} title={ui.lang === "en" ? "Français" : "English"}>
              {ui.lang === "en" ? <><span>FR</span>&nbsp;<b>EN</b></> : <><b>FR</b>&nbsp;<span>EN</span></>}
            </button>
            {u && (
              <div style={{ position: "relative" }}>
                <button className="bellbtn" onClick={() => setUI({ bell: !ui.bell })} aria-expanded={ui.bell} aria-haspopup="true" aria-label={`Notifications${unread ? ` (${unread} non lue${unread > 1 ? "s" : ""})` : ""}`}>
                  <Bell />{unread ? <span className="nb" aria-hidden="true">{unread > 9 ? "9+" : unread}</span> : null}
                </button>
                {ui.bell && (
                  <div className="npanel" role="region" aria-label="Notifications">
                    <header><b>Notifications</b>{unread ? <button onClick={readAll}>Tout marquer comme lu</button> : null}</header>
                    <div className="nlist">
                      {mine.length ? mine.slice(0, 30).map((x) => (
                        <button key={S.notifs.indexOf(x)} className={`nitem ${x.read ? "read" : ""}`} onClick={() => open(S.notifs.indexOf(x))}>
                          <span className="ni"><Ic n={NOTE_ICON(x.text)} /></span><span>{x.text}<small>{fdt(x.t)}</small></span><span className="dot" aria-label={x.read ? "" : "Non lue"} />
                        </button>
                      )) : <div className="nempty">Aucune notification pour l&apos;instant.</div>}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button className="motionbtn" onClick={toggleMotion} aria-pressed={ui.still} aria-label={ui.still ? "Relancer les animations" : "Mettre les animations en pause"}>
              {ui.still ? <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5l11 7-11 7z" /></svg> : <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></svg>}
            </button>
            <button className="themebtn" onClick={toggleTheme} aria-label={ui.dark ? "Passer au thème clair" : "Passer au thème sombre"} aria-pressed={ui.dark}>
              {ui.dark
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>}
            </button>
            {u ? <button className="btn ghost sm" onClick={() => setUI({ menu: !ui.menu })} aria-expanded={ui.menu}>{first}</button>
              : <button className="btn sm" onClick={() => openModal({ k: "auth", m: "login" })}>Connexion</button>}
            {ui.menu && u && (
              <div className="menu">
                <div><b>{u.name}</b><div className="small muted">{ROLES[u.role]} · {u.email || u.phone || ""}</div></div>
                <div className="eyebrow">Basculer le rôle (démo)</div>
                {Object.entries(ROLES).map(([k, l]) => <button key={k} className="btn ghost sm" disabled={u.role === k} onClick={() => { loginAs(k as keyof typeof ROLES & ("visitor" | "owner" | "legal" | "provider" | "admin")); setUI({ menu: false }); router.push("/espace"); }}>{l}</button>)}
                <button className="btn sm" onClick={() => { logout(); setUI({ menu: false }); router.push("/"); }}>Déconnexion</button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}

function Footer() {
  const ui = useUI(), router = useRouter();
  return (
    <footer>
      <div className="wrap">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Immo Bell" />
          <p className="muted small" style={{ marginTop: 12, maxWidth: "38ch" }}>Gestion locative et valorisation immobilière à Bonanjo et dans toute la ville de Douala. Un nom de prestige, une gestion d&apos;excellence.</p>
        </div>
        <div><div className="eyebrow">Contact</div><p className="small" style={{ marginTop: 8 }}>contact@immobell.cm<br />Bonanjo, Douala<br />Service après-vente : 8 h à 18 h<br /><span className="muted">Numéro unique : à communiquer</span></p></div>
        <div>
          <div className="eyebrow">Plateforme</div>
          <p className="small muted" style={{ marginTop: 8 }}>Prototype de démonstration. Les biens, avis et demandes sont des exemples enregistrés dans votre navigateur. Immo Bell n&apos;est pas le propriétaire des biens : elle étudie les dossiers et gère les demandes.</p>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn ghost sm" onClick={() => { resetDemo(); closeModal(); router.push("/"); toast("Démo réinitialisée."); }}>Réinitialiser la démo</button>
            <button className="btn ghost sm" onClick={() => { try { sessionStorage.removeItem("ib_intro"); } catch { /* ignoré */ } import("@/lib/demo/engine/intro").then((m) => m.startIntro(true)); }}>Revoir l&apos;ouverture</button>
            <Link className="btn ghost sm" href="/imprimer">Fiches à imprimer</Link>
            <button className="btn ghost sm" onClick={() => setEco(!ui.eco)} aria-pressed={ui.eco}>{ui.eco ? "Mode économie : activé" : "Mode économie : désactivé"}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Toast() {
  const ui = useUI();
  return <div id="toast" className="toast" role="status" aria-live="polite" hidden={!ui.toast}>{ui.toast}</div>;
}

/** Notification « live » : petit bandeau avec Awa, fermé automatiquement. */
function NotifToast() {
  const ui = useUI(), router = useRouter();
  useEffect(() => { if (!ui.ntoast) return; const t = setTimeout(() => setUI({ ntoast: null }), 6500); return () => clearTimeout(t); }, [ui.ntoast]);
  if (!ui.ntoast) return null;
  const n = ui.ntoast;
  return (
    <div className="ntoast" role="status">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/chars/ch_conseillere.webp" alt="" />
      <div><b>Nouvelle notification</b><span style={{ cursor: "pointer" }} onClick={() => { setUI({ ntoast: null }); if (n.go) router.push(goTo(n.go.v, n.go.tab)); }}>{n.text}</span></div>
      <button aria-label="Fermer" onClick={() => setUI({ ntoast: null })}>✕</button>
    </div>
  );
}
