"use client";

import Link from "next/link";
import { cn } from "@/app/lib/utils";
import { CustomButtonProps } from "@/type";

const CustomButton = ({
  title,
  leftIcon,
  onClick,
  variant = "primary",
  disabled,
  className,
  type = "button",
}: CustomButtonProps) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-md transition focus:outline-none focus:ring-2";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-200",
    outline:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-200",
    google:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-200",
    facebook: "bg-[#1877F2] text-white hover:bg-[#166FE5] focus:ring-blue-200",
  };

  const content = (
    <>
      {leftIcon && <span className="text-lg">{leftIcon}</span>}
      <span>{title}</span>
    </>
  );

  // 👉 Action button (submit, click)
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseStyles,
        variants[variant],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {content}
    </button>
  );
};

export default CustomButton;
