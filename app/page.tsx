
'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import BurgerDashboard from '../components/BurgerDashboard'

interface Burger {
  id?: number
  nombre_lugar: string
  foto_url: string
  rating: number
  created_at?: string
  user_id?: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [lugar, setLugar] = useState('')
  const [rating, setRating] = useState(0)
  const [burgersList, setBurgersList] = useState<Burger[]>([])
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)

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
    .eq('user_id', user.id) // Solo las mías
    .order('created_at', { ascending: false }) // Las más nuevas primero

  if (error) console.log('Error fetching:', error)
  else setBurgersList(data || [])
}
  useEffect(() => {
    // Verificar si hay usuario conectado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      fetchBurgers()
    })

    return () => subscription.unsubscribe()
  }, [])
  
  const handleUpload = async () => {
    if (!file || !lugar) return showNotification('Sube foto y pon nombre!', 'error')
    setUploading(true)

    try {
      // 1. Subir imagen al Bucket 'hamburguesas'
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const { error: fileError } = await supabase.storage
        .from('hamburguesas')
        .upload(fileName, file)

      if (fileError) throw fileError

      // 2. Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('hamburguesas')
        .getPublicUrl(fileName)

      // 3. Guardar registro en la tabla 'burgers'
      const { error: dbError } = await supabase
        .from('burgers')
        .insert([{ nombre_lugar: lugar, foto_url: publicUrl, rating }])

      if (dbError) throw dbError

      showNotification('¡Hamburguesa registrada! 🍔🎉', 'success')
      setLugar('')
      setFile(null)
      setRating(0)
      fetchBurgers() // Actualizar lista
      
    } catch (error) {
      console.error(error)
      showNotification('Error al subir: ' + (error as Error).message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000',
      },
    })
    if (error) console.log('Error login:', error.message)
  }

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.log('Error logout:', error.message)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-200">
      {/* Notificación Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-bold`}>
          <span className="text-2xl">{notification.type === 'success' ? '✅' : '❌'}</span>
          <span>{notification.message}</span>
        </div>
      )}
      
      {!user ? (
        /* No hay usuario conectado - Mostrar pantalla de login atractiva */
        <div className="w-full max-w-lg">
          {/* Contenedor principal con efecto de tarjeta */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 space-y-8 relative overflow-hidden">
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-200 rounded-full blur-3xl opacity-30 -ml-20 -mb-20"></div>
            
            {/* Logo y título */}
            <div className="text-center relative z-10">
              {/* Aquí va tu logo PNG */}
              <div className="mb-6 flex justify-center">
                <div className="w-28 h-28 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform">
                  <img src="/logo.png" alt="Burger Tracker" className="w-20 h-20" />
                </div>
              </div>
              <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-500 mb-3">
                Burger Tracker
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Registra y analiza tus hamburguesas favoritas
              </p>
            </div>

            {/* Botón de login mejorado */}
            <div className="space-y-4 relative z-10">
              <button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <div className="bg-white p-2 rounded-lg group-hover:rotate-12 transition-transform">
                  <img src="https://authjs.dev/img/providers/google.svg" className="w-6 h-6" alt="Google" />
                </div>
                <span className="text-lg">Entrar con Google</span>
              </button>
              
              {/* Features */}
              <div className="grid grid-cols-3 gap-4 pt-4 text-center">
                <div>
                  <div className="text-3xl mb-2">📸</div>
                  <p className="text-xs text-gray-600 font-medium">Sube fotos</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">⭐</div>
                  <p className="text-xs text-gray-600 font-medium">Califica</p>
                </div>
                <div>
                  <div className="text-3xl mb-2">📊</div>
                  <p className="text-xs text-gray-600 font-medium">Analiza</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Usuario conectado - Mostrar perfil y formulario */
        <div className="w-full max-w-md space-y-4">
          {/* Perfil del usuario */}
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-bold text-gray-800">{user.user_metadata.full_name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Salir
            </button>
          </div>

          {/* Formulario de subida */}
          <div className="bg-white p-6 rounded-xl shadow-lg space-y-4">
            
            {/* Input Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700">¿Dónde comiste?</label>
              <input 
                type="text" 
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                placeholder="Ej: McDonald's"
              />
            </div>

            {/* Rating con estrellas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Calificación</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="text-3xl transition-all hover:scale-110"
                  >
                    {star <= rating ? '⭐' : '☆'}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Archivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Foto de la bestia</label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
              />
            </div>

            {/* Botón */}
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-orange-600 text-white font-bold py-2 px-4 rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {uploading ? 'Subiendo...' : 'Registrar Hamburguesa'}
            </button>
          </div>

          {/* Dashboard de estadísticas */}
          {burgersList.length > 0 && (
            <BurgerDashboard burgers={burgersList} />
          )}
        </div>
      )}
    </main>
  )
}