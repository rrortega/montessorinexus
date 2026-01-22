"use client";

import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from "react";
import enTranslations from "@/locales/en.json";

type Locale = "en" | "es";

interface I18nContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>("es"); // Default to Spanish as requested (keys are Spanish)

    // Cargar idioma desde localStorage al montar
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedLocale = localStorage.getItem("ceiba-locale") as Locale;
            if (savedLocale && (savedLocale === "en" || savedLocale === "es")) {
                setLocale(savedLocale);
            }
        }
    }, []);

    // Guardar idioma en localStorage cuando cambie
    const handleSetLocale = useCallback((newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem("ceiba-locale", newLocale);
    }, []);

    const t = useCallback((key: string): string => {
        if (locale === "en") {
            // Try to find translation in en.json
            const translation = (enTranslations as Record<string, string>)[key];
            return translation || key; // Fallback to original key (Spanish) if no translation found
        }
        return key; // Default to Spanish (the key itself)
    }, [locale]);

    const contextValue = useMemo(() => ({
        locale,
        setLocale: handleSetLocale,
        t
    }), [locale, handleSetLocale, t]);

    return (
        <I18nContext.Provider value={contextValue}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        return {
            locale: "es" as Locale,
            setLocale: () => { },
            t: (key: string) => key
        };
    }
    return context;
}
