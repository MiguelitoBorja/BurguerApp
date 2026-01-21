'use client'

import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient' // Usamos @ para ir a la raíz seguro
import type { User } from '@supabase/supabase-js'
import BurgerDashboard from '@/components/BurgerDashboard' // Usamos @ para importar seguro
import Leaderboard from '@/components/Leaderboard'
import Link from 'next/link'
import { BADGES } from './lib/badges'
import StarRating from '@/components/StarRating'
import confetti from 'canvas-confetti'
import BurgerMap from '@/components/BurgerMap'
// ... otros estados ...

// Definimos la interfaz exacta de tus datos
interface Burger {
  id: string // UUID es string
  nombre_lugar: string
  foto_url: string
  rating: number
  precio: number | null
  created_at: string
  user_id: string
  lat: number | null
  lng: number | null
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  
  // Estados del formulario
  const [sugerencias, setSugerencias] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [lugar, setLugar] = useState('')
  const [rating, setRating] = useState(0)
  const [precio, setPrecio] = useState('')
    // Estados para GPS
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null)
  const [geoError, setGeoError] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  // Estados de datos y UI
  const [burgersList, setBurgersList] = useState<Burger[]>([])
  const [uploading, setUploading] = useState(false)
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  // Estados para EDITAR
  const [isEditing, setIsEditing] = useState(false)
  const [currentBurger, setCurrentBurger] = useState<Burger | null>(null)
  const frases = [
  "¡Qué pinta tiene! 🤤",
  "¡Se ve deliciosa! 😍",
  "¡Eso es un manjar! 🍔",
  "¡Para chuparse los dedos! 😋",
  "¡Esa burger promete! 🔥",
  "¡Nivel chef! 👨‍🍳",
  "¡Quiero una igual! 🥲",
]
const [frasePreview, setFrasePreview] = useState(frases[0])


  // --- 1. UTILS ---
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setGeoError('GPS no soportado')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setGeoError('')
        showNotification('📍 Ubicación obtenida', 'success')
      },
      () => {
        setGeoError('Permiso denegado o error de GPS')
        showNotification('No se pudo obtener tu ubicación', 'error')
      }
    )
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
  useEffect(() => {
  if (file) {
    const random = frases[Math.floor(Math.random() * frases.length)]
    setFrasePreview(random)
  }
}, [file])
useEffect(() => {
  async function cargarLugares() {
    // Truco: Traemos nombres únicos (distinct)
    // Nota: Esto requiere una función RPC en Supabase idealmente, 
    // pero para empezar, traemos todo y filtramos en JS (ok para < 1000 registros)
    const { data } = await supabase.from('burgers').select('nombre_lugar')
    if (data) {
      // Creamos un Set para eliminar duplicados y lo pasamos a array
      const unicos = [...new Set(data.map(item => item.nombre_lugar))]
      setSugerencias(unicos)
    }
  }
  cargarLugares()
}, [])
const chequearLogros = async (userId: string, nuevaBurger: any) => {
    const nuevosLogros = []

    // 1. Traer historial completo para calcular totales
    const { data: historial } = await supabase
        .from('burgers')
        .select('*')
        .eq('user_id', userId)
    
    const total = historial?.length || 0
    const precio = nuevaBurger.precio || 0
    const fecha = new Date()
    const esSabado = fecha.getDay() === 6
    const esNoche = fecha.getHours() >= 20

    // --- REGLAS DE LOGROS ---
    
    // A. Primera Mordida
    if (total === 1) nuevosLogros.push('PRIMERA_MORDIDA')

    // B. Carnívoro Pro
    if (total === 5) nuevosLogros.push('CARNIVORO_PRO')

    // C. El Magnate (Ajusta el precio a tu economía)
    if (precio > 15000) nuevosLogros.push('MAGNATE')

    // D. Fiebre de Sábado
    if (esSabado && esNoche) nuevosLogros.push('FIEBRE_SABADO')

    // E. Crítico Michelin
    if (nuevaBurger.rating === 1) nuevosLogros.push('CRITICO_MICHELIN')


    // --- GUARDAR EN DB SI NO LOS TIENE ---
    if (nuevosLogros.length > 0) {
        for (const codigo of nuevosLogros) {
            // Intentamos insertar. Si ya existe (por el unique), no pasa nada.
            const { error } = await supabase
                .from('user_achievements')
                .insert([{ user_id: userId, achievement_code: codigo }])
            
            // Si no hubo error (significa que es nuevo), mostramos fiesta
            if (!error) {
                const badge = BADGES.find(b => b.code === codigo)
                alert(`🏆 ¡NUEVO LOGRO DESBLOQUEADO!\n\n${badge?.icon} ${badge?.title}\n"${badge?.description}"`) 
                // Nota: Podrías usar showNotification aquí también para que sea más lindo
            }
        }
    }
}
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
                nombre_lugar: normalizarTexto(lugar), 
                foto_url: publicUrl, 
                rating, 
                precio: precio ? parseFloat(precio) : null,
                user_id: currentUser.id,
                lat: coords?.lat || null,
                lng: coords?.lng || null  
            }])

        if (dbError) throw dbError

        showNotification('¡Hamburguesa registrada! 🍔🎉', 'success')
        confetti({
            particleCount: 150, // Cantidad de papelitos
            spread: 100,        // Qué tanto se abren en abanico
            origin: { y: 0.6 }, // Salen desde un poco más abajo del centro
            // Colores temáticos: Naranja, Amarillo, Rojo, Blanco
            colors: ['#f97316', '#fbbf24', '#ef4444', '#ffffff'],
            zIndex: 9999,       // Asegura que se vea por encima de todo
            ticks: 200          // Duran un poco más en el aire
        });
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]) 
        }

        // CHEQUEAR LOGROS (Sin await para que no trabe la UI)
        chequearLogros(currentUser.id, { precio: parseFloat(precio), rating: rating })
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
  
