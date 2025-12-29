'use client'
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Trophy, Calendar, MapPin, TrendingUp } from 'lucide-react'

export default function BurgerDashboard({ burgers }) {
  // 1. PROCESAMIENTO DE DATOS (Data Science casero)
  
  // A. Total Anual
  const total = burgers.length

  // B. Burger favorita (Moda estadística)
  const lugares = burgers.map(b => b.nombre_lugar)
  const contadorLugares = lugares.reduce((acc, lugar) => {
    acc[lugar] = (acc[lugar] || 0) + 1
    return acc
  }, {})
  
  // Ordenar lugares por frecuencia
  const topLugares = Object.entries(contadorLugares)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Top 3

  const lugarFavorito = topLugares[0] ? topLugares[0][0] : 'Ninguno aún'

  // C. Burgers por Mes (Para el gráfico)
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const dataGrafico = meses.map((mes, index) => {
    return {
      name: mes,
      cantidad: burgers.filter(b => new Date(b.created_at).getMonth() === index).length
    }
  })

  // D. Mes actual
  const mesActual = new Date().getMonth()
  const totalMes = burgers.filter(b => new Date(b.created_at).getMonth() === mesActual).length

  // 2. RENDERIZADO (UI)
  return (
    <div className="w-full max-w-md space-y-6">
      
      {/* TARJETAS DE KPIs (Key Performance Indicators) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Total Anual */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Trophy size={18} />
            <span className="text-xs font-bold uppercase">Total Año</span>
          </div>
          <p className="text-4xl font-black text-gray-900">{total}</p>
        </div>

        {/* Total Mes */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Calendar size={18} />
            <span className="text-xs font-bold uppercase">Este Mes</span>
          </div>
          <p className="text-4xl font-black text-gray-900">{totalMes}</p>
        </div>
      </div>

      {/* GRÁFICO DE BARRAS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
          <TrendingUp size={16} /> Ritmo de Consumo
        </h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataGrafico}>
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: '#fff7ed'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                {dataGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === mesActual ? '#ea580c' : '#fb923c'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP LUGARES */}
      <div className="bg-white p-5 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
          <MapPin size={16} /> Top Restaurantes
        </h3>
        <div className="space-y-3">
          {topLugares.length > 0 ? topLugares.map(([lugar, count], index) => (
            <div key={lugar} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {index + 1}
                </span>
                <span className="font-medium text-gray-800">{lugar}</span>
              </div>
              <span className="text-sm font-bold text-orange-600">{count} 🍔</span>
            </div>
          )) : (
            <p className="text-sm text-gray-400 italic">Sube tu primera burger para ver el ranking.</p>
          )}
        </div>
      </div>
    </div>
  )
}