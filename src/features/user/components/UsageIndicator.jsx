import React from 'react';
import { Activity, Database, Users } from 'lucide-react';

/**
 * @component UsageIndicator
 * @description Komponen visual untuk menampilkan progres penggunaan kuota dengan efek premium.
 */
const UsageIndicator = ({ label, current, max, icon: Icon, color = "primary" }) => {
  const percentage = Math.round((current / max) * 100);
  
  // Custom colors based on type
  const colorClasses = {
    primary: "bg-primary shadow-primary/20",
    emerald: "bg-emerald-500 shadow-emerald-500/20 text-emerald-600",
    blue: "bg-blue-500 shadow-blue-500/20 text-blue-600",
    amber: "bg-amber-500 shadow-amber-500/20 text-amber-600",
  };

  const activeColor = colorClasses[color] || colorClasses.primary;

  return (
    <div className="p-5 glass-panel border-none animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700`}>
             <Icon size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
            <h3 className="text-lg font-heading font-bold text-slate-800 dark:text-white leading-tight">
              {current} <span className="text-sm font-medium text-slate-400">/ {max}</span>
            </h3>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-heading font-black text-slate-300 dark:text-slate-700">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="relative w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        {/* Glow Effect */}
        <div 
          className={`absolute top-0 left-0 h-full ${activeColor} rounded-full transition-all duration-1000 ease-out shadow-lg`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Subtle Label */}
      <p className="mt-3 text-[10px] text-slate-500 dark:text-slate-400 text-right font-medium italic">
        {percentage >= 90 ? "Kapasitas Hampir Penuh" : "Penggunaan Normal"}
      </p>
    </div>
  );
};

export default UsageIndicator;