// --- FUNCION NORMALIZAR (Para limpiar el texto) ---
 const normalizarTexto = (texto: string) => {
    let t = texto.trim().toLowerCase();
    
    // 1. Detectar variantes de "Casa"
    const variantesCasa = ['casa', 'mi casa', 'casera', 'home', 'de casa'];
    if (variantesCasa.includes(t)) {
        return 'Hecha en Casa 🏠'; // Unificamos todo aquí
    }

    // 2. Detectar abreviaturas comunes (opcional)
    if (t === 'mcd' || t === 'mc') return "McDonald's";
    if (t === 'bk') return "Burger King";
    if (t === 'mostaza') return "Mostaza"; // Asegurar mayúscula correcta

    // 3. Normalización estándar (Capitalizar)
    return t.replace(/\b\w/g, (c) => c.toUpperCase());
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
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(50) 
      }
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
  // --- LÓGICA DE SUGERENCIAS (Custom Autocomplete) ---
  const sugerenciasFiltradas = lugar.length > 0 
    ? sugerencias.filter(s => 
        s.toLowerCase().includes(lugar.toLowerCase()) && 
        s.toLowerCase() !== lugar.toLowerCase() // No mostrar si ya lo escribí exacto
      ).slice(0, 5) // Máximo 5 sugerencias para no tapar todo
    : []
  // --- 4. RENDER ---
  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gradient-to-br from-orange-400 via-orange-300 to-yellow-200 font-nunito">
      
      {/* Notificación Premium */}
      {notification && (
        <div className="fixed top-6 left-4 right-4 z-[100] flex justify-center pointer-events-none">
          <div className={`
            pointer-events-auto max-w-sm w-full
            flex items-center gap-4 p-4 rounded-2xl shadow-2xl shadow-orange-500/10 border
            animate-in slide-in-from-top-5 fade-in duration-300
            ${notification.type === 'success' 
              ? 'bg-white/95 border-green-100' 
              : 'bg-white/95 border-red-100'
            } backdrop-blur-md
          `}>
            {/* Ícono animado */}
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${notification.type === 'success' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-500'
              }
            `}>
              {notification.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              )}
            </div>

            {/* Texto */}
            <div className="flex-1">
               <h4 className={`text-sm font-black ${notification.type === 'success' ? 'text-gray-800' : 'text-red-600'}`}>
                 {notification.type === 'success' ? '¡Éxito!' : 'Atención'}
               </h4>
               <p className="text-xs font-medium text-gray-500 leading-snug mt-0.5">
                 {notification.message}
               </p>
            </div>

            {/* Botón cerrar */}
            <button 
              onClick={() => setNotification(null)}
              className="text-gray-300 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
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
                        <div className="flex justify-center bg-white p-3 rounded-xl border-2 border-gray-100 shadow-sm">
                        <StarRating 
                            value={currentBurger.rating} 
                            onChange={(val) => setCurrentBurger({...currentBurger, rating: val})}
                            size="lg" // Estrellas grandes para tocar fácil
                        />
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
        /* VISTA LOGIN MEJORADA */
        <div className="w-full max-w-md px-4">
           {/* Tarjeta con efecto Glass/Moderno */}
           <div className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] shadow-2xl p-8 md:p-12 space-y-8 relative overflow-hidden border border-white/20">
             
             {/* Decoración de fondo (Manchas de color) */}
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-50"></div>
             <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-200 rounded-full blur-3xl opacity-50"></div>

             {/* Contenido Principal */}
             <div className="relative z-10 text-center space-y-6">
                 
                 {/* Título con Degradado */}
                 <div>
                    <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 tracking-tight drop-shadow-sm">
                        Burger<br/>Tracker
                    </h1>
                    <p className="text-gray-500 font-bold mt-2 text-sm uppercase tracking-widest">Tu diario de hamburguesas</p>
                 </div>

                 {/* Imagen Principal con sombra flotante */}
                 <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <img 
                        src="/logo.png" 
                        alt="Burger Illustration" 
                        className="w-40 h-40 mx-auto object-contain transform transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 relative z-10 drop-shadow-xl" 
                    />
                 </div>

                 {/* Botón de Google mejorado */}
                 <div className="pt-2">
                     <button 
                        onClick={handleLogin} 
                        className="group relative w-full bg-white text-gray-700 font-bold py-4 px-6 rounded-2xl shadow-lg border border-gray-100 flex items-center justify-center gap-3 transition-all duration-200 hover:shadow-orange-200/50 hover:shadow-xl hover:-translate-y-1 active:scale-95 active:shadow-none"
                     >
                        <img src="https://authjs.dev/img/providers/google.svg" className="w-6 h-6" alt="Google" />
                        <span className="text-lg">Entrar con Google</span>
                        
                        {/* Pequeña flecha que aparece al hover */}
                        <span className="absolute right-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-orange-500">
                            →
                        </span>
                     </button>
                 </div>

                 {/* Pequeños features visuales (Iconos) */}
                 <div className="flex justify-center gap-6 pt-4 border-t border-gray-100">
                    <div className="text-center">
                        <div className="text-xl mb-1">📸</div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Fotos</span>
                    </div>
                    <div className="text-center">
                        <div className="text-xl mb-1">⭐</div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Rating</span>
                    </div>
                    <div className="text-center">
                        <div className="text-xl mb-1">📍</div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Mapa</span>
                    </div>
                 </div>

             </div>
           </div>
           
           {/* Footer sutil */}
           <p className="text-center text-white/80 text-xs font-bold mt-8 drop-shadow-md">
             Hecho con 🍔 y Next.js
           </p>
        </div>
      ) : (
        /* VISTA APP */
        <div className="w-full max-w-md space-y-8 pb-12">
          
          {/* 1. Header Flotante (Glassmorphism) */}
          <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-md p-3 rounded-full shadow-sm border border-white/50 flex items-center justify-between mx-2">
            <Link href="/profile">  <div className="flex items-center gap-3 pl-2">
              <div className="relative">
                <img 
                  src={user.user_metadata.avatar_url} 
                  className="w-10 h-10 rounded-full border-2 border-orange-100 shadow-sm"
                  alt="Avatar"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex flex-col">
                
                <span className="text-sm font-black text-gray-800 leading-tight truncate max-w-[120px]">
                  {user.user_metadata.full_name.split(' ')[0]}
                </span>
              </div>
            
            </div></Link>

            {/* Logo Central Pequeño */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -top-1">
                 <div className="bg-orange-500 rounded-b-2xl px-3 pt-4 pb-1 shadow-orange-200 shadow-lg">
                    <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain animate-bounce" />
                 </div>
            </div>
            <div className="flex items-center gap-2 mr-2">
              <Link
                href="/feed"
                className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                title="Feed global"
              >
                {/* Ícono de comunidad/social */}
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M7 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm10 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM7 22a5 5 0 0 1-5-5v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1a5 5 0 0 1-5 5Zm10 0a5 5 0 0 1-5-5v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1a5 5 0 0 1-5 5Z"/>
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
                title="Cerrar Sesión"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
              </button>
            </div>
          </div>

          {/* 2. Tarjeta de "Nueva Burger" */}
          <div className="bg-white rounded-[2rem] shadow-xl shadow-orange-900/5 p-6 relative overflow-hidden group">
            
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 transition-all group-hover:bg-orange-200"></div>

            <h2 className="text-2xl font-black text-gray-800 mb-6 relative z-10">Registrar <span className="text-orange-500">Festín</span></h2>

            {/* Zona de Foto */}
            <div className="relative mb-6 group/photo">
              {file ? (
                <div className="relative w-full rounded-2xl overflow-hidden shadow-lg transform transition-transform hover:scale-[1.02]">
                  <img
                    src={URL.createObjectURL(file)}
                    alt="Vista previa"
                    className="w-full h-56 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                     <p className="text-white font-bold text-sm">{frasePreview}</p>

                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="absolute top-3 right-3 bg-white text-red-500 rounded-full p-2 shadow-lg hover:bg-red-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*;capture=camera"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-40 bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-2xl cursor-pointer hover:bg-orange-50 hover:border-orange-400 transition-all group-hover/photo:shadow-inner"
                  >
                    <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover/photo:scale-110 transition-transform">
                        <img src="/camara.avif" alt="Logo" className="w-12 h-12 object-contain" />
                    </div>
                    <span className="text-sm font-bold text-orange-400 uppercase tracking-wide">Tomar/Subir Foto</span>
                  </label>
                </>
              )}
            </div>

            {/* Inputs Minimalistas */}
            <div className="space-y-4 relative z-10">
              <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400">📍</span>
                    
                    <input 
                        type="text" 
                        value={lugar} 
                        onChange={(e) => setLugar(e.target.value)} 
                        // Quitamos el 'list' y 'datalist' nativos
                        className="w-full bg-gray-50 pl-10 pr-4 py-3.5 rounded-xl font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all" 
                        placeholder="¿Dónde pecaste hoy?" 
                        autoComplete="off" 
                    />

                    {/* LISTA DE SUGERENCIAS FLOTANTE (NUEVO) */}
                    {sugerenciasFiltradas.length > 0 && (
                        <ul className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                            {sugerenciasFiltradas.map((sug, i) => (
                                <li 
                                    key={i}
                                    onClick={() => setLugar(sug)} // Al hacer click, rellena el input
                                    className="px-4 py-3 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 cursor-pointer border-b border-gray-50 last:border-0 flex items-center gap-2 transition-colors"
                                >
                                    <span className="text-gray-300">🕒</span> {sug}
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* ALERTA DE LUGAR NUEVO */}
                    {lugar.length > 2 && !sugerencias.some(s => s.toLowerCase() === lugar.toLowerCase()) && (
                      <div className="mt-2 ml-2 animate-in fade-in slide-in-from-top-1">
                          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full flex items-center gap-1 w-fit animate-pulse">
                            ✨ Lugar nuevo detectado
                          </span>
                      </div>
                    )}
                    
                    {/* CONFIRMACIÓN VISUAL */}
                    {sugerencias.some(s => s.toLowerCase() === lugar.toLowerCase()) && (
                       <div className="mt-2 ml-2 animate-in fade-in slide-in-from-top-1">
                          <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1 w-fit">
                            ✅ Lugar conocido
                          </span>
                       </div>
                    )}
                </div>

                {/* BOTÓN GPS */}
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={obtenerUbicacion}
                    className={`text-xs font-bold px-3 py-2 rounded-full flex items-center gap-1 transition-all
                      ${coords ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    {coords ? '📍 Ubicación guardada' : '🎯 Usar mi ubicación actual'}
                  </button>
                  {geoError && <span className="text-xs text-red-500">{geoError}</span>}
                </div>

                {/* --- INPUT DE PRECIO (Fila completa) --- */}
                <div className="relative">
                    <span className="absolute left-4 top-3.5 text-gray-400 font-bold text-lg">$</span>
                    <input 
                        type="number" 
                        value={precio} 
                        onChange={(e) => setPrecio(e.target.value)}
                        // Ajusté el pl-10 (padding left) para que el número no se encime al signo $
                        className="w-full bg-gray-50 pl-10 pr-4 py-3.5 rounded-xl font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all text-lg" 
                        placeholder="Precio (Ej: 8500)" 
                    />
                </div>

                {/* --- INPUT DE RATING (Fila propia abajo) --- */}
                <div className="flex flex-col items-center justify-center bg-white border-2 border-orange-100 rounded-xl py-3 shadow-sm">
                    <span className="text-[10px] font-bold text-orange-300 uppercase tracking-widest mb-1">¿Qué tal estuvo?</span>
                    <StarRating 
                        value={rating} 
                        onChange={(val) => setRating(val)} 
                        size="xl" // Usamos XL para que sean fáciles de tocar
                    />
                </div>
            </div>

            {/* Botón Principal (Floating Action) */}
            <button 
                onClick={handleUpload} 
                disabled={uploading} 
                className="mt-6 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-1 disabled:opacity-50 disabled:translate-y-0 active:scale-95 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {uploading ? (
                 <>
                   <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                   <span>Cocinando...</span>
                 </>
              ) : (
                 <>
                   <span>Guardar Hamburguesa</span>
                   
                 </>
              )}
            </button>
          </div>

          {/* 3. Dashboard Component */}
          {burgersList.length >= 0 && (
             <div className="transform transition-all duration-500 animate-in fade-in slide-in-from-bottom-4">
                 <BurgerDashboard burgers={burgersList} />
                  <Leaderboard />
             </div>
          )}

          {/* 4. Toggle y Vista de Historial/Mapa */}
          {burgersList.length > 0 && (
            <div className="pt-2">
                {/* TOGGLE LISTA / MAPA */}
                <div className="flex justify-center mb-6">
                  <div className="bg-white/90 backdrop-blur-md p-1 rounded-2xl flex shadow-lg">
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`px-6 py-3 text-sm font-bold rounded-xl transition-all ${
                        viewMode === 'list' 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      🍔 Lista
                    </button>
                    <button 
                      onClick={() => setViewMode('map')} 
                      className={`px-6 py-3 text-sm font-bold rounded-xl transition-all ${
                        viewMode === 'map' 
                          ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg' 
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      🗺️ Mapa
                    </button>
                  </div>
                </div>

                {/* CONTENIDO CONDICIONAL */}
                {viewMode === 'list' ? (
                  // VISTA LISTA
                  <>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xl font-black text-gray-800 drop-shadow-sm flex items-center gap-2">
                            Historial <span className="text-xs bg-white text-orange-600 px-2 py-0.5 rounded-full shadow-sm">{burgersList.length}</span>
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {burgersList.map((burger) => (
                        <div key={burger.id} className="bg-white rounded-2xl p-3 shadow-md border border-gray-100 flex gap-4 items-center relative overflow-hidden transition-all hover:shadow-lg">
                            
                            {/* Imagen Pequeña (Thumbnail) */}
                            <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden relative shadow-sm">
                                <img src={burger.foto_url} alt={burger.nombre_lugar} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/10"></div>
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800 truncate text-lg leading-tight">{burger.nombre_lugar}</h3>
                                    {burger.precio && (
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                            ${burger.precio}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="flex text-xs mt-1 mb-2 space-x-0.5">
                                    <div className="mt-1 mb-2">
                                      <StarRating value={burger.rating} readOnly size="sm" />
                                  </div>
                                </div>
                                
                                <p className="text-xs text-gray-400 font-medium mb-3">
                                    {new Date(burger.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                                </p>

                                {/* Botones de Acción (Iconos sutiles) */}
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => openEditModal(burger)}
                                        className="text-xs font-bold text-blue-500 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors"
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(burger.id)}
                                        className="text-xs font-bold text-red-400 hover:text-red-600 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
                                    >
                                        🗑️
                                    </button>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
              </>
            ) : (
              // VISTA MAPA
              <div className="h-[500px] w-full mb-8 animate-in fade-in zoom-in-95 duration-300">
                <BurgerMap burgers={burgersList} />
              </div>
            )}
          </div>
          )}
        </div>
      )}
    </main>
  )
}