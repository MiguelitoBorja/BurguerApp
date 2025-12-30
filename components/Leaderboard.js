'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../app/lib/supabaseClient' // O '../lib/supabaseClient'

export default function Leaderboard() {
  const [ranking, setRanking] = useState([])
  const [filter, setFilter] = useState('mensual') // 'mensual' o 'anual'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getRanking() {
      setLoading(true)
      // Elegimos la tabla según el filtro seleccionado
      const tableName = filter === 'mensual' ? 'ranking_mensual' : 'ranking_anual'
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10)

      if (!error && data) setRanking(data)
      setLoading(false)
    }
    getRanking()
  }, [filter]) // Se ejecuta cada vez que cambias el filtro

  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-orange-500/20 relative overflow-hidden mb-8 mt-8" >
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            {/* Título */}
            <h3 className="text-2xl font-black flex items-center gap-3">
                <span className="text-3xl">🏆</span> 
                <div>
                Top Carnívoros
                <span className="block text-[10px] font-bold uppercase opacity-70 tracking-widest mt-1">
                    Ranking {filter === 'mensual' ? 'del Mes' : 'del Año'}
                </span>
                </div>
            </h3>

            {/* Pestañas (Tabs) de Filtro */}
            <div className="bg-black/20 p-1 rounded-xl flex gap-1 backdrop-blur-sm">
                <button 
                    onClick={() => setFilter('mensual')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                        filter === 'mensual' 
                        ? 'bg-white text-orange-600 shadow-sm scale-105' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                    Este Mes
                </button>
                <button 
                    onClick={() => setFilter('anual')}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${
                        filter === 'anual' 
                        ? 'bg-white text-orange-600 shadow-sm scale-105' 
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                >
                    Este Año
                </button>
            </div>
        </div>

        <div className="flex flex-col gap-4 min-h-[200px]">
            {loading ? (
                <div className="text-center py-12 text-white/50 italic bg-white/5 rounded-2xl animate-pulse">
                    Calculando mordiscos...
                </div>
            ) : ranking.length === 0 ? (
                <div className="text-center py-8 text-white/50 italic bg-white/5 rounded-2xl">
                    Nadie ha comido burgers aún en este periodo 😢
                </div>
            ) : (
            ranking.map((user, index) => (
                <div 
                    key={user.id} 
                    className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-sm transition-all hover:scale-[1.01] hover:bg-white/15"
                >
                {/* Posición */}
                <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full font-black text-lg shadow-md border-2 border-white/20
                    ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900' : 
                        index === 1 ? 'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800' : 
                        index === 2 ? 'bg-gradient-to-br from-orange-200 to-orange-400 text-orange-900' : 'bg-white/10 text-white'}
                `}>
                    {index + 1}
                </div>

                {/* Avatar */}
                <img 
                    src={user.avatar_url} 
                    alt={user.full_name} 
                    className="w-12 h-12 rounded-full border-2 border-white/30 object-cover shadow-sm" 
                />

                {/* Nombre */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-bold text-base truncate leading-tight text-white drop-shadow-sm">
                        {user.full_name?.split(' ')[0]}
                    </p>
                    <p className="text-xs text-orange-100 font-medium opacity-90 truncate">
                        {index === 0 && filter === 'anual' ? '👑 LEYENDA ANUAL' : 
                         index === 0 ? '👑 El Rey del Mes' : 'Cazador de burgers'}
                    </p>
                </div>

                {/* Puntaje */}
                <div className="text-right pl-2 border-l border-white/10">
                    <span className="block text-2xl font-black leading-none">{user.total_burgers}</span>
                    <span className="text-[9px] uppercase font-bold opacity-80">Burgers</span>
                </div>
                </div>
            ))
            )}
        </div>
      </div>
    </div>
  )
}