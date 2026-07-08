import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Lang, id, en, TranslationKey } from "./translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "id",
  setLang: () => {},
  t: (k: TranslationKey) => id[k] || k,
});

const translations: Record<Lang, Record<TranslationKey, string>> = { id, en };

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = localStorage.getItem("vw_lang");
    return saved === "en" ? "en" : "id";
  });

  useEffect(() => {
    localStorage.setItem("vw_lang", lang);
    document.documentElement.lang = lang === "id" ? "id" : "en";
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || id[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useTranslate = () => useContext(LanguageContext);
export const useT = () => useContext(LanguageContext).t;
