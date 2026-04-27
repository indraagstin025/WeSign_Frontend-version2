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
    <div className="flex-1 overflow-y-auto bg-zinc-50/50 dark:bg-transparent no-scrollbar">
      <div className="max-w-7xl mx-auto p-6 sm:p-10 space-y-12">
        
        {/* HEADER - DISCORD STYLE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em]">
              <Layers size={14} />
              Community Hub
            </div>
            <h1 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">
              Explore Your Groups
            </h1>
            <p className="text-zinc-500 dark:text-zinc-100 text-sm font-bold opacity-80">
              Collaborate, sign, and manage documents with your specialized teams.
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => fetchGroups()}
              className="p-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-emerald-500 transition-all cursor-pointer shadow-xl"
            >
              <RefreshCw size={20} />
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest border-none cursor-pointer shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Plus size={18} /> Create Community
            </button>
          </div>
        </div>

        {/* CREATE FORM (COMMUNITY STYLE) */}
        {showCreateForm && (
          <div className="bg-white dark:bg-zinc-900 border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-top-4">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <Users size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Setup New Workspace</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-100 font-bold opacity-70">Create a space for your team to share and sign documents.</p>
              </div>
            </div>
            <form onSubmit={handleCreateGroup} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Enter community name..."
                className="flex-1 px-6 py-4 rounded-full border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isCreating || !newGroupName.trim()}
                  className="flex-1 sm:flex-none px-10 py-4 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-widest border-none cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Create Space'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewGroupName(''); }}
                  className="px-8 py-4 rounded-full text-xs font-black uppercase text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all bg-transparent border-none cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* COMMUNITIES GRID (DISCORD CARDS) */}
        {!loading && groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {groups.map((group, idx) => {
              const isAdmin = String(group.adminId) === String(currentUser?.id);
              const memberCount = group.members?.length || 0;
              const docCount = group.documents?.length || 0;
              
              // Thick, intense themes for both Light and Dark mode
              const themes = [
                { banner: 'from-indigo-600 via-indigo-500 to-blue-600', tint: 'from-indigo-100 dark:from-indigo-600/40' },
                { banner: 'from-emerald-600 via-emerald-500 to-teal-600', tint: 'from-emerald-100 dark:from-emerald-600/40' },
                { banner: 'from-fuchsia-600 via-fuchsia-500 to-purple-600', tint: 'from-fuchsia-100 dark:from-fuchsia-600/40' },
                { banner: 'from-amber-600 via-amber-500 to-orange-600', tint: 'from-amber-100 dark:from-amber-600/40' },
                { banner: 'from-rose-600 via-rose-500 to-pink-600', tint: 'from-rose-100 dark:from-rose-600/40' }
              ];
              const theme = themes[idx % themes.length];

              return (
                <div
                  key={group.id}
                  onClick={() => navigate(`/dashboard/groups/${group.id}`)}
                  className={`group bg-gradient-to-br ${theme.tint} to-white dark:via-zinc-900/95 dark:to-zinc-950 rounded-[2.5rem] border border-zinc-100 dark:border-white/10 overflow-hidden shadow-2xl transition-all duration-500 cursor-pointer flex flex-col relative`}
                >
                  {/* Banner - More Compact */}
                  <div className={`h-28 bg-gradient-to-r ${theme.banner} relative`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                    {isAdmin && (
                      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center gap-1.5 text-white">
                        <Crown size={12} className="text-amber-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Founder</span>
                      </div>
                    )}
                  </div>

                  {/* Community Icon - Perfectly Circular & Non-stretching */}
                  <div className="px-6 -mt-9 relative z-10 flex items-end justify-between">
                    <div className="w-18 h-18 shrink-0 aspect-square rounded-full bg-white dark:bg-zinc-900 p-1.5 shadow-2xl transition-all group-hover:scale-110 duration-500">
                      <div className={`w-full h-full rounded-full bg-gradient-to-br ${theme.banner} flex items-center justify-center text-white text-2xl font-black shadow-inner`}>
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="pb-1">
                      <div className="flex -space-x-2">
                        {[...Array(Math.min(3, memberCount))].map((_, i) => (
                          <div key={i} className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-[8px] font-black text-zinc-500 dark:text-white uppercase shadow-lg">
                            {String.fromCharCode(65 + i)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Content - More Compact */}
                  <div className="p-8 pt-4 flex-1 flex flex-col">
                    <div className="mb-4">
                      <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight mb-1 group-hover:text-emerald-500 transition-all duration-300">
                        {group.name}
                      </h3>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-100 font-bold line-clamp-1 opacity-70">
                        Workspace kolaborasi tim {group.name}.
                      </p>
                    </div>

                    <div className="flex items-center gap-6 mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-100 uppercase tracking-widest opacity-60">Members</span>
                        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tighter">{memberCount}</span>
                      </div>
                      <div className="w-px h-6 bg-zinc-100 dark:bg-white/20" />
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-100 uppercase tracking-widest opacity-60">Documents</span>
                        <span className="text-base font-black text-zinc-900 dark:text-white tracking-tighter">{docCount}</span>
                      </div>
                    </div>

                    <button className="w-full mt-6 py-3.5 rounded-full bg-zinc-900 dark:bg-white/5 text-white dark:text-white text-[10px] font-black uppercase tracking-[0.2em] group-hover:bg-emerald-600 transition-all duration-500 shadow-xl border-none cursor-pointer flex items-center justify-center gap-2">
                      Launch Workspace <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>


        ) : !loading && (
          <div className="py-24 text-center">
             <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex items-center justify-center mx-auto mb-8 text-zinc-300">
                <Users size={40} />
             </div>
             <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight mb-3">No Communities Found</h3>
             <p className="text-sm text-zinc-500 dark:text-zinc-100 max-w-sm mx-auto font-bold opacity-70 leading-relaxed mb-10">
               You haven't joined any workspace yet. Create your first community or ask for an invitation.
             </p>
             <button
               onClick={() => setShowCreateForm(true)}
               className="px-10 py-4 rounded-full bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 border-none cursor-pointer"
             >
               Start Your First Community
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
