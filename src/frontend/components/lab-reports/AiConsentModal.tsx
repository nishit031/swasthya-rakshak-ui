"use client";

import { Modal } from "@/frontend/components/ui/Modal";
import { Button } from "@/frontend/components/ui/Button";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";

// Reusable AI-processing consent prompt, shown before the analyze and summarize flows.
// Presentational only — the caller performs the PATCH /users/profile and replays its action.
export function AiConsentModal({
  open,
  onClose,
  onAllow,
  loading
}: {
  open: boolean;
  onClose: () => void;
  onAllow: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Modal open={open} onClose={onClose} title={t("aiConsent.title")}>
      <div className="flex flex-col gap-4">
        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {t("aiConsent.body")}
        </p>
        <div className="flex gap-3">
          <Button onClick={onAllow} disabled={loading} className="flex-1">
            {loading ? t("common.loading") : t("aiConsent.allow")}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("aiConsent.notNow")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
