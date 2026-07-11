"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Skeleton from "@/components/ui/Skeleton";
import RegionSelect from "@/components/RegionSelect";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

const PROFILE_IMAGE = "/my-notion-face-portrait.png";

export default function ProfilePage() {
  const { data: user, isLoading, isError } = useCurrentUser();

  const [isEditing, setIsEditing] = useState(false);
  const [showBio, setShowBio] = useState(false);

  const [form, setForm] = useState({
    name: "",
    bio: "",
    region: "",
  });

  // Sync the editable form with the real user data once /users/me resolves.
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.fullName ?? "",
        region: user.region ?? "",
      }));
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegionChange = (value: string) => {
    setForm((prev) => ({ ...prev, region: value }));
  };

  const handleCancel = () => {
    setIsEditing(false);

    setForm({
      name: user?.fullName ?? "",
      bio: "",
      region: user?.region ?? "",
    });
  };

  const handleSave = () => {
    // TODO: Wire up to a real "update profile" endpoint once the backend
    // exposes one (GET /users/me currently only returns data, no PATCH yet).
    setIsEditing(false);
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
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    // TODO: Handle image upload
                    console.log(e.target.files?.[0]);
                  }}
                />

                <div className="relative">
                  <Image
                    src={PROFILE_IMAGE}
                    alt="الصورة الشخصية"
                    width={220}
                    height={220}
                    className="h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56 rounded-full border-4 border-zinc-200 object-cover transition duration-300 group-hover:brightness-75 dark:border-zinc-700"
                  />

                  {/* Change Icon */}
                  <div className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-lg transition group-hover:scale-110">
                    +
                  </div>
                </div>
              </label>

              <p className="mt-6 text-sm text-zinc-500">
                اضغط على الصورة لتغييرها
              </p>
            </div>
          </div>
          <Skeleton className="w-full mt-10 h-[36vh]" />
        </div>

        {/* Information */}

        <div className="rounded-2xl flex-1 border border-zinc-300 bg-zinc-100 overflow-hidden p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl lg:text-2xl font-bold">المعلومات الشخصية</h2>

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                disabled={isLoading || isError}
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
                  className="rounded-xl bg-blue-600 px-5 py-2 text-white transition hover:bg-blue-700"
                >
                  حفظ
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
          ) : isError ? (
            <p className="text-sm text-red-500">
              تعذر تحميل بيانات الحساب. حاول تحديث الصفحة.
            </p>
          ) : (
          <div className="space-y-6">
            {/* Name */}

            <div>
              <label className="mb-2 block font-medium">الاسم</label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                disabled={!isEditing}
                className="w-full rounded-xl border border-zinc-400 disabled:border-zinc-300 px-4 py-3 disabled:bg-zinc-50 bg-white dark:disabled:border-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
              />
            </div>

            {/* Region */}

            <RegionSelect
              value={form.region}
              onChange={handleRegionChange}
              disabled={!isEditing}
            />

            {/* Bio */}

            {showBio ? (
              <div>
                <label className="mb-2 block font-medium">الوصف</label>

                <textarea
                  name="bio"
                  rows={4}
                  value={form.bio}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className=" w-full h-25 resize-none rounded-xl border bg-white border-zinc-400 disabled:border-zinc-300 px-4 py-3 disabled:bg-zinc-50 dark:disabled:border-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:bg-zinc-800"
                />
              </div>
            ) : (
              <div>
                <label className="mb-2 block font-medium">الوصف</label>

                <button
                  type="button"
                  onClick={() => setShowBio(true)}
                  disabled={!isEditing}
                  className="flex items-center gap-2 bg-blue-300/30 hover:bg-blue-300/50 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-zinc-500 transition hover:border-blue-500 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:text-blue-300"
                >
                  <span className="text-lg">+</span>
                  إضافة وصف
                </button>
              </div>
            )}
            <div className="my-8 border-t border-zinc-200 dark:border-zinc-800" />

            {/* Readonly — real data from GET /users/me */}

            <div>
              <label className="mb-2 block font-medium">البريد الإلكتروني</label>

              <div className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">الدولة</label>

              <div className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {user?.country}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">المرحلة التعليمية</label>

              <div className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {user?.educationalStage}
              </div>
            </div>

            <div>
              <label className="mb-2 block font-medium">الصف الدراسي</label>

              <div className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {user?.gradeLevel}
              </div>
            </div>

            {user?.role && (
              <div>
                <label className="mb-2 block font-medium">الدور</label>

                <div className="rounded-xl border border-zinc-300 bg-zinc-100 px-4 py-3 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {user.role}
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </div>
    </main>
  );
}
