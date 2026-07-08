import React from "react";
import { MessageCircle, Clock, ShieldCheck, ArrowUpRight } from "lucide-react";
import { useT } from "../i18n/LanguageContext";

export default function TabContact() {
  const t = useT();
  return (
    <div className="max-w-xl mx-auto space-y-4 text-left">
      <div className="rounded-2xl border border-vw-border/60 bg-vw-surface p-6 space-y-6">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-vw-text">{t("contact.title")}</h3>
          <p className="text-[11px] text-vw-muted">{t("contact.desc")}</p>
        </div>

        <div className="space-y-3">
          <a
            href="https://wa.me/6288983082523"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-4 rounded-xl border border-vw-border hover:bg-vw-accent-subtle transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                <MessageCircle size={15} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-vw-text">{t("contact.whatsapp")}</p>
                <p className="text-[10px] text-vw-muted">088983082523</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-vw-muted group-hover:text-vw-text transition-colors" />
          </a>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-vw-border bg-vw-accent-subtle">
            <div className="w-8 h-8 rounded-lg bg-vw-surface flex items-center justify-center border border-vw-border">
              <Clock size={15} className="text-vw-text" />
            </div>
            <div>
              <p className="text-xs font-bold text-vw-text">{t("contact.jam")}</p>
              <p className="text-[10px] text-vw-muted">{t("contact.jam.desc")}</p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-vw-border flex items-center gap-2 text-[10px] text-vw-muted font-medium">
          <ShieldCheck size={13} className="text-emerald-500" />
          <span>{t("contact.garansi")}</span>
        </div>
      </div>
    </div>
  );
}
