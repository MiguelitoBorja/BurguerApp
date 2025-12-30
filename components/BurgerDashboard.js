'use client'
import { useState } from 'react'; // <--- AGREGAR ESTO
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trophy, Calendar, MapPin, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react'; // <--- AGREGAR FLECHAS
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isToday, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';// Para que los días salgan en español
import Lottie from "lottie-react";
import moneyAnimation from '/animations/Money.lottie.json';

export default function BurgerDashboard({ burgers }) {
  
 // ESTADO: Controla qué mes estamos viendo (inicia hoy)
  const [fechaVisualizada, setFechaVisualizada] = useState(new Date());

  // DATOS GLOBALES (Estos no cambian al mover el calendario)
  const now = new Date();
  const total = burgers.length;

  // FILTROS BASADOS EN EL MES VISUALIZADO (NO EN "HOY")
  const year = fechaVisualizada.getFullYear();
  const month = fechaVisualizada.getMonth();

  // Cantidad en el mes que estás mirando
  const totalMes = burgers.filter(b => {
    const d = new Date(b.created_at);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
// --- LÓGICA DEL CALENDARIO (Dinámica) ---
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(fechaVisualizada),
    end: endOfMonth(fechaVisualizada),
  });
  const startingDayIndex = getDay(startOfMonth(fechaVisualizada)); 
  const emptyDays = Array(startingDayIndex).fill(null);
const handlePrevMonth = () => setFechaVisualizada(subMonths(fechaVisualizada, 1));
  const handleNextMonth = () => setFechaVisualizada(addMonths(fechaVisualizada, 1));
  // Gráfico: cantidad por mes
  const mesesLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const dataGrafico = Array.from({ length: 12 }, (_, i) => ({
    name: mesesLabels[i],
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

  
  

  // Función para ver si comiste burger ese día
  const getBurgerForDay = (day) => {
    return burgers.filter(b => isSameDay(new Date(b.created_at), day));
  };

  return (
    <div className="w-full max-w-md space-y-6 animate-in fade-in duration-500">
      
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
        
        {/* Gastado */}
        <div className="bg-white rounded-2xl p-4 shadow-lg col-span-2 flex items-center justify-between">
           <div>
             <p className="text-sm text-gray-500 font-bold uppercase mb-1">Inversión Total</p>
             <p className="text-3xl font-black text-gray-900 tracking-tight">
               ${burgers.reduce((sum, b) => sum + (b.precio || 0), 0).toLocaleString()}
             </p>
           </div>
           <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
  <Lottie animationData={moneyAnimation} loop={true} className="w-10 h-10" />
</div>
           </div>
        </div>

        {/* Promedio */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 col-span-1">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">Calidad</p>
          <p className="text-3xl font-black text-gray-900">
            {burgers.length > 0 
              ? (burgers.reduce((sum, b) => sum + b.rating, 0) / burgers.length).toFixed(1)
              : '0.0'
            }
            <span className="text-sm text-yellow-500 ml-1">★</span>
          </p>
        </div>

        {/* Top Rated */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 col-span-1 relative overflow-hidden">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">La Mejor</p>
          <p className="text-lg font-bold text-gray-900 truncate leading-tight" title={topRated?.nombre_lugar}>
            {topRated ? topRated.nombre_lugar : '-'}
          </p>
          {topRated && (
             <div className="text-xs text-orange-500 font-bold mt-1">
                {topRated.rating} Estrellas
             </div>
          )}
        </div>
      </div>

      {/* --- CALENDARIO --- */}
<div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-orange-900/5">
    <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-orange-500"/> 
            <span className="capitalize">{format(fechaVisualizada, 'MMMM', { locale: es })}</span>
            <span className="text-gray-400 font-medium ml-1">{year}</span>
        </h3>

        {/* Botones de navegación */}
        <div className="flex gap-2">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronLeft size={20} className="text-gray-600"/>
            </button>
            <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <ChevronRight size={20} className="text-gray-600"/>
            </button>
        </div>
    </div>

    {/* ... (Aquí sigue el grid de días igual que antes) ... */}
        {/* Grid de días (D L M M J V S) */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center">
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                <span key={d} className="text-xs font-bold text-gray-300">{d}</span>
            ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, i) => <div key={`empty-${i}`} />)} {/* Espacios vacíos */}
            
            {daysInMonth.map((day) => {
                const dayBurgers = getBurgerForDay(day);
                const hasBurger = dayBurgers.length > 0;
                const isCurrentDay = isToday(day);

                return (
                    <div 
                        key={day.toISOString()} 
                        className={`
                            aspect-square rounded-full flex items-center justify-center text-xs font-medium relative transition-all
                            ${hasBurger ? 'bg-orange-500 text-white shadow-md shadow-orange-200 scale-110 z-10 font-bold' : 'text-gray-600 hover:bg-gray-50'}
                            ${isCurrentDay && !hasBurger ? 'border-2 border-orange-200 text-orange-600' : ''}
                        `}
                    >
                        {format(day, 'd')}
                        {/* Indicador si comiste más de una ese día */}
                        {dayBurgers.length > 1 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-3 h-3 flex items-center justify-center rounded-full border border-white">
                                {dayBurgers.length}
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
        <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">
            {totalMes > 0 ? `¡${totalMes} días con gloria este mes!` : 'Aún no hay burgers este mes'}
        </p>
      </div>

      {/* GRÁFICO DE BARRAS */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 mb-4 flex items-center gap-2">
          <TrendingUp size={16} /> Ritmo Anual
        </h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataGrafico}>
              <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#9ca3af'}} />
              <Tooltip 
                cursor={{fill: '#fff7ed'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px'}}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 4, 4]}>
                {dataGrafico.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === mesActual ? '#ea580c' : '#fed7aa'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP LUGARES */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
          <MapPin size={16} /> Podio
        </h3>
        <div className="space-y-3">
          {topLugares.length > 0 ? topLugares.map(([lugar, count], index) => (
            <div key={lugar} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {index + 1}
                </span>
                <span className="font-medium text-gray-800 text-sm">{lugar}</span>
              </div>
              <span className="text-sm font-bold text-orange-600">{count}</span>
            </div>
          )) : (
            <div className="text-center py-4 opacity-50">
                <span className="text-2xl grayscale">🍔</span>
                <p className="text-xs mt-2">Sin datos aún</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}