import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Fusionne des classes Tailwind (même convention que shadcn/ui et 21st.dev). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
