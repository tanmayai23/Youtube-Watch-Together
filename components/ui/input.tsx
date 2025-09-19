import * as React from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type, ...props }, ref) => {
    const baseClasses = "flex h-12 w-full rounded-xl border-2 border-purple-400/30 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur-md px-4 py-3 text-sm text-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-0 focus-visible:border-purple-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 input-glow"
    
    return (
      <input
        type={type}
        className={`${baseClasses} ${className}`.trim()}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }