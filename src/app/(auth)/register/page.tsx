"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone } from "lucide-react";
import { storeTokens } from "@/backend/features/auth/auth.client";
import { apiFetch } from "@/backend/lib/api-client";
import { apiUrl } from "@/backend/lib/api-url";
import type { MealTimings } from "@/backend/features/users/users.types";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { AuthShell } from "@/frontend/components/auth/AuthShell";
import { Badge } from "@/frontend/components/ui/Badge";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Field";

const TIMING_FIELDS: { key: keyof MealTimings; label: string }[] = [
  { key: "wakeUp", label: "Wake-up" },
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "highTea", label: "High tea" },
  { key: "dinner", label: "Dinner" },
  { key: "bedtime", label: "Bedtime" }
];

const GENDERS = ["male", "female", "other"] as const;

export default function RegisterPage() {
  const router = useRouter();
  const { t, formatMessage } = useTranslation();
  const [step, setStep] = useState<"details" | "otp" | "timings">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [mealTimings, setMealTimings] = useState<MealTimings>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, password, gender })
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Could not send OTP");
        return;
      }
      setDevCode(json.data?.devCode ?? null);
      setStep("otp");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/auth/register/verify"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp })
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.message || "Verification failed");
        return;
      }
      storeTokens(json.data.accessToken, json.data.refreshToken);
      setStep("timings");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Optional — best-effort save. Whether it succeeds or not, onboarding always continues to the
  // dashboard; the patient can set these anytime from their profile.
  async function handleSaveTimings(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await apiFetch("/users/profile", {
      method: "PATCH",
      body: JSON.stringify({ mealTimings })
    });
    router.push("/dashboard");
  }

  const stepNumber = step === "details" ? 1 : step === "otp" ? 2 : 3;

  return (
    <AuthShell
      title={
        step === "details"
          ? t("auth.register.title")
          : step === "otp"
            ? t("auth.register.verifyTitle")
            : "Set your daily routine"
      }
      subtitle={
        step === "details"
          ? t("auth.register.subtitle")
          : step === "otp"
            ? t("auth.register.verifySubtitle")
            : "Optional — helps time your medicine reminders. You can change this later."
      }
    >
      <Badge tone="blue">{formatMessage("auth.step", { current: stepNumber, total: 3 })}</Badge>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300"
        >
          <span>⚠️</span> {error}
        </motion.div>
      )}

      {step === "details" ? (
        <form onSubmit={handleDetails} className="flex flex-col gap-4">
          <Input
            id="name"
            label={t("auth.register.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g. Priya Sharma"
          />
          <Input
            id="phone"
            label={t("auth.register.phone")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            maxLength={10}
            placeholder="10-digit mobile number"
          />
          <Input
            id="password"
            label={t("auth.register.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
          />
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-200">
              {t("auth.register.gender")}
            </legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {GENDERS.map((g) => (
                <label
                  key={g}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 transition hover:border-primary-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={(e) => setGender(e.target.value)}
                    required
                    className="h-4 w-4 accent-primary-600"
                  />
                  <span>{t(`auth.register.genderOptions.${g}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Sending OTP…" : t("auth.register.submit")} <ArrowRight size={18} />
          </Button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {t("auth.register.haveAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              {t("auth.register.loginLink")}
            </Link>
          </p>
          <p className="text-center text-sm text-gray-500 dark:text-gray-500">
            {t("auth.login.doctorPrompt")}{" "}
            <Link
              href="/doctor/register"
              className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              {t("auth.login.doctorLink")}
            </Link>
          </p>
        </form>
      ) : step === "otp" ? (
        <form onSubmit={handleVerify} className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5 text-sm text-primary-700 dark:border-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
            <Smartphone size={16} />
            <span>
              We sent a 6-digit code to <strong>{phone}</strong>
            </span>
          </div>
          {devCode && (
            <div className="rounded-lg border border-warning-300 bg-warning-50 px-3 py-2 text-sm text-warning-800 dark:border-warning-800 dark:bg-warning-900/30 dark:text-warning-300">
              🧪 Dev code: <strong>{devCode}</strong>
            </div>
          )}
          <Input
            id="otp"
            label={t("auth.register.otp")}
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            placeholder="6-digit code"
            className="text-center text-xl font-bold tracking-[0.3em]"
          />
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Verifying…" : t("auth.register.verify")} <ArrowRight size={18} />
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep("details");
              setError(null);
            }}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ← Change details
          </button>
        </form>
      ) : (
        <form onSubmit={handleSaveTimings} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {TIMING_FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
                type="time"
                value={mealTimings[key] ?? ""}
                onChange={(e) =>
                  setMealTimings({ ...mealTimings, [key]: e.target.value || undefined })
                }
              />
            ))}
          </div>
          <Button type="submit" disabled={loading} size="lg" className="w-full">
            {loading ? "Saving…" : "Save & continue"} <ArrowRight size={18} />
          </Button>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Skip for now
          </button>
        </form>
      )}
    </AuthShell>
  );
}
