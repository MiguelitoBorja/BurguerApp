'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  
  // Datos del perfil editable
  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    cover_url: '' // Nueva propiedad
  })

  const [stats, setStats] = useState({ total: 0, favoritas: 0, gastado: 0 })

  useEffect(() => {
    async function loadData() {
       const { data: { user } } = await supabase.auth.getUser()
       
       if (!user) {
         router.push('/')
         return
       }

       // 1. Cargar datos del perfil (prioridad a la tabla 'profiles')
       const { data: profileData } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', user.id)
         .single()

       // Si hay datos personalizados, úsalos. Si no, usa los de Google.
       setProfile({
         full_name: profileData?.full_name || user.user_metadata.full_name,
         avatar_url: profileData?.avatar_url || user.user_metadata.avatar_url,
         cover_url: profileData?.cover_url || '' // Portada vacía por defecto
       })
       
       // 2. Cargar estadísticas (igual que antes)
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

  // --- FUNCIÓN PARA SUBIR FOTOS (Genérica para Avatar o Portada) ---
  const uploadImage = async (event: any, field: 'avatar_url' | 'cover_url') => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No usuario')

      const fileExt = file.name.split('.').pop()
      // Nombre archivo: userID/avatar_timestamp.png
      const fileName = `${user.id}/${field}_${Date.now()}.${fileExt}`

      // 1. Subir al bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // 2. Obtener URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // 3. Actualizar tabla 'profiles'
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      // 4. Actualizar metadata de Auth (para que el Header de la home se actualice solo)
      if (field === 'avatar_url') {
          await supabase.auth.updateUser({
            data: { avatar_url: publicUrl }
          })
      }

      // 5. Actualizar estado local
      setProfile(prev => ({ ...prev, [field]: publicUrl }))
      alert('¡Imagen actualizada con éxito!')

    } catch (error) {
      console.error(error)
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-orange-50 text-orange-500 font-bold">Cargando perfil...</div>

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-nunito">
      
      {/* HEADER */}
      <div className="p-6 flex items-center gap-4 relative z-10">
        <button onClick={() => router.back()} className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-600 hover:bg-white transition-all">
           ⬅ Volver
        </button>
        <h1 className="text-xl font-black text-gray-800">Mi Perfil</h1>
      </div>

      <div className="px-6 space-y-6 -mt-4">
        
        {/* TARJETA DE PERFIL */}
        <div className="bg-white rounded-[2rem] shadow-xl relative overflow-hidden group">
           
           {/* --- FOTO DE PORTADA --- */}
           <div className="absolute top-0 left-0 w-full h-32 bg-gray-200 transition-colors group-hover:bg-gray-300">
               {profile.cover_url ? (
                   <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
               ) : (
                   <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
               )}
               
               {/* Botón Editar Portada */}
               <label className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full cursor-pointer hover:bg-black/50 backdrop-blur-md transition-all">
                   ✏️
                   <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => uploadImage(e, 'cover_url')} 
                      className="hidden" 
                      disabled={uploading}
                   />
               </label>
           </div>
           
           {/* --- CONTENIDO PERFIL --- */}
           <div className="relative flex flex-col items-center mt-16 px-6 pb-8">
              
              {/* --- AVATAR --- */}
              <div className="relative">
                  <img 
                     src={profile.avatar_url} 
                     className="w-28 h-28 rounded-full border-[5px] border-white shadow-lg object-cover bg-white"
                     alt="Avatar"
                  />
                  {/* Botón Editar Avatar */}
                  <label className="absolute bottom-0 right-0 bg-orange-500 text-white p-1.5 rounded-full cursor-pointer shadow-md hover:bg-orange-600 border-2 border-white transition-transform hover:scale-110">
                      📷
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => uploadImage(e, 'avatar_url')} 
                          className="hidden" 
                          disabled={uploading}
                      />
                  </label>
              </div>

              <h2 className="text-2xl font-black text-gray-800 mt-3 text-center">{profile.full_name}</h2>
              <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold mt-2">
                 {uploading ? 'Subiendo...' : 'Cazador de Burgers 🍔'}
              </span>

              {/* STATS */}
              <div className="grid grid-cols-3 gap-4 mt-8 w-full text-center divide-x divide-gray-100 border-t border-gray-100 pt-6">
                  <div>
                     <span className="block text-2xl font-black text-gray-800">{stats.total}</span>
                     <span className="text-[10px] uppercase text-gray-400 font-bold">Comidas</span>
                  </div>
                  <div>
                     <span className="block text-2xl font-black text-gray-800">{stats.favoritas}</span>
                     <span className="text-[10px] uppercase text-gray-400 font-bold">Perfectas</span>
                  </div>
                  <div>
                     <span className="block text-xl font-black text-green-600 truncate">${stats.gastado}</span>
                     <span className="text-[10px] uppercase text-gray-400 font-bold">Invertido</span>
                  </div>
              </div>
           </div>
        </div>

        {/* MEDALLAS */}
        <div>
          <h3 className="font-bold text-gray-800 mb-4 ml-2 flex items-center gap-2">
            Tus Logros <span className="text-xs bg-gray-200 text-gray-600 px-2 rounded-full">Demo</span>
          </h3>
          <div className="grid grid-cols-4 gap-4">
             <div className="aspect-square bg-yellow-100 rounded-2xl flex flex-col items-center justify-center shadow-sm border border-yellow-200">
                <span className="text-2xl mb-1">🐣</span>
                <span className="text-[8px] font-bold text-yellow-700 uppercase">Inicio</span>
             </div>
             <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-3xl grayscale opacity-40 border border-gray-200">
                👑
             </div>
             <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-3xl grayscale opacity-40 border border-gray-200">
                🔥
             </div>
             <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-3xl grayscale opacity-40 border border-gray-200">
                💸
             </div>
          </div>
        </div>

      </div>
    </div>
  )
}