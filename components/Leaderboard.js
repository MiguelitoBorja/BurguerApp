'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../app/lib/supabaseClient'

export default function Leaderboard() {
  const [ranking, setRanking] = useState([])
  const [filter, setFilter] = useState('mensual')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getRanking() {
      setLoading(true)
      const tableName = filter === 'mensual' ? 'ranking_mensual' : 'ranking_anual'
      const { data, error } = await supabase.from(tableName).select('*').limit(10)
      if (!error && data) setRanking(data)
      setLoading(false)
    }
    getRanking()
  }, [filter])

  // Separamos el Top 3 del resto
  const top3 = ranking.slice(0, 3)
  const restOfList = ranking.slice(3)

  // Componente para una columna del podio
  const PodiumStep = ({ user, place }) => {
    if (!user) return <div className="w-1/3"></div> // Espacio vacío si no hay usuario
    
    // Configuración visual según puesto
    const isFirst = place === 1
    const height = isFirst ? 'h-32' : place === 2 ? 'h-24' : 'h-20'
    const color = isFirst ? 'bg-yellow-100 border-yellow-200' : place === 2 ? 'bg-gray-100 border-gray-200' : 'bg-orange-100 border-orange-200'
    const ring = isFirst ? 'ring-4 ring-yellow-400/30' : ''
    const emoji = isFirst ? '👑' : place === 2 ? '🥈' : '🥉'

    return (
      <div className="flex flex-col items-center w-1/3 group">
         {/* Avatar flotando */}
         <div className={`relative mb-[-15px] z-10 transition-transform group-hover:-translate-y-2 ${isFirst ? 'scale-125' : ''}`}>
            <img src={user.avatar_url} className={`w-12 h-12 rounded-full border-2 border-white shadow-md object-cover ${ring}`} alt={user.full_name} />
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl">{emoji}</span>
         </div>
         
         {/* La Barra del Podio */}
         <div className={`w-full ${height} ${color} border-t-4 rounded-t-xl flex flex-col justify-end items-center pb-2 shadow-sm`}>
            <span className="text-xl font-black text-gray-700">{user.total_burgers}</span>
            <span className="text-[9px] font-bold text-gray-400 uppercase">Burgers</span>
         </div>
         
         {/* Nombre Abajo */}
         <p className="text-xs font-bold text-gray-600 mt-2 text-center leading-tight">
            {user.full_name?.split(' ')[0]}
         </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto mb-10">
      
      {/* TÍTULO Y TABS */}
      <div className="flex flex-col items-center mb-8 space-y-4 mt-8"> {/* Agregué mt-8 aquí */}
        <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2 drop-shadow-sm">
           <span className="text-3xl">🏆</span> Ranking
        </h3>
        <div className="bg-gray-100 p-1 rounded-full flex relative w-64 shadow-inner">
             <div className={`absolute top-1 bottom-1 w-1/2 bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${filter === 'anual' ? 'left-[48%] ml-1' : 'left-1'}`}></div>
             <button onClick={() => setFilter('mensual')} className={`relative z-10 w-1/2 text-sm font-bold py-2 rounded-full transition-colors ${filter === 'mensual' ? 'text-orange-600' : 'text-gray-500'}`}>Mes</button>
             <button onClick={() => setFilter('anual')} className={`relative z-10 w-1/2 text-sm font-bold py-2 rounded-full transition-colors ${filter === 'anual' ? 'text-orange-600' : 'text-gray-500'}`}>Año</button>
        </div>
      </div>

      {/* --- PODIO (TOP 3) --- */}
      {ranking.length > 0 && (
        <div className="flex items-end justify-center gap-2 mb-8 px-4">
            {/* El orden visual es: 2º, 1º, 3º */}
            <PodiumStep user={top3[1]} place={2} />
            <PodiumStep user={top3[0]} place={1} />
            <PodiumStep user={top3[2]} place={3} />
        </div>
      )}

      {/* --- LISTA RESTANTE (4 al 10) --- */}
      <div className="space-y-3 px-2">
        {restOfList.map((user, index) => (
            <div key={user.id} className="flex items-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                <span className="w-6 text-center font-bold text-gray-400 text-sm">{index + 4}</span>
                <img src={user.avatar_url} className="w-8 h-8 rounded-full ml-3 border border-gray-100 object-cover" />
                <span className="flex-1 ml-3 font-bold text-gray-700 text-sm">{user.full_name?.split(' ')[0]}</span>
                <span className="font-black text-orange-500">{user.total_burgers} 🍔</span>
            </div>
        ))}
        
        {ranking.length === 0 && !loading && (
             <div className="text-center py-10 text-gray-400">Sin datos todavía 😴</div>
        )}
      </div>

    </div>
  )
}