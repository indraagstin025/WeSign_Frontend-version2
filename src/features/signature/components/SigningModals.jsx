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
  setStatusModal
}) => {
  return (
    <>
      {/* 1. Signature Hand-Drawn Canvas */}
      <SignatureCanvas 
        isOpen={isCanvasOpen}
        onClose={() => setIsCanvasOpen(false)}
        onSave={handleSaveCanvas}
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
