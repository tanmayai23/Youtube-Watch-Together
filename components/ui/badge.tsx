import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "gradient"
}

function Badge({ className = "", variant = "default", ...props }: BadgeProps) {
  const variantClasses = {
    default: "bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg",
    secondary: "bg-gradient-to-r from-slate-600 to-slate-700 text-white shadow-lg",
    destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg",
    outline: "border-2 border-purple-400 text-purple-300 bg-transparent",
    success: "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg",
    gradient: "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg animate-pulse"
  }
  
  const baseClasses = "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300 hover:scale-105"
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()} {...props} />
  )
}

export { Badge }