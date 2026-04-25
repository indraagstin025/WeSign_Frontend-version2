import { useState, useEffect, useCallback } from 'react';
import { getGroupDetail } from '../api/groupService';
import { getDocumentFile } from '../../documents/api/docService';

/**
 * @hook useGroupData
 * @description Fetch dan parse data grup + dokumen yang sedang ditandatangani.
 * Mengembalikan data mentah: groupData, signatures, signerRequests, pdfUrl, dll.
 */
export const useGroupData = ({ groupId, documentId, currentUserId }) => {
  const [groupData, setGroupData] = useState(null);
  const [signatures, setSignatures] = useState([]);
  const [pendingSigners, setPendingSigners] = useState([]);
  const [totalSigners, setTotalSigners] = useState(0);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [documentTitle, setDocumentTitle] = useState('');
  const [documentVersionId, setDocumentVersionId] = useState(null);
  const [documentStatus, setDocumentStatus] = useState(null);
  const [hasMyFinalSig, setHasMyFinalSig] = useState(false);
  const [readyToFinalize, setReadyToFinalize] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchGroupData = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await getGroupDetail(groupId);
      if (res.status !== 'success') throw new Error(res.message);

      const group = res.data;
      setGroupData(group);

      const doc = group.documents?.find((d) => String(d.id) === String(documentId));
      if (!doc) {
        console.error('[useGroupData] Dokumen tidak ditemukan. documentId:', documentId,
          'Available IDs:', group.documents?.map(d => d.id));
        throw new Error('Dokumen tidak ditemukan di grup ini.');
      }

      setDocumentTitle(doc.title);
      setDocumentStatus(doc.status);
      setDocumentVersionId(doc.currentVersionId);

      // Ambil signed URL dari backend (bukan langsung currentVersion.url)
      try {
        const fileRes = await getDocumentFile(doc.id, 'view');
        if (fileRes.status === 'success' && fileRes.data?.url) {
          setPdfUrl(fileRes.data.url);
        } else {
          // Fallback ke URL langsung jika endpoint tidak tersedia
          setPdfUrl(doc.currentVersion?.url || null);
        }
      } catch {
        setPdfUrl(doc.currentVersion?.url || null);
      }

      const signerRequests = doc.signerRequests || [];
      const pendingList = signerRequests.filter((sr) => sr.status?.toUpperCase() === 'PENDING');
      setPendingSigners(pendingList);
      setTotalSigners(signerRequests.length);

      const allSigs = signerRequests
        .filter((sr) => sr.signatureGroup)
        .map((sr) => ({
          ...sr.signatureGroup,
          userId: sr.userId,
          signerName: sr.user?.name || 'User',
          signerStatus: sr.status,
        }));
      setSignatures(allSigs);

      const mySig = allSigs.find((s) => String(s.userId) === String(currentUserId));
      if (mySig?.status === 'final') setHasMyFinalSig(true);

      setReadyToFinalize(pendingList.length === 0 && signerRequests.length > 0);
    } catch (err) {
      setError(err.message || 'Gagal memuat data grup.');
    } finally {
      setLoading(false);
    }
  }, [groupId, documentId, currentUserId]);

  useEffect(() => { fetchGroupData(); }, [fetchGroupData]);

  return {
    groupData,
    signatures,
    setSignatures,
    pendingSigners,
    setPendingSigners,
    totalSigners,
    pdfUrl,
    documentTitle,
    documentVersionId,
    documentStatus,
    setDocumentStatus,
    hasMyFinalSig,
    setHasMyFinalSig,
    readyToFinalize,
    setReadyToFinalize,
    loading,
    error,
    fetchGroupData,
  };
};
