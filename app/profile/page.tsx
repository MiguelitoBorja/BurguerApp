'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient' // Subimos un nivel para encontrar 'lib'
import type { User } from '@supabase/supabase-js'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState({ total: 0, favoritas: 0, gastado: 0 })

  useEffect(() => {
    async function loadData() {
       const { data: { user } } = await supabase.auth.getUser()
       
       if (!user) {
         router.push('/') // Si no hay usuario, volver al inicio
         return
       }

       setUser(user)
       
       // Cargar estadísticas
       const { data: burgers } = await supabase
          .from('burgers')
          .select('rating, precio')
          .eq('user_id', user.id)
       
       if(burgers) {
           setStats({
               total: burgers.length,
               favoritas: burgers.filter(b => b.rating === 5).length,
               gastado: burgers.reduce((acc, b) => acc + (b.precio || 0), 0)
           })
       }
       setLoading(false)
    }
    loadData()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-orange-50 text-orange-500 font-bold">Cargando perfil...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-nunito">
      
      {/* HEADER CON BOTÓN VOLVER */}
      <div className="p-6 flex items-center gap-4">
        <button onClick={() => router.back()} className="bg-white p-2 rounded-full shadow-sm text-gray-600 hover:bg-gray-100">
           ⬅ Volver
        </button>
        <h1 className="text-xl font-black text-gray-800">Mi Perfil</h1>
      </div>

      <div className="px-6 space-y-6">
        
        {/* TARJETA DE IDENTIDAD */}
        <div className="bg-white rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-orange-400 to-red-500"></div>
           
           <div className="relative flex flex-col items-center -mt-2">
              <img 
                 src={user?.user_metadata.avatar_url} 
                 className="w-24 h-24 rounded-full border-4 border-white shadow-md z-10"
                 alt="Avatar"
              />
              <h2 className="text-2xl font-black text-gray-800 mt-3">{user?.user_metadata.full_name}</h2>
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold mt-2">
                 Nivel: Cazador de Burgers 🍔
              </span>
           </div>

           {/* STATS GRID */}
           <div className="grid grid-cols-3 gap-4 mt-8 text-center divide-x divide-gray-100">
              <div>
                 <span className="block text-2xl font-black text-gray-800">{stats.total}</span>
                 <span className="text-[10px] uppercase text-gray-400 font-bold">Comidas</span>
              </div>
              <div>
                 <span className="block text-2xl font-black text-gray-800">{stats.favoritas}</span>
                 <span className="text-[10px] uppercase text-gray-400 font-bold">Perfectas</span>
              </div>
              <div>
                 <span className="block text-xl font-black text-green-600">${stats.gastado}</span>
                 <span className="text-[10px] uppercase text-gray-400 font-bold">Invertido</span>
              </div>
           </div>
        </div>

        {/* SECCIÓN DE MEDALLAS (DEMO) */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4 ml-2 flex items-center gap-2">
            Tus Logros <span className="text-xs bg-gray-200 text-gray-600 px-2 rounded-full">4</span>
          </h3>
          <div className="grid grid-cols-4 gap-4">
             <div className="aspect-square bg-yellow-100 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-yellow-200">
                <span className="text-2xl mb-1">🐣</span>
                <span className="text-[8px] font-bold text-yellow-700 uppercase">Inicio</span>
             </div>
             <div className="aspect-square bg-orange-100 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-orange-200">
                <span className="text-2xl mb-1">🔥</span>
                <span className="text-[8px] font-bold text-orange-700 uppercase">Racha</span>
             </div>
             {/* Bloqueadas */}
             <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-3xl grayscale opacity-40 border border-gray-200">
                💸
             </div>
             <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-3xl grayscale opacity-40 border border-gray-200">
                👑
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}