export const DAY = 24 * 3600e3;
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
export const iso = (t: number) => { const d = new Date(t); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
export const nightsBetween = (a?: string, b?: string) => (a && b ? Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY)) : 0);
