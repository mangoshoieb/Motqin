"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import RegionSelect from "@/components/RegionSelect";
import CountrySelect from "@/components/auth/CountrySelect";
import InviterCodeField from "@/components/auth/InviterCodeField";
import { EDUCATIONAL_STAGE_OPTIONS, GRADUATE_STAGE } from "@/app/constants/user.constants";
import { AccountType, getAccountType } from "@/app/lib/account-type";
import { AuthFieldErrors } from "@/app/lib/auth-field-errors";
import { SignupProfileFields } from "@/app/types/auth.types";
import { cn } from "@/app/lib/utils";

const EGYPT = 1;
const SECONDARY_STAGE = 3;
const UNIVERSITY_STAGE = 4;

// How many grades each stage has (the backend's rule).
const GRADES_IN_STAGE: Record<number, number> = { 1: 6, 2: 3, 3: 3, 4: 6, 5: 0 };
const ORDINALS = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
const gradeLabel = (stage: number, grade: number) =>
  `${stage === UNIVERSITY_STAGE ? "الفرقة" : "الصف"} ${ORDINALS[grade - 1]}`;

// Shown above the form for the accounts the teacher and parent sign-up
// pages make.
const ACCOUNT_NOTE: Partial<Record<AccountType, string>> = {
  Teacher: "تنشئ حساب معلم",
  Mentor: "تنشئ حساب ولي أمر أو مشرف",
};

// Whether a Google sign-up will go on to the phone step after this form:
// a Secondary student, a teacher or a parent.
export const needsPhoneAfterProfile = (accountType: AccountType, stage: number | null) =>
  accountType !== "Student" || stage === SECONDARY_STAGE;

export interface SignupDetailsResult {
  name: string;
  fields: SignupProfileFields;
}

interface SignupDetailsFormProps {
  initialName?: string;
  // Values typed earlier (Google: back from the phone step with an error).
  initial?: SignupDetailsResult | null;
  submitLabel: string;
  submitting?: boolean;
  // Field messages from the server, keyed as it sends them (Name, Country…).
  serverErrors?: AuthFieldErrors | null;
  // "always" on phone sign-up. "noPhoneStep" on Google: when a phone step
  // follows, the invite field is shown there instead.
  inviterCodeField?: "always" | "noPhoneStep";
  // Under the button, when a phone step follows (Google).
  phoneStepHint?: boolean;
  onSubmit: (result: SignupDetailsResult) => void;
}

const Choice = ({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={cn(
      "rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors",
      selected
        ? "border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-500/15 dark:text-blue-300"
        : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-500/60",
      className,
    )}
  >
    {children}
  </button>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-sm text-red-500 dark:text-red-400">{message}</p> : null;

/**
 * «بياناتك» — what a new account is made with, on phone sign-up
 * (/complete-profile) and Google sign-up (/google-phone). The account type
 * isn't asked here: it comes from the page the user signed up on (/sign-up,
 * /sign-up/teacher, /sign-up/parent — sessionStorage accountType). Stage and
 * grade are cards, the way Nagwa asks; teachers and parents skip them.
 */
export default function SignupDetailsForm({
  initialName = "",
  initial,
  submitLabel,
  submitting,
  serverErrors,
  inviterCodeField = "always",
  phoneStepHint,
  onSubmit,
}: SignupDetailsFormProps) {
  const [accountType, setType] = useState<AccountType>(initial?.fields.accountType ?? "Student");
  const [name, setName] = useState(initial?.name ?? initialName);
  const [country, setCountry] = useState<number | null>(initial?.fields.country ?? EGYPT);
  const [region, setRegion] = useState<number | null>(initial?.fields.region ?? null);
  const [stage, setStage] = useState<number | null>(initial?.fields.educationalStage ?? null);
  const [grade, setGrade] = useState<number | null>(initial?.fields.gradeLevel ?? null);
  const [errors, setErrors] = useState<AuthFieldErrors>({});

  // The type the sign-up page kept (sessionStorage, browser only).
  useEffect(() => {
    if (initial?.fields.accountType) return;
    const timeout = setTimeout(() => setType(getAccountType()), 0);
    return () => clearTimeout(timeout);
  }, [initial]);

  // A new answer from the server replaces what's shown.
  const [shownServerErrors, setShownServerErrors] = useState(serverErrors);
  if (serverErrors !== shownServerErrors) {
    setShownServerErrors(serverErrors);
    if (serverErrors) setErrors(serverErrors);
  }

  const clear = (...keys: string[]) =>
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((key) => delete next[key]);
      return next;
    });

  const isStudent = accountType === "Student";
  const inEgypt = country === EGYPT;
  const gradeCount = stage ? GRADES_IN_STAGE[stage] ?? 0 : 0;
  const nameError = errors.Name ?? errors.FullName;
  const phoneFollows = needsPhoneAfterProfile(accountType, stage);
  const showInviter =
    inviterCodeField === "always" || !phoneFollows || !!errors.InviterCode;

  // Messages for keys this form has no field for.
  const known = ["Name", "FullName", "Country", "Region", "EducationalStage", "GradeLevel", "InviterCode", "AccountType"];
  const otherErrors = Object.entries(errors)
    .filter(([key]) => !known.includes(key))
    .map(([, message]) => message);

  const submit = () => {
    const trimmed = name.trim();
    const next: AuthFieldErrors = {};
    if (trimmed.length < 3) next.Name = trimmed ? "الاسم يجب أن يحتوي على 3 أحرف على الأقل" : "الاسم مطلوب";
    else if (trimmed.length > 100) next.Name = "الاسم أطول من 100 حرف";
    if (!country) next.Country = "اختر الدولة";
    if (inEgypt && !region) next.Region = "اختر المحافظة";
    if (isStudent && !stage) next.EducationalStage = "اختر المرحلة الدراسية";
    if (isStudent && stage && gradeCount > 0 && !grade) next.GradeLevel = "اختر الصف الدراسي";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    const fields: SignupProfileFields = { country: country!, accountType };
    if (inEgypt && region) fields.region = region;
    if (isStudent && stage) {
      fields.educationalStage = stage;
      if (stage !== GRADUATE_STAGE && grade) fields.gradeLevel = grade;
    }
    onSubmit({ name: trimmed, fields });
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-6"
    >
      {ACCOUNT_NOTE[accountType] && (
        <p className="-mb-2 w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          {ACCOUNT_NOTE[accountType]}
        </p>
      )}
      {errors.AccountType && <FieldError message={errors.AccountType} />}

      {/* Name and place */}
      <CustomInput
        label="الاسم"
        placeholder="مثال: محمد أحمد"
        icon={<User size={18} />}
        value={name}
        maxLength={100}
        autoComplete="name"
        error={nameError}
        onChange={(event) => {
          setName(event.target.value);
          clear("Name", "FullName");
        }}
      />

      <div className={cn("grid gap-4", inEgypt && "sm:grid-cols-2")}>
        <CountrySelect
          value={country}
          onChange={(next) => {
            setCountry(next);
            if (next !== EGYPT) setRegion(null);
            clear("Country", "Region");
          }}
          error={errors.Country}
        />
        {inEgypt && (
          <RegionSelect
            value={region}
            onChange={(next) => {
              setRegion(next);
              clear("Region");
            }}
            error={errors.Region}
          />
        )}
      </div>

      {/* Stage and grade (students only) */}
      {isStudent && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-gray-600 dark:text-zinc-400">المرحلة الدراسية</legend>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {EDUCATIONAL_STAGE_OPTIONS.map((option) => (
              <Choice
                key={option.value}
                selected={stage === option.value}
                onClick={() => {
                  setStage(option.value);
                  // Keep the grade only if the new stage has it.
                  setGrade((g) => (g && g <= (GRADES_IN_STAGE[option.value] ?? 0) ? g : null));
                  clear("EducationalStage", "GradeLevel");
                }}
              >
                {option.label}
              </Choice>
            ))}
          </div>
          <FieldError message={errors.EducationalStage} />
        </fieldset>
      )}

      {isStudent && stage && gradeCount > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-gray-600 dark:text-zinc-400">
            {stage === UNIVERSITY_STAGE ? "الفرقة" : "الصف الدراسي"}
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: gradeCount }, (_, i) => i + 1).map((value) => (
              <Choice
                key={value}
                selected={grade === value}
                onClick={() => {
                  setGrade(value);
                  clear("GradeLevel");
                }}
              >
                {gradeLabel(stage, value)}
              </Choice>
            ))}
          </div>
          <FieldError message={errors.GradeLevel} />
        </fieldset>
      )}

      {showInviter && (
        <InviterCodeField error={errors.InviterCode} onChange={() => clear("InviterCode")} />
      )}

      {otherErrors.map((message) => (
        <FieldError key={message} message={message} />
      ))}

      <div className="flex flex-col gap-2">
        <CustomButton title={submitLabel} type="submit" disabled={submitting} className="w-full font-semibold" />
        {phoneStepHint && phoneFollows && (
          <p className="text-center text-xs text-gray-500 dark:text-zinc-400">
            بعدها نطلب رقم هاتفك ونرسل إليه رمز تحقق عبر واتساب.
          </p>
        )}
      </div>
    </form>
  );
}
