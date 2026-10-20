export type Status = "libre" | "réservé" | "occupé";

export interface Property {
  ref: string;
  title: string;
  type: string;
  mode: string;
  q: string;
  price: number;
  rooms: number;
  surface: number;
  status: Status;
  h: number;
  eq: string[];
  desc: string;
  cond: string;
}
