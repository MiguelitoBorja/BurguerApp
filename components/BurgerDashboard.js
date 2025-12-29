import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Calendar, MapPin, TrendingUp } from 'lucide-react';

export default function BurgerDashboard({ burgers }) {
  // 1. PROCESAMIENTO DE DATOS (Data Science casero)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const total = burgers.length;
  const totalMes = burgers.filter(b => {
    const d = new Date(b.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
  // Gráfico: cantidad por mes del año actual
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const dataGrafico = Array.from({ length: 12 }, (_, i) => ({
    name: meses[i],
    cantidad: burgers.filter(b => {
      const d = new Date(b.created_at);
      return d.getFullYear() === year && d.getMonth() === i;
    }).length
  }));
  const mesActual = month;
  // Top lugares
  const topLugares = Object.entries(
    burgers.reduce((acc, b) => {
      acc[b.nombre_lugar] = (acc[b.nombre_lugar] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 5);
  // Top rated
  const topRated = burgers.length > 0 ? [...burgers].sort((a, b) => b.rating - a.rating)[0] : null;

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Grid asimétrica y responsive */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        {/* Total Año */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100 col-span-1">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <Trophy size={18} />
            <span className="text-xs font-bold uppercase">Total Año</span>
          </div>
          <p className="text-4xl font-black text-gray-900">{total}</p>
        </div>
        {/* Este Mes */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 col-span-1">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Calendar size={18} />
            <span className="text-xs font-bold uppercase">Este Mes</span>
          </div>
          <p className="text-4xl font-black text-gray-900">{totalMes}</p>
        </div>
        {/* Gastado (fila completa) */}
        <div className="bg-white rounded-2xl p-4 shadow-lg col-span-2">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-black text-gray-900">${burgers.reduce((sum, b) => sum + (b.precio || 0), 0).toFixed(0)}</p>
          <p className="text-sm text-gray-600 font-medium">Gastado</p>
        </div>
        {/* Promedio (mitad) */}
        <div className="bg-white rounded-2xl p-4 shadow-lg col-span-1">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {burgers.length > 0 
              ? (burgers.reduce((sum, b) => sum + b.rating, 0) / burgers.length).toFixed(1)
              : '0.0'
            }
          </p>
          <p className="text-sm text-gray-600 font-medium">Promedio</p>
        </div>
        {/* Top Rated (mitad) */}
        <div className="bg-white rounded-2xl p-4 shadow-lg col-span-1">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 shadow-md">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <p className="text-3xl font-black text-gray-900 truncate overflow-hidden text-ellipsis" title={topRated ? topRated.nombre_lugar : ''}>
            {topRated ? topRated.nombre_lugar : '-'}
          </p>
          <p className="text-sm text-gray-600 font-medium">Top rated</p>
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
  );
}