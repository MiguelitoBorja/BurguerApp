
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
  precio?: number
  created_at?: string
  user_id?: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [lugar, setLugar] = useState('')
  const [rating, setRating] = useState(0)
  const [precio, setPrecio] = useState('')
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
        .insert([{ nombre_lugar: lugar, foto_url: publicUrl, rating, precio: precio ? parseFloat(precio) : null }])

      if (dbError) throw dbError

      showNotification('¡Hamburguesa registrada! 🍔🎉', 'success')
      setLugar('')
      setFile(null)
      setRating(0)
      setPrecio('')
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
          {/* Header con Logo y Perfil */}
          <div className="bg-white p-4 rounded-xl shadow-lg flex items-center justify-between">
            {/* Logo lado izquierdo */}
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
             <img src="/logo.png" alt="Logo" className="w-8 h-8" />
            </div>
            
            {/* Avatar y botón salir lado derecho */}
            <div className="flex items-center gap-3">
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-10 h-10 rounded-full border-2 border-orange-200"
              />
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800 font-semibold"
              >
                Salir
              </button>
            </div>
          </div>

          {/* KPI Cards - Estadísticas */}
          <div className="grid grid-cols-3 gap-3">
            {/* Promedio Rating */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {burgersList.length > 0 
                  ? (burgersList.reduce((sum, b) => sum + b.rating, 0) / burgersList.length).toFixed(1)
                  : '0.0'
                }
              </p>
              <p className="text-sm text-gray-600 font-medium">Promedio</p>
            </div>

            {/* Total Gastado */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl font-black text-gray-900">
                ${burgersList.reduce((sum, b) => sum + (b.precio || 0), 0).toFixed(0)}
              </p>
              <p className="text-sm text-gray-600 font-medium">Gastado</p>
            </div>

            {/* Top Rated */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {burgersList.length > 0 
                  ? [...burgersList].sort((a, b) => b.rating - a.rating)[0]?.nombre_lugar.slice(0, 8)
                  : '-'
                }
              </p>
              <p className="text-sm text-gray-600 font-medium">Top rated</p>
            </div>
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

            {/* Input Precio */}
            <div>
              <label className="block text-sm font-medium text-gray-700">¿Cuánto costó?</label>
              <input 
                type="number" 
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2 text-black"
                placeholder="Ej: 150"
              />
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