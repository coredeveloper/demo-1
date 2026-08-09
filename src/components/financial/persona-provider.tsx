"use client";

/*
 * Financial-section persona context — the RBAC story. Persona changes scope,
 * visible views, KPI values, narrative, roster, and alert filtering. Persisted
 * in localStorage; deep-linkable via ?persona=<key>. Separate cast from the
 * survey app's persona-context by design (the two datasets don't join).
 */
import { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_PERSONA, PERSONAS } from "@/lib/financial/personas";
import type { PersonaDef } from "@/lib/financial/types";

type Ctx = {
  persona: PersonaDef;
  personaKey: string;
  setPersona: (key: string) => void;
};

const PersonaCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = "ph-fin-persona";

export function FinPersonaProvider({ children }: { children: React.ReactNode }) {
  const [personaKey, setPersonaKey] = useState<string>(DEFAULT_PERSONA);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("persona");
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = fromUrl && PERSONAS[fromUrl] ? fromUrl : stored && PERSONAS[stored] ? stored : null;
    if (initial) setPersonaKey(initial);
  }, []);

  const setPersona = (key: string) => {
    if (!PERSONAS[key]) return;
    setPersonaKey(key);
    try {
      window.localStorage.setItem(STORAGE_KEY, key);
    } catch {
      /* private mode */
    }
  };

  return (
    <PersonaCtx.Provider value={{ persona: PERSONAS[personaKey], personaKey, setPersona }}>
      {children}
    </PersonaCtx.Provider>
  );
}

export function useFinPersona(): Ctx {
  const ctx = useContext(PersonaCtx);
  if (!ctx) throw new Error("useFinPersona must be used inside FinPersonaProvider");
  return ctx;
}
