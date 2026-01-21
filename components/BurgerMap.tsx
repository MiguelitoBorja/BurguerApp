'use client'
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'

interface MapProps {
  burgers: any[]
}

export default function BurgerMap({ burgers }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])
  const [zoom] = useState(12)
  // Coordenadas por defecto (Buenos Aires). Cámbialas a tu ciudad
  const [center] = useState<{lng: number, lat: number}>({ lng: -58.3816, lat: -34.6037 })

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // 1. Inicializar Mapa
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // Estilo gratuito de Carto (Claro y moderno)
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [center.lng, center.lat],
      zoom: zoom,
      attributionControl: false
    })

    // Controles de navegación (+/-)
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

  }, [])

  // 2. Agregar Marcadores (Burgers)
  useEffect(() => {
    if (!map.current) return

    // Limpiar marcadores anteriores
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    burgers.forEach(burger => {
        if(burger.lat && burger.lng) {
            
            // Crear elemento HTML para el marcador (tu emoji o foto mini)
            const el = document.createElement('div')
            el.className = 'marker'
            el.style.backgroundImage = `url(${burger.foto_url})`
            el.style.width = '40px'
            el.style.height = '40px'
            el.style.backgroundSize = 'cover'
            el.style.borderRadius = '50%'
            el.style.border = '3px solid white'
            el.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)'
            el.style.cursor = 'pointer'

            // Crear Popup
            const popup = new maplibregl.Popup({ offset: 25 }).setHTML(
                `<div class="text-center p-1">
                    <h3 class="font-bold text-sm">${burger.nombre_lugar}</h3>
                    <div class="text-yellow-500 text-xs">${'⭐'.repeat(Math.round(burger.rating))}</div>
                    <p class="text-xs text-gray-500 mt-1 font-bold">$${burger.precio || '?'}</p>
                </div>`
            )

            // Agregar al mapa
            const marker = new maplibregl.Marker({ element: el })
                .setLngLat([burger.lng, burger.lat])
                .setPopup(popup)
                .addTo(map.current!)
            
            markersRef.current.push(marker)
        }
    })

    // Auto-centrar el mapa para que se vean todos los puntos
    if (burgers.length > 0) {
        const bounds = new maplibregl.LngLatBounds()
        let hasCoords = false
        burgers.forEach(b => {
            if(b.lat && b.lng) {
                bounds.extend([b.lng, b.lat])
                hasCoords = true
            }
        })
        if(hasCoords && map.current) {
            map.current.fitBounds(bounds, { padding: 50, maxZoom: 15 })
        }
    }

  }, [burgers])

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-xl border border-white/50">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Overlay decorativo */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-gray-600 shadow-sm z-10">
          🗺️ Mapa del Delito
      </div>
    </div>
  )
}