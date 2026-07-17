"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone } from "lucide-react";
import { storeTokens } from "@/backend/features/auth/auth.client";
import { apiUrl } from "@/backend/lib/api-url";
import { useTranslation } from "@/frontend/components/providers/LanguageContext";
import { AuthShell } from "@/frontend/components/auth/AuthShell";
import { Badge } from "@/frontend/components/ui/Badge";
import { Button } from "@/frontend/components/ui/Button";
import { Input } from "@/frontend/components/ui/Field";

export default function DoctorRegisterPage() {
  const router = useRouter();
  const { t, formatMessage } = useTranslation();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [otp, setOtp] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleDetails(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/v1/auth/doctor/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          password,
          specialization,
          licenseNumber,
          clinicName
        })
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
      router.push("/doctor");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const detailsStep = step === "details";

  return (
    <AuthShell
      title={detailsStep ? t("auth.doctorRegister.title") : t("auth.register.verifyTitle")}
      subtitle={detailsStep ? t("auth.doctorRegister.subtitle") : t("auth.register.verifySubtitle")}
    >
      <Badge tone="blue">
        {formatMessage("auth.step", { current: detailsStep ? 1 : 2, total: 2 })}
      </Badge>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2.5 text-sm text-error-700 dark:border-error-800 dark:bg-error-900/30 dark:text-error-300"
        >
          <span>⚠️</span> {error}
        </motion.div>
      )}

      {detailsStep ? (
        <form onSubmit={handleDetails} className="flex flex-col gap-4">
          <Input
            id="name"
            label={t("auth.doctorRegister.fullName")}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="e.g. Dr. Priya Sharma"
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
          <Input
            id="specialization"
            label={t("auth.doctorRegister.specialization")}
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Cardiologist"
          />
          <Input
            id="licenseNumber"
            label={t("auth.doctorRegister.licenseNumber")}
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="Medical council registration number"
          />
          <Input
            id="clinicName"
            label={t("auth.doctorRegister.clinicName")}
            value={clinicName}
            onChange={(e) => setClinicName(e.target.value)}
            placeholder="e.g. City Care Clinic"
          />
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
            {t("auth.doctorRegister.patientPrompt")}{" "}
            <Link
              href="/register"
              className="font-semibold text-primary-600 hover:underline dark:text-primary-400"
            >
              {t("auth.doctorRegister.patientLink")}
            </Link>
          </p>
        </form>
      ) : (
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
      )}
    </AuthShell>
  );
}
