'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/app/lib/supabaseClient'
import FriendRequests from '@/components/FriendRequests'

interface Friend {
  id: string
  full_name: string
  avatar_url: string
  total_burgers?: number
}

interface PendingRequest {
  id: string
  requester_id: string
  receiver_id: string
  status: string
  requester_profile?: {
    full_name: string
    avatar_url: string
  }
}

export default function FriendsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [friends, setFriends] = useState<Friend[]>([])
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'friends' | 'requests' | 'search'>('friends')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setCurrentUser(user)
      await loadFriends(user.id)
      await loadPendingRequests(user.id)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFriends = async (userId: string) => {
    try {
      // Obtener amistad aceptadas (en ambas direcciones)
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          requester_id,
          receiver_id,
          status
        `)
        .eq('status', 'accepted')

      if (error || !data) return

      // Extraer IDs de amigos
      const friendIds = data
        .filter(f => f.requester_id === userId || f.receiver_id === userId)
        .map(f => f.requester_id === userId ? f.receiver_id : f.requester_id)

      // Obtener datos de perfiles e incluir conteo de burgers
      if (friendIds.length === 0) {
        setFriends([])
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          burgers (id)
        `)
        .in('id', friendIds)

      if (!profileError && profiles) {
        const friendsWithBurgers = profiles.map(p => ({
          id: p.id,
          full_name: p.full_name || 'Usuario',
          avatar_url: p.avatar_url || '/avatar-placeholder.jpg',
          total_burgers: p.burgers?.length || 0
        }))
        setFriends(friendsWithBurgers)
      }
    } catch (error) {
      console.error('Error cargando amigos:', error)
    }
  }

  const loadPendingRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester_profile:profiles!requester_id (full_name, avatar_url)
        `)
        .eq('receiver_id', userId)
        .eq('status', 'pending')

      if (!error && data) {
        setPendingRequests(data as PendingRequest[])
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
    }
  }

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          avatar_url,
          burgers (id)
        `)
        .ilike('full_name', `%${query}%`)
        .limit(10)

      if (!error && data) {
        const results = data
          .filter(p => p.id !== currentUser?.id) // Excluir al usuario actual
          .map(p => ({
            id: p.id,
            full_name: p.full_name || 'Usuario',
            avatar_url: p.avatar_url || '/avatar-placeholder.jpg',
            total_burgers: p.burgers?.length || 0
          }))
        setSearchResults(results)
      }
    } catch (error) {
      console.error('Error buscando usuarios:', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    searchUsers(value)
  }

  const goToProfile = (userId: string) => {
    router.push(`/profile/${userId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-nunito">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm border-b border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-sm text-gray-600 hover:bg-white transition-all"
          >
            ←
          </button>
          <h1 className="text-xl font-black text-gray-800">Mis Amigos</h1>
        </div>

        {/* TABS */}
        <div className="flex gap-2 border-b border-gray-100">
          <button
            onClick={() => setTab('friends')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
              tab === 'friends'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Amigos ({friends.length})
          </button>
          <button
            onClick={() => setTab('requests')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
              tab === 'requests'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Solicitudes ({pendingRequests.length})
          </button>
          <button
            onClick={() => setTab('search')}
            className={`px-4 py-2 font-bold text-sm border-b-2 transition-colors ${
              tab === 'search'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Buscar
          </button>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="max-w-md mx-auto p-4">
        {/* TAB: AMIGOS */}
        {tab === 'friends' && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm mb-2">Aún no tienes amigos</p>
                <p className="text-xs">¡Busca y envía solicitudes!</p>
              </div>
            ) : (
              friends.map(friend => (
                <div
                  key={friend.id}
                  onClick={() => goToProfile(friend.id)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={friend.avatar_url}
                      alt={friend.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 truncate">{friend.full_name}</p>
                      <p className="text-xs text-gray-400">{friend.total_burgers} burgers</p>
                    </div>
                  </div>
                  <span className="text-xl">→</span>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: SOLICITUDES */}
        {tab === 'requests' && (
          <FriendRequests currentUserId={currentUser?.id} showOnlyPending={true} />
        )}

        {/* TAB: BUSCAR */}
        {tab === 'search' && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchQuery}
              onChange={e => handleSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />

            <div className="space-y-3">
              {searchResults.length === 0 && searchQuery.length >= 2 ? (
                <p className="text-center text-gray-400 text-sm py-8">No se encontraron usuarios</p>
              ) : (
                searchResults.map(user => (
                  <div
                    key={user.id}
                    onClick={() => goToProfile(user.id)}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-400">{user.total_burgers} burgers</p>
                      </div>
                    </div>
                    <span className="text-xl">→</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
