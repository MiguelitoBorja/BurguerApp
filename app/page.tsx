
'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [lugar, setLugar] = useState('')
  const [rating, setRating] = useState(0)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // Verificar si hay usuario conectado
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])
  
  const handleUpload = async () => {
    if (!file || !lugar) return alert('Sube foto y pon nombre!')
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

      alert('¡Hamburguesa registrada!')
      setLugar('')
      setFile(null)
      setRating(0)
      
    } catch (error) {
      console.error(error)
      alert('Error al subir: ' + (error as Error).message)
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
    <main className="flex min-h-screen flex-col items-center p-8 bg-orange-50">
      <h1 className="text-3xl font-bold mb-8 text-orange-600">🍔 Burger Tracker</h1>
      
      {!user ? (
        /* No hay usuario conectado - Mostrar botón de login */
        <div className="w-full max-w-md">
          <button
            onClick={handleLogin}
            className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2 px-4 rounded flex items-center justify-center gap-2 hover:bg-gray-50"
          >
            <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5" alt="Google" />
            Entrar con Google
          </button>
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
        </div>
      )}
    </main>
  )
}