'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabaseClient'

interface FriendRequest {
  id: string
  requester_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester_profile?: {
    full_name: string
    avatar_url: string
  }
}

interface FriendRequestsProps {
  currentUserId?: string
  showOnlyPending?: boolean
}

export default function FriendRequests({ currentUserId, showOnlyPending = true }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadRequests()
  }, [currentUserId])

  const loadRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const userId = currentUserId || user.id

      let query = supabase
        .from('friendships')
        .select(`
          *,
          requester_profile:profiles!requester_id (full_name, avatar_url)
        `)
        .eq('receiver_id', userId)

      if (showOnlyPending) {
        query = query.eq('status', 'pending')
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (!error && data) {
        setRequests(data as FriendRequest[])
      }
    } catch (error) {
      console.error('Error cargando requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId)

      if (!error) {
        setRequests(requests.filter(r => r.id !== requestId))
      }
    } catch (error) {
      console.error('Error aceptando solicitud:', error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId)
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)

      if (!error) {
        setRequests(requests.filter(r => r.id !== requestId))
      }
    } catch (error) {
      console.error('Error rechazando solicitud:', error)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-400 py-4">Cargando solicitudes...</div>
  }

  if (requests.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        {showOnlyPending ? 'No tienes solicitudes pendientes' : 'No hay solicitudes'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map(request => (
        <div key={request.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <img
              src={request.requester_profile?.avatar_url || '/avatar-placeholder.jpg'}
              alt={request.requester_profile?.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-gray-800 truncate">
                {request.requester_profile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-400">
                {request.status === 'pending' ? 'Solicitud pendiente' : `Solicitud ${request.status}`}
              </p>
            </div>
          </div>

          {request.status === 'pending' && (
            <div className="flex gap-2 ml-2">
              <button
                onClick={() => handleAccept(request.id)}
                disabled={processingId === request.id}
                className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                ✓
              </button>
              <button
                onClick={() => handleReject(request.id)}
                disabled={processingId === request.id}
                className="px-3 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
