// Mathnashed Logo - School-friendly math icon
// Features: Calculator-style numbers with geometric shapes

export default function MathIcon({ className = "w-9 h-9", variant = "default" }) {
  if (variant === "large") {
    return (
      <div className={`${className} bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
          {/* Plus sign with rounded corners */}
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Small decorative dots */}
          <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.6"/>
          <circle cx="18" cy="18" r="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
    );
  }

  if (variant === "white") {
    return (
      <div className={`${className} bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center`}>
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.6"/>
          <circle cx="18" cy="18" r="1.5" fill="currentColor" opacity="0.6"/>
        </svg>
      </div>
    );
  }

  // Default variant
  return (
    <div className={`${className} bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
        {/* Plus sign */}
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
        {/* Decorative elements */}
        <circle cx="6" cy="6" r="1.5" fill="currentColor" opacity="0.6"/>
        <circle cx="18" cy="18" r="1.5" fill="currentColor" opacity="0.6"/>
      </svg>
    </div>
  );
}

// Alternative: Calculator-style icon
export function CalculatorIcon({ className = "w-9 h-9" }) {
  return (
    <div className={`${className} bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md`}>
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
        {/* Calculator body outline */}
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        {/* Display */}
        <rect x="6" y="4" width="12" height="4" rx="1" fill="currentColor" opacity="0.3"/>
        {/* Buttons */}
        <circle cx="8" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="16" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="16" r="1.5" fill="currentColor"/>
        <circle cx="16" cy="16" r="1.5" fill="currentColor"/>
        <circle cx="8" cy="20" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="20" r="1.5" fill="currentColor"/>
      </svg>
    </div>
  );
}
