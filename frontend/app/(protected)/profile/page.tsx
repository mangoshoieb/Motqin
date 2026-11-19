"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import Skeleton from "@/components/ui/Skeleton";
import { PHOTO_TYPES, useUploadProfilePhoto } from "@/app/hooks/useUploadProfilePhoto";
import { useUpdateMe } from "@/app/hooks/useUpdateMe";
import {
  educationalStageLabel,
  EDUCATIONAL_STAGE_OPTIONS,
  GRADE_LEVEL_OPTIONS,
  GRADUATE_STAGE,
  gradeLevelLabel,
} from "@/app/constants/user.constants";
import RegionSelect from "@/components/RegionSelect";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
import { useCountries, useEgyptianGovernorates } from "@/app/hooks/useLookups";
import { findLookupItem } from "@/app/types/lookup.types";
import { isEgypt, isPlaceholderEmail, NAME_MAX, ProfileErrors, profileErrors } from "@/app/lib/profile";
import { UpdateMeRequest } from "@/app/types/auth.types";
import GoalsManager from "@/components/Profile/GoalsManager";
import DescriptionField from "@/components/Profile/DescriptionField";

const PROFILE_IMAGE = "/my-notion-face-portrait.png";
const PHOTO_ERROR = "الصورة غير مدعومة أو أكبر من 6 ميجا";

const readonlyBox =
  "rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const editBox = "w-full rounded-xl border bg-white px-4 py-3 dark:bg-zinc-900";
const editBorder = (error?: string) =>
  error ? "border-red-400 dark:border-red-500/60" : "border-zinc-400 dark:border-zinc-700";

const Dash = () => <span className="text-zinc-400">—</span>;
const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{message}</p> : null;

interface ProfileForm {
  name: string;
  // The governorate as the API numbers it; null until one is chosen.
  region: number | null;
  educationalStage: number;
  gradeLevel: number;
}

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useCurrentUser();

  const [isEditing, setIsEditing] = useState(false);

  // Local preview shown while the upload is in flight; cleared once
  // /users/me comes back with the stored photoUrl.
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { mutate: uploadPhoto, isPending: isUploading } = useUploadProfilePhoto();

  const handlePhotoChange = (file: File | undefined) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    uploadPhoto(file, {
      onSuccess: () => toast.success("تم تحديث الصورة الشخصية"),
      onError: (error) => {
        setPhotoPreview(null);
        const rejected =
          error.message === "unsupported" ||
          error.message === "too-large" ||
          (axios.isAxiosError(error) && error.response?.status === 400);
        toast.error(rejected ? PHOTO_ERROR : "تعذر رفع الصورة، حاول مرة أخرى.");
      },
      onSettled: () => URL.revokeObjectURL(preview),
    });
  };

  const photoSrc = photoPreview ?? user?.photoUrl ?? PROFILE_IMAGE;

  // Both may come back as the enum name ("Egypt", "Cairo") or the number;
  // the lookups turn either into the Arabic label and the integer.
  const { data: countries } = useCountries();
  const { data: governorates } = useEgyptianGovernorates();
  const countryLabel = findLookupItem(countries, user?.country)?.nameAr;
  const region = findLookupItem(governorates, user?.region);
  const inEgypt = isEgypt(user?.country);
  const isGraduate = user?.educationalStage === GRADUATE_STAGE;

  const [form, setForm] = useState<ProfileForm>({ name: "", region: null, educationalStage: 0, gradeLevel: 0 });
  const [errors, setErrors] = useState<ProfileErrors>({});
  const { mutate: updateMe, isPending: isSavingProfile } = useUpdateMe();
  const formIsGraduate = form.educationalStage === GRADUATE_STAGE;

  const startEditing = () => {
    if (!user) return;
    setForm({
      name: user.fullName ?? "",
      region: region?.value ?? null,
      educationalStage: user.educationalStage ?? 0,
      gradeLevel: user.gradeLevel ?? 0,
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
  };

  // PUT /users/me with only the fields that changed (the rest are kept).
  const handleSave = () => {
    if (!user) return;
    const name = form.name.trim();
    const next: ProfileErrors = {};
    if (!name) next.fullName = "الاسم مطلوب";
    else if (name.length > NAME_MAX) next.fullName = `الاسم أطول من ${NAME_MAX} حرف`;
    if (!formIsGraduate && !form.gradeLevel) next.gradeLevel = "اختر الصف الدراسي";
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    const payload: UpdateMeRequest = {};
    if (name !== user.fullName) payload.fullName = name;
    // The governorate can be changed, not cleared.
    if (inEgypt && form.region && form.region !== region?.value) payload.region = form.region;
    if (form.educationalStage && form.educationalStage !== user.educationalStage) {
      payload.educationalStage = form.educationalStage;
    }
    if (!formIsGraduate && form.gradeLevel !== user.gradeLevel) payload.gradeLevel = form.gradeLevel;

    if (!Object.keys(payload).length) {
      setIsEditing(false);
      return;
    }

    updateMe(payload, {
      onSuccess: () => {
        toast.success("تم حفظ التغييرات");
        setErrors({});
        setIsEditing(false);
      },
      onError: (error) => {
        const fieldErrors = profileErrors(error);
        setErrors(fieldErrors);
        if (fieldErrors.general) toast.error(fieldErrors.general);
      },
    });
  };

  return (
    <main className=" px-6 py-10   bg-[var(--surface)] overflow-hidden">
      <div className="flex  gap-5 mt-5 max-md:flex-col " dir="rtl">
        {/* Photo */}
        <div className="flex-1 flex-col gap-10">
          <div
            className="rounded-3xl h-90 md:h-[80vh] border border-zinc-200 bg-zinc-100 p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex h-full flex-col items-center justify-center">
              <label className="group relative cursor-pointer">
                <input
                  type="file"
                  accept={PHOTO_TYPES.join(",")}
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    handlePhotoChange(e.target.files?.[0]);
                    // Allow picking the same file again after a failure.
                    e.target.value = "";
                  }}
                />

                <div className="relative">
                  {photoSrc === PROFILE_IMAGE ? (
                    <Image
                      src={PROFILE_IMAGE}
                      alt="الصورة الشخصية"
                      width={220}
                      height={220}
                      className="h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56 rounded-full border-4 border-zinc-200 object-cover transition duration-300 group-hover:brightness-75 dark:border-zinc-700"
                    />
                  ) : (
                    // Remote/blob URL: plain <img> avoids next/image's
                    // remote-host allowlist for the API's storage domain.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoSrc}
                      alt="الصورة الشخصية"
                      className="h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56 rounded-full border-4 border-zinc-200 object-cover transition duration-300 group-hover:brightness-75 dark:border-zinc-700"
                    />
                  )}

                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white">
                      <Loader2 className="animate-spin" size={28} />
                    </div>
                  )}

                  {/* Change Icon */}
                  <div className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-blue-600 dark:bg-blue-700 text-white shadow-lg transition group-hover:scale-110">
                    <Camera size={18} />
                  </div>
                </div>
              </label>

              <p className="mt-6 text-sm text-zinc-500">
                {isUploading ? "جاري رفع الصورة..." : "اضغط على الصورة لتغييرها"}
              </p>
              <p className="mt-1 text-xs text-zinc-400">JPEG أو PNG أو WebP، حتى 6 ميجا</p>
            </div>
          </div>
          <GoalsManager />
        </div>

        {/* Information */}

        <div className="rounded-2xl flex-1 border border-zinc-300 bg-zinc-100 overflow-hidden p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold">المعلومات الشخصية</h2>

            {!isEditing ? (
              <button
                onClick={startEditing}
                disabled={isLoading || isError || !user}
                className="rounded-xl border border-zinc-300 px-5 py-2 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                تعديل
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="rounded-xl border border-zinc-300 px-5 py-2 transition hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  إلغاء
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSavingProfile}
                  className="rounded-xl bg-blue-600 dark:bg-blue-700 px-5 py-2 text-white transition hover:bg-blue-700 dark:hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[52px] w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-[52px] w-full" />
              <Skeleton className="h-[52px] w-full" />
              <Skeleton className="h-[52px] w-full" />
            </div>
          ) : isError || !user ? (
            <p className="text-sm text-red-500 dark:text-red-400">
              تعذر تحميل بيانات الحساب. حاول تحديث الصفحة.
            </p>
          ) : (
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="mb-2 block font-medium">الاسم</label>
              {isEditing ? (
                <>
                  <input
                    value={form.name}
                    maxLength={NAME_MAX}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    className={`${editBox} ${editBorder(errors.fullName)}`}
                  />
                  <FieldError message={errors.fullName} />
                </>
              ) : (
                <div className={readonlyBox}>{user.fullName || <Dash />}</div>
              )}
            </div>

            {/* Region — Egypt only */}
            {inEgypt && (
              <div>
                {isEditing ? (
                  <RegionSelect
                    value={form.region}
                    onChange={(value: number) => setForm((prev) => ({ ...prev, region: value }))}
                    error={errors.region}
                  />
                ) : (
                  <>
                    <label className="mb-2 block font-medium">المحافظة</label>
                    <div className={readonlyBox}>
                      {region?.nameAr ?? <span className="text-zinc-400">اختر المحافظة</span>}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Description — saves on its own */}
            <DescriptionField description={user.description ?? null} />

            <div className="my-8 border-t border-zinc-200 dark:border-zinc-800" />

            {/* Stage and grade */}
            <div>
              <label className="mb-2 block font-medium">المرحلة التعليمية</label>
              {isEditing ? (
                <>
                  <select
                    value={form.educationalStage || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, educationalStage: Number(e.target.value) }))}
                    className={`${editBox} ${editBorder(errors.educationalStage)}`}
                  >
                    {!form.educationalStage && <option value="">اختر المرحلة</option>}
                    {EDUCATIONAL_STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors.educationalStage} />
                </>
              ) : (
                <div className={readonlyBox}>{educationalStageLabel(user.educationalStage)}</div>
              )}
            </div>

            {/* Graduates have no grade */}
            {(isEditing ? !formIsGraduate : !isGraduate) && (
              <div>
                <label className="mb-2 block font-medium">الصف الدراسي</label>
                {isEditing ? (
                  <>
                    <select
                      value={form.gradeLevel || ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, gradeLevel: Number(e.target.value) }))}
                      className={`${editBox} ${editBorder(errors.gradeLevel)}`}
                    >
                      {!form.gradeLevel && <option value="">اختر الصف</option>}
                      {GRADE_LEVEL_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <FieldError message={errors.gradeLevel} />
                  </>
                ) : (
                  <div className={readonlyBox}>{gradeLevelLabel(user.gradeLevel)}</div>
                )}
              </div>
            )}

            {/* Readonly — email, phone and country have their own flows */}
            <div>
              <label className="mb-2 block font-medium">البريد الإلكتروني</label>
              <div className={readonlyBox} dir="ltr" style={{ textAlign: "right" }}>
                {isPlaceholderEmail(user.email) ? <Dash /> : user.email}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">رقم الهاتف</label>

              <div dir="ltr" className={`${readonlyBox} text-right`}>
                {user.phoneNumber ? (
                  <span className="flex items-center justify-end gap-2">
                    {user.phoneNumberConfirmed && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                        مؤكد
                      </span>
                    )}
                    {user.phoneNumber}
                  </span>
                ) : (
                  <Dash />
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">الدولة</label>
              <div className={readonlyBox}>{countryLabel ?? <Dash />}</div>
            </div>

            {user.role && (
              <div>
                <label className="mb-2 block font-medium">الدور</label>
                <div className={readonlyBox}>{user.role}</div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </main>
  );
}
