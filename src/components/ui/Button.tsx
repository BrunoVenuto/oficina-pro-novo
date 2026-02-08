import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  children: ReactNode;
}

const variantClasses = {
  primary: "bg-[#FFC107] text-[#0F1216] hover:bg-[#FFB300] active:bg-[#FFA000]",
  secondary: "bg-[#1E88E5] text-white hover:bg-[#1976D2] active:bg-[#1565C0]",
  danger: "bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C]",
  success: "bg-[#22C55E] text-white hover:bg-[#16A34A] active:bg-[#15803D]",
  warning: "bg-[#F97316] text-white hover:bg-[#EA580C] active:bg-[#C2410C]",
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm min-h-[40px]",
  md: "px-6 py-3 text-base min-h-[48px]",
  lg: "px-8 py-4 text-lg min-h-[56px]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        // layout seguro
        "inline-flex items-center justify-center",
        "max-w-full",
        "whitespace-nowrap",
        "overflow-hidden text-ellipsis",
        "leading-none",

        // visual
        "font-semibold rounded-xl transition-all duration-200",
        "shadow-sm active:scale-[0.98]",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",

        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
