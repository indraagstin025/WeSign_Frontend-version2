import React from 'react';
import SignatureCanvas from './SignatureCanvas';
import MobileBottomSheet from './MobileBottomSheet';
import StatusModal from '../../../components/ui/StatusModal';

/**
 * @component SigningModals
 * @description Container for all interactive modals/sheets in the signing flow.
 * Keeps DocumentSigningPage clean and focuses on UI orchestration.
 */
const SigningModals = ({ 
  isCanvasOpen, 
  setIsCanvasOpen, 
  handleSaveCanvas,
  isSheetOpen,
  setIsSheetOpen,
  // Status modal
  statusModal,
  setStatusModal,
  // Saved assets props
  savedAssets = [],
  onDeleteAsset,
  onSelectAsset,
  // [Mobile picker] Element picker handlers untuk admin (Paraf/Stamp/Text/Date).
  //   Bila tidak diberikan, button tidak tampil di sheet (signer biasa).
  onOpenParaf,
  onOpenStamp,
  onOpenText,
  onOpenDate,
  // [Mobile picker] Tipe element yang sedang aktif saat ini —
  //   akan di-highlight di sheet element picker.
  activeElement = null,
  // Note: props lama (currentSignature, signatures, removeSignature,
  // handleFinalSign, isSubmitting, finalizeText, disableFinalize) sudah
  // tidak diteruskan ke MobileBottomSheet baru. Konten tersebut dipindah
  // ke ActiveSignatureMobileCard (preview + list) dan SigningMobileBar
  // (tombol finalisasi). Caller boleh tetap pass props lama untuk
  // back-compat — akan di-ignore via rest spread.
  ...legacyProps
}) => {
  void legacyProps; // silence unused — props lama disengaja diabaikan
  return (
    <>
      {/* 1. Signature Hand-Drawn Canvas */}
      <SignatureCanvas 
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSave={handleSaveCanvas}
        savedAssets={savedAssets}
        onDeleteAsset={onDeleteAsset}
        onSelectAsset={onSelectAsset}
      />

      {/* 2. Mobile Bottom Element Picker Sheet */}
      <MobileBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onOpenCanvas={() => setIsCanvasOpen(true)}
        onOpenParaf={onOpenParaf}
        onOpenStamp={onOpenStamp}
        onOpenText={onOpenText}
        onOpenDate={onOpenDate}
        activeElement={activeElement}
      />

      {/* 3. Global Feedback Status Modal */}
      <StatusModal 
        {...statusModal} 
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </>
  );
};

// Note: signatures, removeSignature, handleFinalSign, isSubmitting, finalizeText,
// disableFinalize tidak lagi digunakan oleh MobileBottomSheet baru. Konten
// preview signature aktif & list penempatan dipindah ke ActiveSignatureMobileCard,
// dan tombol finalisasi tetap di SigningMobileBar (action bar bawah).
// Props masih diterima oleh SigningModals untuk back-compat dengan caller
// lama via rest spread `...legacyProps` (lihat destructure di atas).

export default SigningModals;
