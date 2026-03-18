'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import { BADGES } from '@/app/lib/badges'

interface UserProfile {
  id: string
  full_name: string
  avatar_url: string
  cover_url: string
}

interface Friendship {
  id: string
  requester_id: string
  receiver_id: string
  status: string
}

export default function UserProfilePage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.userId as string

  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState({ total: 0, favoritas: 0, gastado: 0 })
  const [userBadges, setUserBadges] = useState<string[]>([])
  const [friendshipStatus, setFriendshipStatus] = useState<'none' | 'pending' | 'accepted' | 'sent'>('none')
  const [sendingRequest, setSendingRequest] = useState(false)
  const [userBurgers, setUserBurgers] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [userId])

  const loadData = async () => {
    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Cargar perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('Error cargando perfil:', profileError)
        router.push('/')
        return
      }

      if (!profileData) {
        router.push('/')
        return
      }

      setProfile({
        id: profileData.id,
        full_name: profileData.full_name || 'Usuario',
        avatar_url: profileData.avatar_url || '/avatar-placeholder.jpg',
        cover_url: profileData.cover_url || ''
      })

      // Cargar stats
      const { data: burgers, error: burgersError } = await supabase
        .from('burgers')
        .select('rating, precio, *')
        .eq('user_id', userId)

      if (burgersError) {
        console.error('Error cargando burgers:', burgersError)
        setStats({ total: 0, favoritas: 0, gastado: 0 })
      } else if (burgers && burgers.length > 0) {
        setUserBurgers(burgers)
        setStats({
          total: burgers.length,
          favoritas: burgers.filter(b => b.rating === 5).length,
          gastado: burgers.reduce((acc, b) => acc + (b.precio || 0), 0)
        })
      } else {
        setUserBurgers([])
        setStats({ total: 0, favoritas: 0, gastado: 0 })
      }

      // Cargar logros
      const { data: achievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('achievement_code')
        .eq('user_id', userId)

      if (achievementsError) {
        console.warn('Error cargando logros:', achievementsError)
      } else if (achievements) {
        setUserBadges(achievements.map(a => a.achievement_code))
      }

      // Cargar estado de amistad (solo si es otro usuario)
      if (user && user.id !== userId) {
        await checkFriendshipStatus(user.id, userId)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error cargando perfil:', error)
      setLoading(false)
    }
  }

  const checkFriendshipStatus = async (currentUserId: string, targetUserId: string) => {
    try {
      // Buscar amistad en ambas direcciones
      const { data, error } = await supabase
        .from('friendships')
        .select('*')

      if (error) {
        console.error('Error:', error)
        return
      }

      if (data && data.length > 0) {
        const friendship = data.find(f =>
          (f.requester_id === currentUserId && f.receiver_id === targetUserId) ||
          (f.requester_id === targetUserId && f.receiver_id === currentUserId)
        )

        if (friendship) {
          if (friendship.status === 'accepted') {
            setFriendshipStatus('accepted')
          } else if (friendship.requester_id === currentUserId) {
            setFriendshipStatus('sent')
          } else {
            setFriendshipStatus('pending')
          }
        } else {
          setFriendshipStatus('none')
        }
      } else {
        setFriendshipStatus('none')
      }
    } catch (error) {
      console.error('Error verificando amistad:', error)
    }
  }

  const handleSendFriendRequest = async () => {
    if (!currentUser) {
      router.push('/')
      return
    }

    setSendingRequest(true)
    try {
      const { error } = await supabase
        .from('friendships')
        .insert([{
          requester_id: currentUser.id,
          receiver_id: userId,
          status: 'pending'
        }])

      if (!error) {
        setFriendshipStatus('sent')
      }
    } catch (error) {
      console.error('Error enviando solicitud:', error)
    } finally {
      setSendingRequest(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!currentUser) return

    try {
      const { data, error } = await supabase
        .from('friendships')
        .select('*')

      if (!error && data) {
        const friendship = data.find(f =>
          (f.requester_id === currentUser.id && f.receiver_id === userId) ||
          (f.requester_id === userId && f.receiver_id === currentUser.id)
        )

        if (friendship) {
          await supabase
            .from('friendships')
            .delete()
            .eq('id', friendship.id)

          setFriendshipStatus('none')
        }
      }
    } catch (error) {
      console.error('Error cancelando solicitud:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Cargando perfil...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <p className="text-gray-400 mb-4">Usuario no encontrado</p>
        <button onClick={() => router.back()} className="text-orange-600 font-bold">
          ← Volver
        </button>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === userId
  const isFriend = friendshipStatus === 'accepted'

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-nunito relative">
      {/* HEADER */}
      <div className="p-6 flex items-center gap-4 relative z-10">
        <button
          onClick={() => router.back()}
          className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-600 hover:bg-white transition-all"
        >
          ⬅
        </button>
        <h1 className="text-xl font-black text-gray-800">Perfil</h1>
      </div>

      <div className="px-6 space-y-6 -mt-4">
        {/* TARJETA DE PERFIL */}
        <div className="bg-white rounded-[2rem] shadow-xl relative overflow-hidden group">
          {/* PORTADA */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gray-200">
            {profile.cover_url ? (
              <img src={profile.cover_url} className="w-full h-full object-cover" alt="Cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
            )}
          </div>

          {/* CONTENIDO */}
          <div className="relative flex flex-col items-center mt-16 px-6 pb-8">
            {/* AVATAR */}
            <img
              src={profile.avatar_url}
              className="w-28 h-28 rounded-full border-[5px] border-white shadow-lg object-cover bg-white"
              alt={profile.full_name}
            />

            <h2 className="text-2xl font-black text-gray-800 mt-3 text-center">{profile.full_name}</h2>
            <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold mt-2">
              Cazador de Burgers 🍔
            </span>

            {/* BOTÓN DE AMISTAD */}
            {!isOwnProfile && (
              <div className="mt-4 w-full">
                {friendshipStatus === 'none' && (
                  <button
                    onClick={handleSendFriendRequest}
                    disabled={sendingRequest}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 rounded-full transition-colors disabled:opacity-50"
                  >
                    {sendingRequest ? 'Enviando...' : '➕ Enviar solicitud'}
                  </button>
                )}
                {friendshipStatus === 'sent' && (
                  <button
                    onClick={handleCancelRequest}
                    className="w-full bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 rounded-full transition-colors"
                  >
                    ✓ Solicitud enviada
                  </button>
                )}
                {friendshipStatus === 'pending' && (
                  <div className="text-center text-sm text-gray-500">
                    ⏳ Solicitud pendiente de {profile.full_name}
                  </div>
                )}
                {friendshipStatus === 'accepted' && (
                  <button
                    className="w-full bg-green-500 text-white font-bold py-2 rounded-full cursor-default"
                  >
                    ✓ Son amigos
                  </button>
                )}
              </div>
            )}

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

        {/* ÚLTIMAS COMIDAS */}
        {isFriend && userBurgers.length > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 mb-4 ml-2">Últimas comidas</h3>
            <div className="space-y-3">
              {userBurgers.slice(0, 5).map(burger => (
                <div key={burger.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  {burger.foto_url && (
                    <img src={burger.foto_url} alt={burger.nombre_lugar} className="w-full h-32 object-cover rounded-lg mb-3" />
                  )}
                  <h4 className="font-bold text-gray-800">{burger.nombre_lugar}</h4>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-600">⭐ {burger.rating}/5</span>
                    <span className="text-sm font-bold text-green-600">${burger.precio || '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* LOGROS */}
        <div className="pb-10">
          <h3 className="font-bold text-gray-800 mb-4 ml-2 flex items-center gap-2">
            Logros <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-black">{userBadges.length} / {BADGES.length}</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            {BADGES.map(badge => {
              const isUnlocked = userBadges.includes(badge.code)

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
