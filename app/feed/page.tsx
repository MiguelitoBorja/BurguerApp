'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import FeedCard from '@/components/FeedCard'
import Link from 'next/link'

export default function FeedPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFeed() {
        // 1. Obtener usuario actual
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        if (!user) {
          setLoading(false)
          return
        }

        // 2. Obtener lista de amigos aceptados
        const { data: friendships, error: friendError } = await supabase
          .from('friendships')
          .select('requester_id, receiver_id')
          .eq('status', 'accepted')

        if (friendError) {
          console.error('Error cargando amigos:', friendError)
          setLoading(false)
          return
        }

        // 3. Extraer IDs de amigos (en ambas direcciones)
        let friendIds: string[] = [user.id] // Incluir al usuario actual
        if (friendships && friendships.length > 0) {
          friendships.forEach(f => {
            if (f.requester_id === user.id) {
              friendIds.push(f.receiver_id)
            } else {
              friendIds.push(f.requester_id)
            }
          })
        }

        // 5. Traer burgers solo de amigos y del usuario actual
        if (friendIds.length === 0) {
          setLoading(false)
          return
        }

        const { data, error } = await supabase
            .from('burgers')
            .select(`
                *,
                profiles (full_name, avatar_url),
                likes (user_id) 
            `)
            .in('user_id', friendIds)
            .order('created_at', { ascending: false })
            .limit(20)

        if (!error && data) {
            setPosts(data)
        }
        setLoading(false)
    }
    loadFeed()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-nunito">
      
      {/* HEADER FEED */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-4 shadow-sm border-b border-gray-100 flex justify-between items-center">
          <Link href="/" className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
              Social Burger
          </Link>
          <div className="flex gap-2">
            <Link href="/friends" className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded-full text-sm font-bold transition-colors" title="Ver amigos">
              Amigos
            </Link>
            <Link href="/" className="flex flex-col items-center group" title="Volver al inicio">
              <div className="bg-orange-500 rounded-b-2xl px-3 pt-4 pb-1 shadow-orange-200 shadow-lg ">
                  <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain animate-bounce" />
              </div>
              <span className="mt-1 text-[11px] text-orange-600 font-bold underline group-hover:text-orange-800 transition-colors">
                  Volver
              </span>
            </Link>
          </div>
      </div>

      {/* LISTA DE POSTS */}
      <div className="max-w-md mx-auto p-4">
          {loading ? (
              // Skeletors de carga
              [1,2].map(i => (
                  <div key={i} className="bg-white h-80 rounded-[2rem] mb-6 animate-pulse shadow-sm"></div>
              ))
          ) : posts.length === 0 ? (
              <div className="text-center text-gray-400 text-sm mt-12 space-y-3">
                  <p>No hay comidas en tu feed</p>
                  <p className="text-xs">¡Agrega amigos para ver sus burgers!</p>
                  <Link href="/friends" className="inline-block mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-bold transition-colors text-sm">
                    Ir a Amigos
                  </Link>
              </div>
          ) : (
              posts.map(post => (
                  <FeedCard key={post.id} burger={post} currentUser={currentUser} />
              ))
          )}
          
          {posts.length > 0 && (
              <div className="text-center text-gray-400 text-xs mt-8 mb-4">
                  Eso es todo por ahora!
              </div>
          )}
      </div>

    </div>
  )
}