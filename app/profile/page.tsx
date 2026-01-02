'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabaseClient'
import { BADGES } from '../lib/badges'
export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [myBadges, setMyBadges] = useState<string[]>([]) // Array de códigos: ['PRIMERA_MORDIDA', etc]
  // ESTADO PARA NOTIFICACIONES (Nuevo)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  const [profile, setProfile] = useState({
    full_name: '',
    avatar_url: '',
    cover_url: '' 
  })

  const [stats, setStats] = useState({ total: 0, favoritas: 0, gastado: 0 })

  // Helper para mostrar notificaciones
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  useEffect(() => {
    async function loadData() {
       const { data: { user } } = await supabase.auth.getUser()
       
       if (!user) {
         router.push('/')
         return
       }

       const { data: profileData } = await supabase
         .from('profiles')
         .select('*')
         .eq('id', user.id)
         .single()

       setProfile({
         full_name: profileData?.full_name || user.user_metadata.full_name,
         avatar_url: profileData?.avatar_url || user.user_metadata.avatar_url,
         cover_url: profileData?.cover_url || '' 
       })
       
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
            // 3. Cargar logros desbloqueados
        const { data: achievements } = await supabase
            .from('user_achievements')
            .select('achievement_code')
            .eq('user_id', user.id)

        if (achievements) {
            setMyBadges(achievements.map(a => a.achievement_code))
        }
       setLoading(false)
    }
    loadData()
  }, [router])

  const uploadImage = async (event: any, field: 'avatar_url' | 'cover_url') => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No usuario')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${field}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      if (field === 'avatar_url') {
          await supabase.auth.updateUser({
            data: { avatar_url: publicUrl }
          })
      }

      setProfile(prev => ({ ...prev, [field]: publicUrl }))
      
      // REEMPLAZO DE ALERT POR NOTIFICACIÓN LINDA
      showNotification('¡Imagen actualizada con éxito! ✨', 'success')

    } catch (error) {
      console.error(error)
      showNotification('Error al subir imagen', 'error')
    } finally {
      setUploading(false)
    }
  }

  // --- LOADER PERSONALIZADO ---
  // --- LOADER CON GIF ---
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 relative overflow-hidden">
      {/* Decoración de fondo sutil */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 flex flex-col items-center mb-10">
        {/* IMAGEN O GIF AQUÍ */}
        {/* Asegúrate de que el nombre coincida con el que pusiste en la carpeta 'public' */}
        <img 
            src="/burger2.gif" 
            alt="Cargando"
            // Ajusta w-32 h-32 (tamaño) según tu GIF.
            // drop-shadow-xl le da un efecto 3D bonito.
            className="w-32 h-32 object-contain drop-shadow-xl"
        />
        
        {/* Texto animado */}
        <p className="mt-4 text-orange-500 font-black text-sm tracking-widest uppercase animate-pulse">
          Calentando la parrilla...
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-nunito relative">

      {/* --- NOTIFICACIÓN (MISMO CÓDIGO QUE EN HOME) --- */}
      {notification && (
        <div className="fixed top-6 left-4 right-4 z-[100] flex justify-center pointer-events-none">
          <div className={`
            pointer-events-auto max-w-sm w-full
            flex items-center gap-4 p-4 rounded-2xl shadow-2xl shadow-orange-500/10 border
            animate-in slide-in-from-top-5 fade-in duration-300
            ${notification.type === 'success' 
              ? 'bg-white/95 border-green-100' 
              : 'bg-white/95 border-red-100'
            } backdrop-blur-md
          `}>
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${notification.type === 'success' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-500'
              }
            `}>
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              )}
            </div>
            <div className="flex-1">
               <h4 className={`text-sm font-black ${notification.type === 'success' ? 'text-gray-800' : 'text-red-600'}`}>
                 {notification.type === 'success' ? '¡Hecho!' : 'Ups...'}
               </h4>
               <p className="text-xs font-medium text-gray-500 leading-snug mt-0.5">
                 {notification.message}
               </p>
            </div>
            <button onClick={() => setNotification(null)} className="text-gray-300 hover:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
      )}
      
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
           
           {/* PORTADA */}
           <div className="absolute top-0 left-0 w-full h-32 bg-gray-200 transition-colors group-hover:bg-gray-300">
               {profile.cover_url ? (
                   <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
               ) : (
                   <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
               )}
               
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
           
           {/* CONTENIDO */}
           <div className="relative flex flex-col items-center mt-16 px-6 pb-8">
              
              {/* AVATAR */}
              <div className="relative">
                  <img 
                     src={profile.avatar_url} 
                     className="w-28 h-28 rounded-full border-[5px] border-white shadow-lg object-cover bg-white"
                     alt="Avatar"
                  />
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

        {/* MEDALLAS (DEMO) */}
        <div className="pb-10">
  <h3 className="font-bold text-gray-800 mb-4 ml-2 flex items-center gap-2">
    Tus Logros <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black">{myBadges.length} / {BADGES.length}</span>
  </h3>
  
  <div className="grid grid-cols-3 gap-3">
     {BADGES.map((badge) => {
        const isUnlocked = myBadges.includes(badge.code)
        
        return (
           <div 
             key={badge.code}
             className={`
                aspect-square rounded-2xl flex flex-col items-center justify-center p-2 text-center border-2 transition-all
                ${isUnlocked 
                   ? `${badge.color} shadow-sm scale-100` 
                   : 'bg-gray-50 border-gray-100 grayscale opacity-40 scale-95'
                }
             `}
           >
              <div className="text-3xl mb-1 drop-shadow-sm">{badge.icon}</div>
              <span className={`text-[9px] font-black uppercase leading-tight ${isUnlocked ? '' : 'text-gray-400'}`}>
                  {badge.title}
              </span>
              
              {/* Tooltip simple si está bloqueado */}
              {!isUnlocked && (
                  <span className="text-[7px] text-gray-400 mt-1">Bloqueado</span>
              )}
           </div>
        )
     })}
  </div>
</div>

      </div>
    </div>
  )
}