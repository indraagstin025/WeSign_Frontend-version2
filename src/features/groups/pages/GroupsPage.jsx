import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, Crown, Loader2, AlertCircle,
  ChevronRight, FileText, RefreshCw, Layers
} from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { getAllGroups, createGroup } from '../api/groupService';
import StatusModal from '../../../components/UI/StatusModal';
import { socketService } from '../../../services/socketService';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const fetchGroups = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await getAllGroups();
      if (res.status === 'success') {
        setGroups(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err) {
      setError(err.message || 'Gagal memuat daftar grup.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!currentUser || groups.length === 0) return;
    socketService.connect();
    const joinedGroupIds = groups.map((g) => g.id);
    joinedGroupIds.forEach((gId) => socketService.joinGroupRoom(gId));
    const silentRefresh = () => fetchGroups(true);
    socketService.on('group_member_update', silentRefresh);
    socketService.on('group_document_update', silentRefresh);
    socketService.on('group_info_update', silentRefresh);
    return () => {
      joinedGroupIds.forEach((gId) => socketService.leaveGroupRoom(gId));
      socketService.off('group_member_update', silentRefresh);
      socketService.off('group_document_update', silentRefresh);
      socketService.off('group_info_update', silentRefresh);
    };
  }, [currentUser, groups.length, fetchGroups]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      const res = await createGroup(newGroupName.trim());
      if (res.status === 'success') {
        setNewGroupName('');
        setShowCreateForm(false);
        fetchGroups();
        setStatusModal({
          isOpen: true, type: 'success',
          title: 'Grup Berhasil Dibuat',
          message: `Grup "${newGroupName.trim()}" siap digunakan.`
        });
      }
    } catch (err) {
      setStatusModal({ isOpen: true, type: 'error', title: 'Gagal', message: err.message });
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-emerald-500/50" />
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Memuat Koleksi</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-transparent">
      <div className="max-w-7xl mx-auto p-6 sm:p-10 space-y-10">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500 mb-2">
              <Layers size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Collaboration Workspace</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-white tracking-tight">Grup Anda</h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-md font-medium leading-relaxed">
              Kelola penandatanganan dokumen bersama tim dalam satu ruang kerja yang terorganisir.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchGroups()}
              className="p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-emerald-500 hover:border-emerald-500/30 transition-all cursor-pointer group"
              title="Refresh"
            >
              <RefreshCw size={18} className="group-active:rotate-180 transition-transform duration-500" />
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-zinc-900 dark:bg-emerald-600 hover:bg-zinc-800 dark:hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest border-none cursor-pointer active:scale-95 transition-all shadow-xl shadow-zinc-900/10 dark:shadow-emerald-500/20"
            >
              <Plus size={16} /> Buat Grup
            </button>
          </div>
        </div>

        {/* FORM CREATE GRUP (MODERN INLINE) */}
        {showCreateForm && (
          <div className="bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-3xl p-6 shadow-2xl shadow-emerald-500/5 animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Identitas Grup Baru</h3>
                <p className="text-xs text-zinc-500 font-medium mt-0.5">Tentukan nama yang mudah dikenali oleh tim Anda.</p>
              </div>
            </div>
            <form onSubmit={handleCreateGroup} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Misal: Tim Legal & Finance Q2"
                autoFocus
                className="flex-1 px-5 py-3.5 rounded-2xl border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isCreating || !newGroupName.trim()}
                  className="flex-1 sm:flex-none px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest border-none cursor-pointer disabled:opacity-50 transition-all shadow-lg shadow-emerald-600/20"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : 'Konfirmasi'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewGroupName(''); }}
                  className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border-none bg-transparent cursor-pointer transition-all"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ERROR STATE */}
        {error && (
          <div className="flex items-center gap-4 p-5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-2xl">
            <AlertCircle size={20} className="text-rose-500 shrink-0" />
            <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{error}</p>
            <button onClick={() => fetchGroups()} className="ml-auto text-[10px] font-black uppercase tracking-widest text-rose-600 hover:underline bg-transparent border-none cursor-pointer">Coba Lagi</button>
          </div>
        )}

        {/* GRID GRUP */}
        {!loading && groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {groups.map((group) => {
              const isAdmin = String(group.adminId) === String(currentUser?.id);
              const memberCount = group.members?.length || group._count?.members || 0;
              const docCount = group.documents?.length || group._count?.documents || 0;
              const pendingMySign = group.documents?.filter(doc => {
                const mySr = doc.signerRequests?.find(sr => String(sr.userId) === String(currentUser?.id));
                return mySr?.status === 'PENDING' && doc.status === 'PENDING';
              }).length || 0;

              return (
                <div
                  key={group.id}
                  onClick={() => navigate(`/dashboard/groups/${group.id}`)}
                  className="group relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-[2rem] p-8 cursor-pointer hover:shadow-2xl hover:shadow-zinc-200/50 dark:hover:shadow-emerald-900/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                >
                  {/* Subtle Background Pattern */}
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] group-hover:scale-110 transition-all duration-700 pointer-events-none">
                    <Users size={120} strokeWidth={1} />
                  </div>

                  <div className="relative z-10 flex flex-col h-full">
                    {/* Top Row */}
                    <div className="flex items-start justify-between mb-8">
                      <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-white/5 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-all duration-500">
                        <Users size={24} strokeWidth={1.5} />
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/20">
                          <Crown size={10} />
                          <span className="text-[9px] font-black uppercase tracking-widest">Admin</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mb-8 min-w-0">
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white leading-tight mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {group.name}
                      </h3>
                      <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Users size={12} className="opacity-50" /> {memberCount}</span>
                        <div className="w-1 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                        <span className="flex items-center gap-1.5"><FileText size={12} className="opacity-50" /> {docCount}</span>
                      </div>
                    </div>

                    {/* Action / Notification */}
                    <div className="mt-auto pt-6 border-t border-zinc-50 dark:border-white/5">
                      {pendingMySign > 0 ? (
                        <div className="flex items-center justify-between text-amber-600 dark:text-amber-500">
                          <span className="text-[10px] font-black uppercase tracking-widest">{pendingMySign} Tugas Pending</span>
                          <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center animate-pulse">
                            <ChevronRight size={16} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-zinc-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-all">
                          <span className="text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">Lihat Detail</span>
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-8 border border-zinc-200 dark:border-white/5">
              <Users size={40} className="text-zinc-300" />
            </div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Mulai Kolaborasi Anda</h3>
            <p className="text-sm text-zinc-400 max-w-xs mb-10 font-medium leading-relaxed">
              Anda belum tergabung dalam grup manapun. Buat grup pertama atau minta admin untuk mengundang Anda.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest border-none cursor-pointer transition-all shadow-xl shadow-emerald-500/20"
            >
              Inisialisasi Grup Baru
            </button>
          </div>
        )}
      </div>

      <StatusModal
        {...statusModal}
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default GroupsPage;
