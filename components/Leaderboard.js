'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../app/lib/supabaseClient'

export default function Leaderboard() {
  const [ranking, setRanking] = useState([])
  const [filter, setFilter] = useState('mensual') // 'mensual' o 'anual'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getRanking() {
      setLoading(true)
      const tableName = filter === 'mensual' ? 'ranking_mensual' : 'ranking_anual'
      
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(10)

      if (!error && data) setRanking(data)
      setLoading(false)
    }
    getRanking()
  }, [filter])

  return (
    <div className="w-full max-w-md mx-auto mb-10">
      
      {/* --- ENCABEZADO Y TABS --- */}
      <div className="flex flex-col items-center mb-6 space-y-4">
        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2 drop-shadow-sm">
           <span className="text-3xl">🏆</span> Ranking
        </h3>

        {/* Switcher Mes/Año Estilo iOS */}
        <div className="bg-gray-200 p-1 rounded-full flex relative w-64 shadow-inner">
             {/* Fondo deslizante (Animación visual simple) */}
             <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-full shadow-md transition-all duration-300 ease-out ${filter === 'anual' ? 'left-[48%] ml-1' : 'left-1'}`}></div>
             
             <button 
                onClick={() => setFilter('mensual')}
                className={`relative z-10 w-1/2 text-sm font-bold py-2 rounded-full transition-colors duration-300 ${filter === 'mensual' ? 'text-orange-600' : 'text-gray-500'}`}
             >
                Este Mes
             </button>
             <button 
                onClick={() => setFilter('anual')}
                className={`relative z-10 w-1/2 text-sm font-bold py-2 rounded-full transition-colors duration-300 ${filter === 'anual' ? 'text-orange-600' : 'text-gray-500'}`}
             >
                Este Año
             </button>
        </div>
      </div>

      {/* --- LISTA DE TARJETAS --- */}
      <div className="space-y-3 px-1">
        {loading ? (
             // Esqueleto de carga
             [1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
             ))
        ) : ranking.length === 0 ? (
             <div className="text-center py-10 bg-gray-50 rounded-3xl border border-dashed border-gray-300">
                <p className="text-gray-400">Sin datos todavía 😴</p>
             </div>
        ) : (
            ranking.map((user, index) => (
                <div 
                    key={user.id} 
                    className={`relative flex items-center p-4 rounded-2xl shadow-sm border transition-transform hover:scale-[1.02]
                        ${index === 0 ? 'bg-gradient-to-r from-yellow-50 to-white border-yellow-200 shadow-yellow-100 ring-1 ring-yellow-100' : 'bg-white border-gray-100'}
                    `}
                >
                    {/* 1. Posición (Badge) */}
                    <div className={`
                        flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-black text-sm mr-4 shadow-sm border-2 border-white
                        ${index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                          index === 1 ? 'bg-gray-300 text-gray-800' : 
                          index === 2 ? 'bg-orange-300 text-orange-900' : 'bg-gray-100 text-gray-500'}
                    `}>
                        {index + 1}
                    </div>

                    {/* 2. Avatar */}
                    <div className="relative mr-4">
                        <img 
                            src={user.avatar_url} 
                            alt={user.full_name} 
                            className={`w-12 h-12 rounded-full object-cover shadow-sm ${index === 0 ? 'border-2 border-yellow-400' : 'border border-gray-200'}`}
                        />
                        {index === 0 && <span className="absolute -top-2 -right-1 text-lg animate-bounce">👑</span>}
                    </div>

                    {/* 3. Nombre y Título */}
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-bold text-base truncate ${index === 0 ? 'text-yellow-800' : 'text-gray-800'}`}>
                            {user.full_name?.split(' ')[0]} {/* Primer nombre */}
                        </h4>
                        <p className="text-xs font-medium text-gray-400 truncate uppercase tracking-wider">
                            {index === 0 ? 'Dominando' : 'Competidor'}
                        </p>
                    </div>

                    {/* 4. Puntaje */}
                    <div className="text-right">
                        <span className={`block text-2xl font-black leading-none ${index === 0 ? 'text-orange-500' : 'text-gray-800'}`}>
                            {user.total_burgers}
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Burgers</span>
                    </div>
                </div>
            ))
        )}
      </div>

    </div>
  )
}