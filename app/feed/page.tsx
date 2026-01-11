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

        // 2. Traer burgers de TODOS los usuarios
        // TRUCO DE SUPABASE: Join automático con tablas relacionadas
        const { data, error } = await supabase
            .from('burgers')
            .select(`
                *,
                profiles (full_name, avatar_url),
                likes (user_id) 
            `)
            .order('created_at', { ascending: false })
            .limit(20) // Límite inicial para no saturar

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
          <Link href="/" className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
              🏠
          </Link>
      </div>

      {/* LISTA DE POSTS */}
      <div className="max-w-md mx-auto p-4">
          {loading ? (
              // Skeletors de carga
              [1,2].map(i => (
                  <div key={i} className="bg-white h-80 rounded-[2rem] mb-6 animate-pulse shadow-sm"></div>
              ))
          ) : (
              posts.map(post => (
                  <FeedCard key={post.id} burger={post} currentUser={currentUser} />
              ))
          )}
          
          <div className="text-center text-gray-400 text-xs mt-8 mb-4">
              ¡Eso es todo por ahora, gordo! 🍔
          </div>
      </div>

    </div>
  )
}