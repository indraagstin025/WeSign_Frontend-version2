import React from 'react';
import UploadDocModal from './UploadDocModal';
import DocumentInfoModal from './DocumentInfoModal';
import EditDocModal from './EditDocModal';
import VersionHistoryModal from './VersionHistoryModal';
import ConfirmModal from '../../../components/UI/ConfirmModal';

/**
 * @component DocumentModals
 * @description Container for all modals related to document management.
 * Cleanly separates modal boilerplate from the main page layout.
 */
const DocumentModals = ({ modals, actions }) => {
  return (
    <>
      <UploadDocModal 
        isOpen={modals.upload.isOpen} 
        onClose={() => modals.upload.setOpen(false)}
        onSuccess={modals.upload.onSuccess}
      />

      <DocumentInfoModal 
        isOpen={!!modals.info.data} 
        onClose={() => modals.info.setOpen(null)}
        document={modals.info.data}
        onViewFile={(doc) => actions.handleAction('view', doc)}
        onDownload={(docId) => actions.handleAction('download', { id: docId })}
      />

      <EditDocModal 
        isOpen={!!modals.edit.data}
        onClose={() => modals.edit.setOpen(null)}
        document={modals.edit.data}
        onUpdate={modals.edit.onUpdate}
        loading={modals.edit.loading}
      />

      <ConfirmModal 
        isOpen={!!modals.delete.data}
        onClose={() => modals.delete.setOpen(null)}
        onConfirm={actions.handleConfirmDelete}
        loading={modals.delete.loading}
        title="Hapus Dokumen"
        message={`Apakah Anda yakin ingin menghapus "${modals.delete.data?.title}"? Dokumen ini akan dihapus secara permanen dari brankas Anda.`}
        confirmText="Ya, Hapus"
        variant="danger"
      />

      <VersionHistoryModal 
        isOpen={!!modals.version?.data}
        onClose={() => modals.version?.setOpen(null)}
        document={modals.version?.data}
        onRollbackSuccess={actions.refresh}
      />

      {/* Global Loading Overlay for Detail Fetching */}
      {modals.info.isLoading && (
        <div className="fixed inset-0 z-[110] bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl flex items-center gap-4 animate-in zoom-in-95 duration-200">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Menyiapkan Detail...</span>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentModals;
