'use client'
import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (val: number) => void // Opcional: si no se pasa, es solo lectura
  readOnly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ value, onChange, readOnly = false, size = 'md' }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  // Tamaños para Tailwind
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }

  // Función para manejar el clic en la mitad
  const handleClick = (index: number, isHalf: boolean) => {
    if (readOnly || !onChange) return
    const newValue = isHalf ? index - 0.5 : index
    onChange(newValue)
  }

  // Función para previsualizar al pasar el mouse
  const handleMouseMove = (index: number, isHalf: boolean) => {
    if (readOnly) return
    setHoverValue(isHalf ? index - 0.5 : index)
  }

  const handleMouseLeave = () => {
    if (readOnly) return
    setHoverValue(null)
  }

  // El valor a mostrar (hover o fijo)
  const displayValue = hoverValue !== null ? hoverValue : value

  return (
    <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((index) => {
        // Lógica de llenado
        const isFull = displayValue >= index
        const isHalf = displayValue >= index - 0.5 && displayValue < index

        return (
          <div key={index} className={`relative cursor-${readOnly ? 'default' : 'pointer'} ${sizeClasses[size]}`}>
            
            {/* ESTRELLA BASE (GRIS) */}
            <svg className="w-full h-full text-gray-300 absolute top-0 left-0" fill="currentColor" viewBox="0 0 24 24">
               <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>

            {/* ZONAS DE CLIC (INVISIBLES PERO FUNCIONALES) */}
            {!readOnly && (
                <>
                    {/* Mitad Izquierda */}
                    <div 
                        className="absolute left-0 top-0 w-1/2 h-full z-20"
                        onClick={() => handleClick(index, true)}
                        onMouseMove={() => handleMouseMove(index, true)}
                    />
                    {/* Mitad Derecha */}
                    <div 
                        className="absolute right-0 top-0 w-1/2 h-full z-20"
                        onClick={() => handleClick(index, false)}
                        onMouseMove={() => handleMouseMove(index, false)}
                    />
                </>
            )}

            {/* RELLENO (AMARILLO) */}
            <div className={`overflow-hidden absolute top-0 left-0 h-full pointer-events-none transition-all duration-200 
                ${isFull ? 'w-full' : isHalf ? 'w-1/2' : 'w-0'}`}
            >
               <svg className="w-full h-full text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                 {/* Nota: width y height del svg deben coincidir con el padre para que el recorte funcione bien */}
                 <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
               </svg>
            </div>

          </div>
        )
      })}
    </div>
  )
}