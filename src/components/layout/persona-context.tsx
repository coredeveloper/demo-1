"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Persona = {
  id: string;
  role: string;
  name: string;
  /** null = sees every facility (regional). Otherwise scoped to this facility id. */
  facilityId: string | null;
  facilityLabel: string | null;
};

// Demo personas. Default is the regional officer (the demo opens at the
// division heat-map, then switches to the DON to drill into one facility).
export const PERSONAS: Persona[] = [
  { id: "regional", role: "Regional Compliance Officer", name: "Division Southeast", facilityId: null, facilityLabel: null },
  { id: "don-fleming", role: "Director of Nursing", name: "Sarah Okafor", facilityId: "fleming-island", facilityLabel: "Fleming Island" },
  { id: "don-macon", role: "Director of Nursing", name: "Marcus Reed", facilityId: "macon", facilityLabel: "Macon" },
];

type Ctx = { persona: Persona; setPersonaId: (id: string) => void };
const PersonaContext = createContext<Ctx | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>(PERSONAS[0]!);
  const setPersonaId = (id: string) =>
    setPersona(PERSONAS.find((p) => p.id === id) ?? PERSONAS[0]!);
  return <PersonaContext.Provider value={{ persona, setPersonaId }}>{children}</PersonaContext.Provider>;
}

export function usePersona(): Ctx {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error("usePersona must be used within PersonaProvider");
  return ctx;
}

/** "Sarah Okafor, DON" style actor label for evidence trails. */
export function actorLabel(persona: Persona): string {
  return persona.facilityId ? `${persona.name}, DON` : persona.name;
}
