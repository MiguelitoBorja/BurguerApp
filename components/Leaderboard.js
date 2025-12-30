'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Leaderboard() {
  const [ranking, setRanking] = useState([])

  useEffect(() => {
    async function getRanking() {
      // Consultamos la "Vista" que creamos en SQL
      const { data, error } = await supabase
        .from('ranking_mensual')
        .select('*')
        .limit(10) // Top 10

      if (!error && data) setRanking(data)
    }
    getRanking()
  }, [])

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl -mr-10 -mt-10"></div>
      
      <h3 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10">
        🏆 Top Carnívoros
        <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-medium">Este Mes</span>
      </h3>

      <div className="space-y-4 relative z-10">
        {ranking.length === 0 ? (
           <p className="text-white/70 text-sm">Cargando la competencia...</p>
        ) : (
           ranking.map((user, index) => (
             <div key={user.id} className="flex items-center gap-3 bg-white/10 p-2 pr-4 rounded-xl border border-white/10 backdrop-blur-sm">
               {/* Posición */}
               <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm
                  ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                    index === 1 ? 'bg-gray-300 text-gray-800' : 
                    index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-white/20 text-white'}
               `}>
                 {index + 1}
               </div>

               {/* Avatar */}
               <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full border-2 border-white/20" />

               {/* Nombre */}
               <div className="flex-1 min-w-0">
                 <p className="font-bold text-sm truncate">{user.full_name}</p>
                 <p className="text-xs text-white/60">Cazador de burgers</p>
               </div>

               {/* Puntaje */}
               <div className="text-right">
                 <span className="block text-xl font-black">{user.total_burgers}</span>
                 <span className="text-[10px] uppercase font-bold opacity-70">Burgers</span>
               </div>
             </div>
           ))
        )}
      </div>
    </div>
  )
}