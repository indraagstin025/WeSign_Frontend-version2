import React, { useRef } from 'react';
import { PenTool, Edit3, Stamp as StampIcon, Type, Calendar } from 'lucide-react';
import { useMobileBottomSheet } from '../hooks/useMobileBottomSheet';

/**
 * @component MobileBottomSheet
 * @description Bottom sheet "Tambah Elemen" untuk mobile signing.
 *   Berisi 5 picker tools (Signature, Paraf, Stamp, Text, Date Field).
 *
 *   Layout sheet ini SEMI-TRANSPARENT dengan height moderate — tidak full
 *   take-over screen. Action bar (Tanda Tangan + Check) di-render terpisah
 *   di parent dan tetap visible di bawah sheet.
 *
 *   Catatan refactor: sebelumnya sheet ini berisi panel kontrol full
 *   (preview signature aktif + list penempatan + tombol finalize). Konten
 *   tersebut sudah dipindah ke `ActiveSignatureMobileCard` (di atas action
 *   bar) dan action bar SigningMobileBar. Sheet ini sekarang fokus ke
 *   element picker saja.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {() => void} props.onOpenCanvas - Open Signature canvas
 * @param {() => void} [props.onOpenParaf] - Open Paraf modal (admin only)
 * @param {() => void} [props.onOpenStamp] - Open Stamp modal (admin only)
 * @param {() => void} [props.onOpenText] - Open Text annotation modal (admin only)
 * @param {() => void} [props.onOpenDate] - Open Date field modal (admin only)
 * @param {string} [props.activeElement] - Tipe element aktif saat ini
 *   ('signature' | 'initial' | 'stamp' | 'text' | 'date'). Akan di-highlight
 *   di picker.
 */
const MobileBottomSheet = ({
  isOpen,
  onClose,
  onOpenCanvas,
  onOpenParaf,
  onOpenStamp,
  onOpenText,
  onOpenDate,
  activeElement = null,
}) => {
  const sheetRef = useRef(null);
  const { state, actions } = useMobileBottomSheet(isOpen, onClose);

  if (!isOpen) return null;

  // Element list — Signature selalu tersedia, Paraf/Stamp/Text/Date hanya
  // bila handler diberikan (admin only).
  const elements = [
    {
      key: 'signature',
      label: 'Signature',
      icon: PenTool,
      onClick: () => {
        onOpenCanvas?.();
        onClose();
      },
      enabled: true,
    },
    {
      key: 'initial',
      label: 'Paraf',
      icon: Edit3,
      onClick: () => {
        onOpenParaf?.();
        onClose();
      },
      enabled: !!onOpenParaf,
    },
    {
      key: 'stamp',
      label: 'Stamp',
      icon: StampIcon,
      onClick: () => {
        onOpenStamp?.();
        onClose();
      },
      enabled: !!onOpenStamp,
    },
    {
      key: 'text',
      label: 'Text',
      icon: Type,
      onClick: () => {
        onOpenText?.();
        onClose();
      },
      enabled: !!onOpenText,
    },
    {
      key: 'date',
      label: 'Date Field',
      icon: Calendar,
      onClick: () => {
        onOpenDate?.();
        onClose();
      },
      enabled: !!onOpenDate,
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="sm:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="sm:hidden fixed left-0 right-0 z-[101] flex flex-col"
        style={{
          // [Mockup fix] Posisi di atas ActiveSignatureMobileCard.
          //   Stack: ActionBar (12 + 60) + gap 12 + ActiveCard (~94) + gap 12 = ~190px.
          //   Plus safe-area iOS.
          bottom: 'calc(200px + env(safe-area-inset-bottom, 0px))',
          maxHeight: 'min(40vh, 40dvh)',
          ...state.sheetStyle,
        }}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden border-t border-x border-zinc-200 dark:border-white/10 mx-3">

          {/* Drag Handle */}
          <div
            className="py-3 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
            {...actions.gestureHandlers}
          >
            <div className="w-10 h-1.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 pb-3">
            <h3 className="text-[14px] font-bold text-zinc-900 dark:text-white text-left">
              Tambah Elemen
            </h3>
          </div>

          {/* Element picker grid — 5 buttons horizontal scrollable */}
          <div className="px-3 pb-4 flex items-stretch gap-2 overflow-x-auto no-scrollbar">
            {elements.map((el) => {
              if (!el.enabled) return null;
              const IconComp = el.icon;
              const isActive = activeElement === el.key;
              return (
                <button
                  key={el.key}
                  type="button"
                  onClick={el.onClick}
                  className={`shrink-0 w-20 flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border cursor-pointer transition-all
                    ${isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-100 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  aria-label={`Tambah elemen ${el.label}`}
                >
                  <IconComp size={20} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                  <span className="text-[11px] font-semibold">{el.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileBottomSheet;
