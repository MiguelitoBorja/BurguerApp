'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient' // Usamos @ para ir a la raíz seguro
import type { User } from '@supabase/supabase-js'
import BurgerDashboard from '@/components/BurgerDashboard' // Usamos @ para importar seguro

// Definimos la interfaz exacta de tus datos
interface Burger {
  id: string // UUID es string
  nombre_lugar: string
  foto_url: string
  rating: number
  precio: number | null
  created_at: string
  user_id: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  
  // Estados del formulario
  const [file, setFile] = useState<File | null>(null)
  const [lugar, setLugar] = useState('')
  const [rating, setRating] = useState(0)
  const [precio, setPrecio] = useState('')
  
  // Estados de datos y UI
  const [burgersList, setBurgersList] = useState<Burger[]>([])
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  // Estados para EDITAR
  const [isEditing, setIsEditing] = useState(false)
  const [currentBurger, setCurrentBurger] = useState<Burger | null>(null)

  // --- 1. UTILS ---
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchBurgers = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('burgers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) console.log('Error fetching:', error)
    else setBurgersList((data as Burger[]) || [])
  }

  // --- 2. EFECTOS ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBurgers() // Cargar datos si ya hay sesión
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) fetchBurgers()
    })

    return () => subscription.unsubscribe()
  }, [])
  
  // --- 3. HANDLERS ---
  const handleUpload = async () => {
    if (!file || !lugar) return showNotification('Sube foto y pon nombre!', 'error')
    setUploading(true)

    try {
        const currentUser = (await supabase.auth.getUser()).data.user
        if (!currentUser) throw new Error("No usuario")

        // Subir imagen
        const fileExt = file.name.split('.').pop()
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`
        
        const { error: fileError } = await supabase.storage
            .from('hamburguesas')
            .upload(fileName, file)

        if (fileError) throw fileError

        // Obtener URL
        const { data: { publicUrl } } = supabase.storage
            .from('hamburguesas')
            .getPublicUrl(fileName)

        // Guardar en BD
        const { error: dbError } = await supabase
            .from('burgers')
            .insert([{ 
                nombre_lugar: lugar, 
                foto_url: publicUrl, 
                rating, 
                precio: precio ? parseFloat(precio) : null,
                user_id: currentUser.id
            }])

        if (dbError) throw dbError

        showNotification('¡Hamburguesa registrada! 🍔🎉', 'success')
        setLugar('')
        setFile(null)
        setRating(0)
        setPrecio('')
        fetchBurgers()
      
    } catch (error) {
      console.error(error)
      showNotification('Error al subir: ' + (error as Error).message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que quieres borrar este recuerdo? 😢")) return;

    try {
      const { error } = await supabase
        .from('burgers')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      showNotification('Hamburguesa eliminada', 'success')
      fetchBurgers()
    } catch (error) {
      showNotification('Error al borrar', 'error')
      console.error(error)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentBurger) return

    try {
      const { error } = await supabase
        .from('burgers')
        .update({
            nombre_lugar: currentBurger.nombre_lugar,
            precio: currentBurger.precio,
            rating: currentBurger.rating
        })
        .eq('id', currentBurger.id)

      if (error) throw error

      showNotification('¡Cambios guardados! 📝', 'success')
      setIsEditing(false)
      setCurrentBurger(null)
      fetchBurgers()
    } catch (error) {
      showNotification('Error al actualizar', 'error')
      console.error(error)
    }
  }

  const openEditModal = (burger: Burger) => {
    setCurrentBurger(burger)
    setIsEditing(true)
  }

  // Auth Handlers
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}` },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setBurgersList([])
  }

  // --- 4. RENDER ---
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-200 font-nunito">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-bold`}>
          <span>{notification.message}</span>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {isEditing && currentBurger && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Editar Hamburguesa</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500">Lugar</label>
                        <input 
                            type="text" 
                            value={currentBurger.nombre_lugar}
                            onChange={(e) => setCurrentBurger({...currentBurger, nombre_lugar: e.target.value})}
                            className="w-full bg-gray-50 p-2 rounded-lg border border-gray-200 text-black"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500">Precio</label>
                        <input 
                            type="number" 
                            value={currentBurger.precio || ''}
                            onChange={(e) => setCurrentBurger({...currentBurger, precio: parseFloat(e.target.value)})}
                            className="w-full bg-gray-50 p-2 rounded-lg border border-gray-200 text-black"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 mb-1 block">Rating</label>
                        <div className="flex gap-2">
                             {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} type="button" onClick={() => setCurrentBurger({...currentBurger, rating: star})}
                                className={`text-2xl ${star <= currentBurger.rating ? 'grayscale-0' : 'grayscale opacity-30'}`}>
                                    ⭐
                                </button>
                             ))}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 text-gray-500 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
      )}
      
      {!user ? (
        /* VISTA LOGIN */
        <div className="w-full max-w-lg">
           <div className="bg-white rounded-3xl shadow-2xl p-12 space-y-8 relative overflow-hidden text-center">
             <h1 className="text-4xl font-black text-orange-600">Burger Tracker 🍔</h1>
             <button onClick={handleLogin} className="w-full bg-white border border-gray-300 p-4 rounded-xl shadow font-bold text-gray-700 flex justify-center gap-2 hover:bg-gray-50">
                <img src="https://authjs.dev/img/providers/google.svg" className="w-6 h-6" alt="Google" />
                Entrar con Google
             </button>
           </div>
        </div>
      ) : (
        /* VISTA APP */
        <div className="w-full max-w-md space-y-6">
          
          {/* Header */}
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={user.user_metadata.avatar_url} className="w-10 h-10 rounded-full border-2 border-orange-200"/>
              <span className="font-bold text-gray-700 truncate max-w-[150px]">{user.user_metadata.full_name}</span>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-semibold">Salir</button>
          </div>

          {/* Formulario */}
          <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            <h2 className="text-lg font-bold text-gray-800">Nueva Burger 🍔</h2>

            {/* Foto primero */}
            <div className="relative mb-4">
              {file ? (
                <div className="relative w-full flex flex-col items-center">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Vista previa"
                    className="w-full h-48 object-cover rounded-xl border-2 border-orange-200"
                  />
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute top-2 right-2 bg-white/80 rounded-full p-1 shadow hover:bg-red-100"
                    aria-label="Quitar foto"
                  >
                    ❌
                  </button>
                </div>
              ) : (
                <>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full bg-orange-50 text-orange-600 font-bold py-3 px-4 rounded-xl cursor-pointer border-2 border-dashed border-orange-200 hover:bg-orange-100 transition-colors"
                  >
                    📸 Subir foto
                  </label>
                </>
              )}
            </div>

            <input type="text" value={lugar} onChange={(e) => setLugar(e.target.value)} 
                className="w-full bg-gray-50 p-3 rounded-full focus:ring-2 focus:ring-orange-400 outline-none text-black" placeholder="¿Dónde comiste?" />

            <div className="flex gap-4">
                <div className="flex-1">
                    <input type="number" value={precio} onChange={(e) => setPrecio(e.target.value)}
                        className="w-full bg-gray-50 p-3 rounded-full outline-none text-black" placeholder="$ Precio" />
                </div>
                <div className="flex items-center gap-1">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setRating(star)} className="text-2xl transition hover:scale-110">
                            {star <= rating ? '⭐' : '☆'}
                        </button>
                     ))}
                </div>
            </div>

            <button onClick={handleUpload} disabled={uploading} className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-700 disabled:opacity-50 shadow-lg">
              {uploading ? 'Subiendo...' : 'Registrar'}
            </button>
          </div>

          {/* Dashboard Component */}
          {burgersList.length > 0 && (
             <BurgerDashboard burgers={burgersList} />
          )}

          {/* LISTA HISTORIAL */}
          <div className="pt-4 pb-12">
            <h2 className="text-xl font-black text-white mb-4 drop-shadow-md">Tu Historial 📜</h2>
            <div className="space-y-4">
                {burgersList.map((burger) => (
                    <div key={burger.id} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col">
                        <div className="h-48 w-full bg-gray-200 relative">
                            <img src={burger.foto_url} alt={burger.nombre_lugar} className="w-full h-full object-cover" />
                            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-lg text-xs font-bold shadow-sm text-black">
                                {new Date(burger.created_at).toLocaleDateString()}
                            </div>
                        </div>
                        
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg text-gray-800">{burger.nombre_lugar}</h3>
                                <div className="flex text-sm">
                                    {Array(burger.rating).fill('⭐')}
                                </div>
                            </div>
                            {burger.precio && (
                                <p className="text-green-600 font-bold mb-4">$ {burger.precio}</p>
                            )}
                            
                            <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                                <button 
                                    onClick={() => openEditModal(burger)}
                                    className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors"
                                >
                                    ✏️ Editar
                                </button>
                                <button 
                                    onClick={() => handleDelete(burger.id)}
                                    className="flex-1 py-2 bg-red-50 text-red-600 rounded-lg font-bold text-sm hover:bg-red-100 transition-colors"
                                >
                                    🗑️ Borrar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>

        </div>
      )}
    </main>
  )
}