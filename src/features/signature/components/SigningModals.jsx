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
  currentSignature,
  signatures,
  removeSignature,
  handleFinalSign,
  isSubmitting,
  statusModal,
  setStatusModal,
  finalizeText,
  disableFinalize = null,
  // Saved assets props
  savedAssets = [],
  onDeleteAsset,
  onSelectAsset,
}) => {
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

      {/* 2. Mobile Bottom Control Sheet */}
      <MobileBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onOpenCanvas={() => setIsCanvasOpen(true)}
        currentSignature={currentSignature}
        signatures={signatures}
        onRemoveSignature={removeSignature}
        onFinalize={handleFinalSign}
        isSubmitting={isSubmitting}
        finalizeText={finalizeText}
        disabled={disableFinalize}
      />

      {/* 3. Global Feedback Status Modal */}
      <StatusModal 
        {...statusModal} 
        onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} 
      />
    </>
  );
};

export default SigningModals;
