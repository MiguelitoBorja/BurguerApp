'use client'
import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (val: number) => void
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl' // Agregué XL para el input principal
}

export default function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  // Tamaños ajustados
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  }

  const handleClick = (index: number, isHalf: boolean) => {
    if (readOnly || !onChange) return
    onChange(isHalf ? index - 0.5 : index)
  }

  const handleMouseMove = (index: number, isHalf: boolean) => {
    if (readOnly) return
    setHoverValue(isHalf ? index - 0.5 : index)
  }

  const handleMouseLeave = () => {
    if (readOnly) return
    setHoverValue(null)
  }

  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isFull = displayValue >= index
        const isHalf = displayValue >= index - 0.5 && displayValue < index

        return (
          <div key={index} className={`relative ${readOnly ? 'cursor-default' : 'cursor-pointer'} ${sizeClasses[size]}`}>
            
            {/* FONDO (Estrella Vacía) - Color gris suave */}
            <svg 
                className="w-full h-full text-gray-200" 
                viewBox="0 0 24 24" 
                fill="currentColor"
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
            >
               {/* Estrella Redondeada (Más moderna) */}
               <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>

            {/* Zonas de click (Invisibles) */}
            {!readOnly && (
                <>
                    <div className="absolute left-0 top-0 w-1/2 h-full z-20"
                        onClick={() => handleClick(index, true)}
                        onMouseMove={() => handleMouseMove(index, true)}
                    />
                    <div className="absolute right-0 top-0 w-1/2 h-full z-20"
                        onClick={() => handleClick(index, false)}
                        onMouseMove={() => handleMouseMove(index, false)}
                    />
                </>
            )}

            {/* RELLENO (Estrella Naranja) - Con máscara de recorte */}
            <div className={`overflow-hidden absolute top-0 left-0 h-full pointer-events-none transition-all duration-200 
                ${isFull ? 'w-full' : isHalf ? 'w-1/2' : 'w-0'}`}
            >
               <svg 
                   className="w-full h-full text-orange-400 drop-shadow-sm" // Color Naranja + Sombra
                   viewBox="0 0 24 24" 
                   fill="currentColor"
                   stroke="currentColor" 
                   strokeWidth="2" 
                   strokeLinecap="round" 
                   strokeLinejoin="round"
                >
                 <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
               </svg>
            </div>

          </div>
        )
      })}
    </div>
  )
}