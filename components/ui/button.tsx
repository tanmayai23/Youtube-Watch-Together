import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient" | "glow"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "default", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden"
    
    const variantClasses = {
      default: "bg-gradient-to-r from-slate-600 to-slate-700 text-white hover:from-slate-700 hover:to-slate-800 shadow-lg hover:shadow-xl transform hover:scale-105",
      destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-105",
      outline: "border-2 border-purple-400 bg-transparent text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:border-transparent shadow-lg hover:shadow-xl transform hover:scale-105",
      secondary: "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transform hover:scale-105",
      ghost: "text-white hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-pink-500/20 hover:text-white transition-all duration-300",
      link: "text-purple-400 underline-offset-4 hover:underline hover:text-pink-400 transition-colors duration-300",
      gradient: "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-pink-500 hover:to-purple-500 shadow-lg hover:shadow-2xl transform hover:scale-105 btn-glow",
      glow: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-cyan-500 hover:to-blue-500 shadow-lg hover:shadow-2xl transform hover:scale-105 btn-glow pulse-glow"
    }
    
    const sizeClasses = {
      default: "h-11 px-6 py-2",
      sm: "h-9 rounded-lg px-4 text-xs",
      lg: "h-13 rounded-xl px-8 text-base",
      icon: "h-11 w-11",
    }
    
    const combinedClassName = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()
    
    return (
      <button
        className={combinedClassName}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }