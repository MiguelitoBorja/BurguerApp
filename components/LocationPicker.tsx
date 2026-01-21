'use client'
import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'

interface LocationPickerProps {
  initialLat?: number | null
  initialLng?: number | null
  onLocationSelect: (lat: number, lng: number) => void
}

export default function LocationPicker({ initialLat, initialLng, onLocationSelect }: LocationPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  
  // Coordenadas por defecto (Obelisco, BsAs) o las que vienen de la burger
  const startLat = initialLat || -34.6037
  const startLng = initialLng || -58.3816

  useEffect(() => {
    if (map.current || !mapContainer.current) return

    // 1. Iniciar Mapa
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
      center: [startLng, startLat],
      zoom: 13,
      attributionControl: false
    })

    // 2. Agregar control de navegación
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')

    // 3. Si ya hay coordenadas, poner el marcador inicial
    if (initialLat && initialLng) {
        marker.current = new maplibregl.Marker({ color: '#f97316' }) // Naranja
            .setLngLat([initialLng, initialLat])
            .addTo(map.current)
    }

    // 4. EVENTO CLICK: Mover el marcador
    map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat
        
        // Si no hay marcador, crear uno
        if (!marker.current) {
            marker.current = new maplibregl.Marker({ color: '#f97316' })
                .setLngLat([lng, lat])
                .addTo(map.current!)
        } else {
            // Si ya hay, moverlo
            marker.current.setLngLat([lng, lat])
        }

        // Avisar al padre
        onLocationSelect(lat, lng)
    })

  }, [])

  return (
    <div className="space-y-2">
        <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-orange-100 shadow-inner">
            <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
            <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-md text-[10px] font-bold text-gray-500 shadow-sm pointer-events-none z-10">
                📍 Toca el mapa para fijar ubicación
            </div>
        </div>
    </div>
  )
}