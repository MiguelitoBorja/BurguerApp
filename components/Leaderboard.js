'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../app/lib/supabaseClient' // Ajusta la ruta si es '../lib/...'

export default function Leaderboard() {
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    async function getRanking() {
      const { data, error } = await supabase
        .from('ranking_mensual')
        .select('*')
        .limit(10)

      if (!error && data) setRanking(data)
    }
    getRanking()
  }, [])

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden mb-8">
      {/* Decoración de fondo (Círculos) */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-400 opacity-20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
      
      {/* Título con más aire abajo */}
      <h3 className="text-2xl font-black mb-8 flex items-center gap-3 relative z-10">
        <span className="text-3xl">🏆</span> 
        <div>
           Top Carnívoros
           <span className="block text-[10px] font-bold uppercase opacity-70 tracking-widest mt-1">Ranking Mensual</span>
        </div>
      </h3>

      <div className="flex flex-col gap-4 relative z-10">
        {ranking.length === 0 ? (
           <div className="text-center py-8 text-white/50 italic bg-white/5 rounded-2xl">
             Cargando competidores...
           </div>
        ) : (
           ranking.map((user, index) => (
             <div 
                key={user.id} 
                className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]"
             >
               {/* Posición (Círculo más definido) */}
               <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-black text-lg shadow-md border-2 border-white/20
                  ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 
                    index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800' : 
                    index === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900' : 'bg-white/10 text-white'}
               `}>
                 {index + 1}
               </div>

               {/* Avatar (Un poco más grande) */}
               <img 
                 src={user.avatar_url} 
                 alt={user.full_name} 
                 className="w-12 h-12 rounded-full border-2 border-white/30 object-cover shadow-sm" 
               />

               {/* Nombre y Título */}
               <div className="flex-1 min-w-0 flex flex-col justify-center">
                 <p className="font-bold text-base truncate leading-tight text-white drop-shadow-sm">
                    {user.full_name.split(' ')[0]} {/* Solo primer nombre para que no se corte */}
                 </p>
                 <p className="text-xs text-orange-100 font-medium opacity-90 truncate">
                    {index === 0 ? '👑 El Rey Burger' : 'Cazador de burgers'}
                 </p>
               </div>

               {/* Puntaje (Más separado) */}
               <div className="text-right pl-2 border-l border-white/10">
                 <span className="block text-2xl font-black leading-none">{user.total_burgers}</span>
                 <span className="text-[9px] uppercase font-bold opacity-80">Burgers</span>
               </div>
             </div>
           ))
        )}
      </div>
    </div>
  )
}