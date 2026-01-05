import React from "react";
import { Language, resources, DEFAULT_LANGUAGE } from "../i18n";

type ContextType = {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: keyof typeof resources["ko"]) => string;
};

export const LanguageContext = React.createContext<ContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = React.useState<Language>(DEFAULT_LANGUAGE);

  const t = React.useCallback(
    (key: keyof typeof resources["ko"]) => {
      return resources[lang][key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
