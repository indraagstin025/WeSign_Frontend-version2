import React from 'react';
import { 
  FileCheck, 
  Hourglass, 
  XOctagon, 
  Plus, 
  FileText,
  AlertCircle,
  ChevronRight,
  MoreVertical,
  Clock
} from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { useDashboard } from '../hooks/useDashboard';
import { Link } from 'react-router-dom';

const OverviewPage = () => {
  const { user } = useUser();
  const { counts, actions, activities, loading, error, refresh } = useDashboard();

  // Mapping Stats dari Backend
  const stats = [
    { 
        label: 'Selesai', 
        value: counts.completed || '0', 
        icon: <FileCheck className="text-emerald-600 dark:text-emerald-400" size={20} />, 
        status: 'bg-emerald-100 dark:bg-emerald-900/30 ring-emerald-200' 
    },
    { 
        label: 'Menunggu', 
        value: counts.process || '0', 
        icon: <Hourglass className="text-amber-600 dark:text-amber-400" size={20} />, 
        status: 'bg-amber-100 dark:bg-amber-900/30 ring-amber-200' 
    },
    { 
        label: 'Draft', 
        value: counts.waiting || '0', 
        icon: <FileText className="text-slate-600 dark:text-slate-400" size={20} />, 
        status: 'bg-slate-100 dark:bg-slate-800 ring-slate-200' 
    }
  ];

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-transparent">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar p-4 sm:p-6 lg:p-8 scroll-smooth">
      <div className="max-w-7xl mx-auto w-full space-y-8 animate-in fade-in duration-700">
        
        {/* 1. Header & Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-white tracking-tight">
              Selamat Datang, {user?.name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Berikut adalah ringkasan aktivitas dokumen digital Anda hari ini.
            </p>
          </div>
        </div>

        {/* 2. Kartu Statistik Utama */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between transition-all hover:shadow-md group cursor-default">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                <h3 className="text-3xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
              </div>
              <div className={`p-3.5 rounded-2xl ring-1 dark:ring-0 ${stat.status} shadow-sm group-hover:scale-105 transition-transform`}>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 3. Action Required Section (Left/Main - 7 Columns) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <AlertCircle size={20} className="text-amber-500" />
                    Perlu Tindakan
                </h3>
            </div>
            
            <div className="space-y-3">
              {actions.length > 0 ? (
                actions.map((action) => {
                  const signPath = action.type === 'package' 
                    ? `/dashboard/packages/sign/${action.id}` 
                    : `/dashboard/documents/sign/${action.id}`;

                  return (
                    <Link 
                      key={action.id} 
                      to={signPath}
                      className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-primary/40 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 group no-underline"
                    >
                      <div className="flex items-center gap-4 truncate">
                        <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                          <FileText size={22} />
                        </div>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">{action.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {action.type === 'package' ? `${action.count} Dokumen` : `Dari: ${action.ownerName}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                          <div className="hidden sm:flex flex-col items-end mr-2">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-md">
                                  {action.status.replace(/_/g, ' ')}
                              </span>
                          </div>
                          <ChevronRight size={18} className="text-slate-400 group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Tidak ada dokumen yang memerlukan tindakan segera. Kerja bagus!</p>
                </div>
              )}
            </div>
          </div>

          {/* 4. Recent Activity (Right - 5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-heading flex items-center gap-2">
                    <Clock size={20} className="text-slate-400" />
                    Aktivitas Terbaru
                </h3>
                <Link to="/dashboard/documents" className="text-sm font-semibold text-primary hover:text-primary-dark transition-colors no-underline">
                    Semua
                </Link>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {activities.length > 0 ? (
                        activities.map((activity, idx) => (
                            <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                    {activity.activityType === 'signature' ? <FileCheck size={18} /> : <FileText size={18} />}
                                </div>
                                <div className="flex-1 truncate">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate mb-0.5 group-hover:text-primary transition-colors">{activity.title}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-500 flex items-center gap-1">
                                        {new Date(activity.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                        <span className="mx-1 opacity-30">ΓÇó</span>
                                        <span className="uppercase font-bold tracking-tighter opacity-70">{activity.activityType}</span>
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <p className="text-sm text-slate-500 dark:text-slate-400">Belum ada aktivitas.</p>
                        </div>
                    )}
                </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OverviewPage;
