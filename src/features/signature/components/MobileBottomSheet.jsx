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
  // `shortLabel` dipakai di mobile picker grid yang sempit supaya tidak
  // ke-truncate (mis. "Date Field" → "Date").
  const elements = [
    {
      key: 'signature',
      label: 'Signature',
      shortLabel: 'Signature',
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
      shortLabel: 'Paraf',
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
      shortLabel: 'Stamp',
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
      shortLabel: 'Text',
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
      shortLabel: 'Date',
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

      {/* Sheet — floating card di atas ActiveSignatureMobileCard.
          Sesuai mockup user, sheet bukan true bottom sheet (tidak menempel
          ke bawah layar) tapi card floating dengan rounded all corners.
          Posisi: tepat di atas ActiveCard dengan gap kecil. */}
      <div
        ref={sheetRef}
        className="sm:hidden fixed left-0 right-0 z-[101] flex flex-col px-3"
        style={{
          // Stack from bottom: ActionBar (12 + ~58) + gap 12 + ActiveCard
          // (~76) + gap 8 = ~166px. Plus safe-area iOS.
          bottom: 'calc(180px + env(safe-area-inset-bottom, 0px))',
          maxHeight: 'min(40vh, 40dvh)',
          ...state.sheetStyle,
        }}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col overflow-hidden border border-zinc-100 dark:border-white/10">

          {/* Drag Handle */}
          <div
            className="py-2.5 flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
            {...actions.gestureHandlers}
          >
            <div className="w-10 h-1 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-4 pb-2">
            <h3 className="text-[13px] font-bold text-zinc-900 dark:text-white text-left">
              Tambah Elemen
            </h3>
          </div>

          {/* Element picker — equal-width grid sesuai mockup.
              Sebelumnya horizontal scroll dengan w-20, sekarang grid 5 kolom
              yang fit ke layar tanpa scroll (semua button kelihatan rata). */}
          <div
            className="px-2 pb-4 grid gap-1.5"
            style={{
              gridTemplateColumns: `repeat(${elements.filter((e) => e.enabled).length}, minmax(0, 1fr))`,
            }}
          >
            {elements.map((el) => {
              if (!el.enabled) return null;
              const IconComp = el.icon;
              const isActive = activeElement === el.key;
              return (
                <button
                  key={el.key}
                  type="button"
                  onClick={el.onClick}
                  className={`flex flex-col items-center justify-center gap-1.5 py-3 px-0.5 rounded-xl border cursor-pointer transition-all min-w-0 overflow-hidden
                    ${isActive
                      ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500/40 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/60 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                    }`}
                  aria-label={`Tambah elemen ${el.label}`}
                >
                  <IconComp size={22} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                  {/* Label — pakai shortLabel kalau ada (untuk fit di grid sempit),
                      else fallback ke label panjang. Font 10px + nowrap supaya
                      single line tanpa truncate. */}
                  <span className="text-[10px] font-semibold leading-tight text-center whitespace-nowrap">
                    {el.shortLabel || el.label}
                  </span>
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
