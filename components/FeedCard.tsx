'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../app/lib/supabaseClient'
import StarRating from './StarRating' // Reutilizamos tus estrellas

interface Burger {
  id: number
  nombre_lugar: string
  rating: number
  foto_url: string
  precio?: number
  likes?: { user_id: string }[]
  profiles?: {
    full_name?: string
    avatar_url?: string
  }
}

interface CurrentUser {
  id: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
}

interface FeedCardProps {
  burger: Burger
  currentUser: CurrentUser | null
}

export default function FeedCard({ burger, currentUser }: FeedCardProps) {
  const [liked, setLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  // 1. Cargar estado inicial (si ya di like y contar totales)
  useEffect(() => {
    // Verificar si el usuario actual ya dio like
    const userHasLiked = burger.likes && burger.likes.some((l: any) => l.user_id === currentUser?.id)
    setLiked(!!userHasLiked)
    
    // Contar likes (Supabase devuelve array de objetos, usamos length o el count directo si usaste head)
    // Asumiremos que traemos el array 'likes' en la query
    setLikesCount(burger.likes ? burger.likes.length : 0)
  }, [burger, currentUser])

  // --- MANEJO DE LIKES ---
  const toggleLike = async () => {
    if (!currentUser) return
    
    // Optimistic UI (Actualizar visualmente antes de esperar al servidor)
    const previousState = liked
    const previousCount = likesCount
    
    setLiked(!liked)
    setLikesCount(liked ? likesCount - 1 : likesCount + 1)

    try {
        if (liked) {
            // Quitar like
            await supabase.from('likes').delete().match({ user_id: currentUser.id, burger_id: burger.id })
        } else {
            // Dar like
            await supabase.from('likes').insert([{ user_id: currentUser.id, burger_id: burger.id }])
        }
    } catch (error) {
        // Revertir si falla
        setLiked(previousState)
        setLikesCount(previousCount)
        console.error(error)
    }
  }

  // --- MANEJO DE COMENTARIOS ---
  const loadComments = async () => {
      if(showComments) {
          setShowComments(false)
          return
      }
      setLoadingComments(true)
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('burger_id', burger.id)
        .order('created_at', { ascending: true })
      
      if(data) setComments(data)
      setLoadingComments(false)
      setShowComments(true)
  }

  const postComment = async (e: React.FormEvent) => {
      e.preventDefault()
      if(!newComment.trim() || !currentUser) return

      const tempId = Date.now() // ID temporal para UI
      const optimisticComment = {
          id: tempId,
          content: newComment,
          user_id: currentUser.id,
          profiles: { full_name: currentUser.user_metadata.full_name, avatar_url: currentUser.user_metadata.avatar_url }
      }

      setComments([...comments, optimisticComment])
      setNewComment('')

      const { error } = await supabase
        .from('comments')
        .insert([{ user_id: currentUser.id, burger_id: burger.id, content: optimisticComment.content }])

      if(error) console.error("Error comentando")
  }

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden mb-6">
      
      {/* HEADER: Usuario */}
      <div className="flex items-center gap-3 p-4">
         <img src={burger.profiles?.avatar_url || '/logo.png'} className="w-10 h-10 rounded-full border border-gray-200 object-cover" />
         <div>
             <p className="font-bold text-sm text-gray-800">{burger.profiles?.full_name}</p>
             <p className="text-xs text-gray-400">En <span className="font-semibold text-orange-500">{burger.nombre_lugar}</span></p>
         </div>
         <div className="ml-auto">
             <StarRating value={burger.rating} readOnly size="sm" />
         </div>
      </div>

      {/* FOTO GRANDE */}
      <div className="relative w-full aspect-square bg-gray-100">
          <img src={burger.foto_url} className="w-full h-full object-cover" loading="lazy" />
          {/* Precio Flotante */}
          {burger.precio && (
              <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                  ${burger.precio}
              </div>
          )}
      </div>

      {/* ACCIONES (Like / Comentar) */}
      <div className="p-4">
          <div className="flex items-center gap-4 mb-3">
              {/* Botón Like */}
              <button 
                onClick={toggleLike}
                className="flex items-center gap-1 group transition-all"
              >
                  <span className={`text-2xl transition-transform duration-200 ${liked ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {liked ? '❤️' : '🤍'}
                  </span>
                  {likesCount > 0 && <span className="font-bold text-sm text-gray-600">{likesCount}</span>}
              </button>

              {/* Botón Comentar */}
              <button onClick={loadComments} className="flex items-center gap-1 group">
                  <span className="text-2xl transform scale-x-[-1]">💬</span>
                  <span className="font-bold text-sm text-gray-600">Comentar</span>
              </button>
          </div>

          {/* SECCIÓN DE COMENTARIOS */}
          {showComments && (
              <div className="bg-gray-50 rounded-xl p-3 animate-in fade-in slide-in-from-top-2">
                  <div className="max-h-40 overflow-y-auto space-y-3 mb-3 custom-scrollbar">
                      {loadingComments ? <p className="text-xs text-center text-gray-400">Cargando...</p> : 
                       comments.length === 0 ? <p className="text-xs text-center text-gray-400 py-2">Sé el primero en opinar 🍔</p> :
                       comments.map((c: any) => (
                          <div key={c.id} className="flex gap-2">
                              <img src={c.profiles?.avatar_url} className="w-6 h-6 rounded-full mt-1" />
                              <div className="bg-white p-2 rounded-tr-xl rounded-br-xl rounded-bl-xl shadow-sm text-xs">
                                  <span className="font-bold block text-gray-700">{c.profiles?.full_name?.split(' ')[0]}</span>
                                  <span className="text-gray-600">{c.content}</span>
                              </div>
                          </div>
                       ))
                      }
                  </div>
                  
                  {/* Input Nuevo Comentario */}
                  <form onSubmit={postComment} className="flex gap-2">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="¡Qué buena pinta!" 
                        className="flex-1 bg-white border border-gray-200 rounded-full px-3 py-2 text-xs focus:outline-none focus:border-orange-300"
                      />
                      <button type="submit" disabled={!newComment} className="text-orange-500 font-bold text-xs disabled:opacity-50">
                          Enviar
                      </button>
                  </form>
              </div>
          )}
      </div>
    </div>
  )
}