import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Lock } from 'lucide-react';
import { useUser } from '../../../context/UserContext';
import { getGroupDetail } from '../api/groupService';
import { getDocumentFile } from '../../documents/api/docService';
import { useGroupSocket } from './useGroupSocket';

const STATUS_CONFIG = {
  PENDING:   { label: 'Menunggu',       color: 'text-amber-600',   bg: 'bg-amber-500/10',   icon: Clock },
  SIGNED:    { label: 'Ditandatangani', color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  COMPLETED: { label: 'Finalized',      color: 'text-blue-600',    bg: 'bg-blue-500/10',    icon: Lock },
};

const FINAL_STATUSES = new Set(['COMPLETED', 'completed', 'final', 'FINAL']);

/**
 * @hook useGroupDocumentPreviewPage
 * @description Orchestrator state untuk halaman preview dokumen grup.
 * Mengelola: fetching dokumen + group, realtime socket, download, dan derivasi
 * (progress, status, signers, role-based visibility).
 */
export function useGroupDocumentPreviewPage() {
  const { groupId, documentId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useUser();

  const [groupData, setGroupData] = useState(null);
  const [doc, setDoc] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: '',
  });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const loadData = useCallback(
    async (silent = false) => {
      if (!groupId || !documentId) return;
      if (!silent) setLoading(true);
      setError(null);
      try {
        const groupRes = await getGroupDetail(groupId);
        if (groupRes.status !== 'success') throw new Error(groupRes.message);
        const gData = groupRes.data;
        setGroupData(gData);

        const foundDoc = gData.documents?.find((d) => String(d.id) === String(documentId));
        if (!foundDoc) throw new Error('Dokumen tidak ditemukan di grup ini.');
        setDoc(foundDoc);

        const urlRes = await getDocumentFile(documentId, 'view');
        if (urlRes.status === 'success' && urlRes.data?.url) {
          setPdfUrl(urlRes.data.url);
        } else {
          throw new Error('Gagal mendapatkan akses ke file dokumen.');
        }
      } catch (err) {
        setError(err.message || 'Gagal memuat dokumen.');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [groupId, documentId]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Realtime Socket ───────────────────────────────────────────────────────
  useGroupSocket({
    groupId,
    documentId,
    currentUserId: currentUser?.id,
    ready: !!groupData,
    onRefresh: () => loadData(true),
    setStatusModal,
  });

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    try {
      const res = await getDocumentFile(documentId, 'download');
      if (res.status === 'success' && res.data?.url) {
        window.location.assign(res.data.url);
      }
    } catch {
      setStatusModal({
        isOpen: true,
        type: 'error',
        title: 'Gagal',
        message: 'Gagal mengunduh dokumen.',
      });
    }
  };

  const handleRefresh = () => loadData(true);
  const handleRetry = () => loadData();
  const goBackToGroup = () => navigate(`/dashboard/groups/${groupId}`);
  const openInNewTab = () => {
    if (pdfUrl) window.open(pdfUrl, '_blank');
  };
  const closeStatusModal = () =>
    setStatusModal((prev) => ({ ...prev, isOpen: false }));

  // ── Derivasi ──────────────────────────────────────────────────────────────
  const derived = useMemo(() => {
    const signerRequests = doc?.signerRequests || [];
    const signedCount = signerRequests.filter(
      (sr) => sr.status?.toUpperCase() === 'SIGNED'
    ).length;
    const totalSigners = signerRequests.length;
    const progress = totalSigners > 0 ? Math.round((signedCount / totalSigners) * 100) : 0;

    const isFinal = !!doc && FINAL_STATUSES.has(doc.status);

    const mySignerRecord = signerRequests.find(
      (sr) => String(sr.userId) === String(currentUser?.id)
    );
    const myStatus = mySignerRecord?.status?.toUpperCase() || null;
    const canSign = myStatus === 'PENDING' && !isFinal;

    const isAdmin =
      groupData?.adminId != null &&
      currentUser?.id != null &&
      String(groupData.adminId) === String(currentUser.id);

    const docStatusKey = isFinal ? 'COMPLETED' : (doc?.status?.toUpperCase() || 'PENDING');
    const docStatusCfg = STATUS_CONFIG[docStatusKey] || STATUS_CONFIG.PENDING;

    const signUrl = `/dashboard/groups/${groupId}/documents/${documentId}/sign`;

    return {
      signerRequests,
      signedCount,
      totalSigners,
      progress,
      isFinal,
      myStatus,
      canSign,
      isAdmin,
      docStatusCfg,
      signUrl,
    };
  }, [doc, currentUser?.id, groupData?.adminId, groupId, documentId]);

  return {
    state: {
      groupId,
      documentId,
      currentUser,
      groupData,
      doc,
      pdfUrl,
      loading,
      error,
      statusModal,
      ...derived,
    },
    actions: {
      handleDownload,
      handleRefresh,
      handleRetry,
      goBackToGroup,
      openInNewTab,
      closeStatusModal,
    },
  };
}
