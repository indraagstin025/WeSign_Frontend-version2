import { useState, useCallback, useRef } from 'react';
import { useSignatureCanvas } from './useSignatureCanvas';

/**
 * FUNGSI HELPER: Memotong (crop) otomatis area transparan berlebih pada canvas.
 * Ini menjamin border merah akan menempel super ketat pada teks atau coretan.
 */
const trimCanvas = (canvas) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const l = pixels.data.length;
  let bound = { top: null, left: null, right: null, bottom: null };

  // Scan setiap pixel untuk mencari batas tinta (pixel yang tidak transparan)
  for (let i = 0; i < l; i += 4) {
    if (pixels.data[i + 3] !== 0) {
      const x = (i / 4) % canvas.width;
      const y = Math.floor((i / 4) / canvas.width);

      if (bound.top === null) bound.top = y;
      if (bound.left === null || x < bound.left) bound.left = x;
      if (bound.right === null || x > bound.right) bound.right = x;
      if (bound.bottom === null || y > bound.bottom) bound.bottom = y;
    }
  }

  // Jika kanvas kosong, kembalikan aslinya
  if (bound.top === null) return canvas;

  // Perbaikan Asimetris: 0px samping (Perfect Hug), 15px atas-bawah (Breathing Room)
  const paddingX = 0; 
  const paddingY = 15;
  
  const trimWidth = bound.right - bound.left + 1 + (paddingX * 2);
  const trimHeight = bound.bottom - bound.top + 1 + (paddingY * 2);

  const trimmedCanvas = document.createElement('canvas');
  trimmedCanvas.width = trimWidth;
  trimmedCanvas.height = trimHeight;
  const trimmedCtx = trimmedCanvas.getContext('2d');

  // Gambar ulang bagian yang ada tintanya saja ke kanvas baru
  trimmedCtx.drawImage(
    canvas,
    Math.max(0, bound.left - paddingX),
    Math.max(0, bound.top - paddingY),
    trimWidth,
    trimHeight,
    0, 0, trimWidth, trimHeight
  );

  return trimmedCanvas;
};


/**
 * @hook useSignatureModal
 * @description Manages state for the multi-tab signature modal.
 */
export const useSignatureModal = (isOpen, onSave, onClose) => {
  const [activeTab, setActiveTab] = useState('draw');
  const [fullName, setFullName] = useState('');
  const [initials, setInitials] = useState('');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState('font-dancing');
  const typeCanvasRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);

  const { state: canvasState, actions: canvasActions } = useSignatureCanvas(
    isOpen && activeTab === 'draw', 
    () => {}, 
    onClose
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran file maksimal 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => setUploadedImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalSave = useCallback(() => {
    let dataUrl = null;

    if (activeTab === 'draw') {
      if (canvasState.isEmpty) return;
      // Gunakan fitur Crop Otomatis untuk coretan tangan agar bounding box ketat!
      const finalCanvas = trimCanvas(canvasState.canvasRef.current);
      dataUrl = finalCanvas.toDataURL('image/png');
    } 
    else if (activeTab === 'type') {
      if (!typedName.trim()) return;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 2;
      
      let fontName = 'Dancing Script';
      if (selectedFont === 'font-caveat') fontName = 'Caveat';
      if (selectedFont === 'font-sacramento') fontName = 'Sacramento';
      if (selectedFont === 'font-inter') fontName = 'Inter';
      
      const fontSize = 80;
      
      // 1. Buat kanvas raksasa sementara agar huruf apa pun tidak ada yang terpotong
      const safeWidth = 1000 * dpr;
      const safeHeight = 400 * dpr;
      
      canvas.width = safeWidth;
      canvas.height = safeHeight;
      ctx.scale(dpr, dpr);
      
      // 2. Render teks tepat di tengah-tengah kanvas raksasa
      ctx.clearRect(0, 0, safeWidth, safeHeight);
      ctx.font = `${fontSize}px "${fontName}", cursive, sans-serif`;
      ctx.fillStyle = canvasState.color || '#334155';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(typedName, (safeWidth / dpr) / 2, (safeHeight / dpr) / 2);
      
      // 3. Gunakan fitur Crop Otomatis untuk memotong semua ruang kosong di kiri/kanan/atas/bawah
      const finalCanvas = trimCanvas(canvas);
      dataUrl = finalCanvas.toDataURL('image/png');
    } 
    else if (activeTab === 'upload') {
      if (!uploadedImage) return;
      dataUrl = uploadedImage;
    }

    if (dataUrl) {
      onSave(dataUrl);
      onClose();
      setTypedName('');
      setUploadedImage(null);
    }
  }, [activeTab, typedName, selectedFont, uploadedImage, canvasState, onSave, onClose]);

  const clear = () => {
    if (activeTab === 'draw') canvasActions.clear();
    else if (activeTab === 'type') setTypedName('');
    else if (activeTab === 'upload') setUploadedImage(null);
  };

  return {
    state: {
      activeTab,
      fullName,
      initials,
      typedName,
      selectedFont,
      uploadedImage,
      canvasState,
      isSaveDisabled: (
        (activeTab === 'draw' && canvasState.isEmpty) ||
        (activeTab === 'type' && !typedName.trim()) ||
        (activeTab === 'upload' && !uploadedImage)
      )
    },
    actions: {
      setActiveTab: handleTabChange,
      setFullName,
      setInitials,
      setTypedName,
      setSelectedFont,
      handleFileUpload,
      clear,
      save: handleFinalSave,
      canvasActions
    }
  };
};
