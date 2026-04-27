import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale/id';

const DashboardCalendar = ({ itemVariants }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  return (
    <motion.div 
      variants={itemVariants}
      className="bg-white dark:bg-zinc-800/80 rounded-[2.5rem] p-8 shadow-[0_15px_45px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-zinc-200 dark:border-zinc-700/50 backdrop-blur-md"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight">
          {format(currentDate, 'MMMM yyyy', { locale: id })}
        </h3>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-full text-zinc-400 hover:text-violet-600 transition-all border-none bg-transparent cursor-pointer">
            <ChevronLeft size={16} />
          </button>
          <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-full text-zinc-400 hover:text-violet-600 transition-all border-none bg-transparent cursor-pointer">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'S', 'R', 'K', 'J', 'S', 'M'].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-black text-zinc-400 uppercase">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => {
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, monthStart);
          
          return (
            <div 
              key={i} 
              className={`aspect-square flex items-center justify-center rounded-full text-xs font-bold transition-all
                ${!isCurrentMonth ? 'text-zinc-200 dark:text-zinc-700' : 'text-zinc-600 dark:text-zinc-300'}
                ${isToday ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 scale-105' : 'hover:bg-violet-50 dark:hover:bg-violet-900/10 cursor-pointer hover:text-violet-600'}
              `}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DashboardCalendar;
