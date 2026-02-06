// types.ts
export interface CustomInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
}


export interface CustomButtonProps {
    title: string;
    leftIcon?: React.ReactNode;
    href?: string; // if provided → acts as Link
    onClick?: () => void;
    variant?: "primary" | "outline" | "google" | "facebook";
    disabled?: boolean;
    className?: string;
    type?: "button" | "submit" | "reset";
  }
  