'use client'

type Props = {
  className?: string
}

export default function ObjexiaLogo({ className = "w-12 h-12" }: Props) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      // Added drop-shadow classes here for the global "Shine"
      className={`${className} overflow-visible drop-shadow-[0_0_12px_rgba(63,64,126,0.6)] dark:drop-shadow-[0_0_15px_rgba(179,187,234,0.5)]`} 
      aria-label="Objexia Logo"
    >
      {/* The 'O' Background */}
      <text 
        x="50" 
        y="50" 
        fontSize="120" 
        fontFamily="var(--font-league-spartan)" 
        fontWeight="900" 
        textAnchor="middle" 
        dominantBaseline="central" 
        fill="#3f407e"
      >
        O
      </text>
      
      {/* The 'X' Foreground */}
      <text 
        x="50" 
        y="50" 
        fontSize="85" 
        fontFamily="var(--font-league-spartan)" 
        fontWeight="900" 
        textAnchor="middle" 
        dominantBaseline="central" 
        className="fill-[#191b19] dark:fill-white transition-colors duration-200"
      >
        X
      </text>
    </svg>
  )
}