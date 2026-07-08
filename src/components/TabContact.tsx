import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useT } from "../i18n/LanguageContext";

export default function TabContact() {
  const t = useT();

  return (
    <div className="w-full max-w-4xl animate-fade-in-up">
      {/* Header Section */}
      <div className="mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-vw-text mb-3">
          {t("contact.title")}
        </h2>
        <p className="text-base text-vw-muted max-w-xl leading-relaxed">
          {t("contact.desc")}
        </p>
      </div>

      {/* Grid Layout for contact methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Primary Contact: WhatsApp */}
        <a
          href="https://wa.me/6288983082523"
          target="_blank"
          rel="noreferrer"
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-vw-surface p-8 transition-all hover:bg-vw-accent hover:text-white border border-vw-border"
        >
          <div className="mb-12 flex items-start justify-between">
            <span className="text-xs font-semibold uppercase tracking-widest text-vw-muted group-hover:text-white/70">
              Direct line
            </span>
            <ArrowUpRight
              size={24}
              className="text-vw-muted transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-white"
            />
          </div>

          <div>
            <h3 className="mb-2 text-2xl font-semibold tracking-tight group-hover:text-white">
              {t("contact.whatsapp")}
            </h3>
            <p className="font-mono text-sm text-vw-muted group-hover:text-white/80">
              0889 8308 2523
            </p>
          </div>
        </a>

        {/* Info Block: Operational Hours */}
        <div className="flex flex-col justify-between rounded-2xl bg-transparent p-8 border border-vw-border">
          <div className="mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-vw-muted">
              Schedule
            </span>
          </div>

          <div>
            <h3 className="mb-2 text-xl font-semibold tracking-tight text-vw-text">
              {t("contact.jam")}
            </h3>
            <p className="text-sm text-vw-muted leading-relaxed">
              {t("contact.jam.desc")}
            </p>
          </div>
        </div>

      </div>

      {/* Guarantee Section */}
      <div className="mt-8 flex items-center gap-3 py-4 border-t border-vw-border">
        <div className="h-2 w-2 rounded-full bg-vw-accent"></div>
        <p className="text-sm font-medium text-vw-text">
          {t("contact.garansi")}
        </p>
      </div>

    </div>
  );
}
