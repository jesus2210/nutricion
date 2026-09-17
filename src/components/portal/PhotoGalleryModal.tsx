// LAYER: Interface
// Visor de Galería Fotográfica estilo móvil con soporte Touch/Swipe, Teclado y Miniaturas
'use client';

import { useState, useEffect, useRef, TouchEvent } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Scale, Maximize2 } from 'lucide-react';

export interface GalleryPhoto {
  id: string;
  url: string;
  photoType: 'front' | 'side' | 'back' | string;
  checkinDate?: string;
  weightKg?: number;
}

interface PhotoGalleryModalProps {
  photos: GalleryPhoto[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotoGalleryModal({
  photos,
  initialIndex = 0,
  isOpen,
  onClose,
}: PhotoGalleryModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialIndex]);

  // Manejo de teclas (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, photos.length]);

  if (!isOpen || !photos || photos.length === 0) return null;

  const currentPhoto = photos[currentIndex] || photos[0];

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Manejo de touch swipe (deslizamiento en móvil)
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 40; // distancia mínima en px para considerar swipe

    if (diff > threshold) {
      goToNext();
    } else if (diff < -threshold) {
      goToPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const typeLabel: Record<string, string> = {
    front: 'Frente',
    side: 'Perfil',
    back: 'Espalda',
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-md transition-opacity duration-200">
      {/* Barra superior de control */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-3 text-white">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/10">
            {currentIndex + 1} / {photos.length}
          </span>
          <div className="text-xs">
            <span className="font-bold text-[#34d399] uppercase tracking-wider mr-2">
              {typeLabel[currentPhoto.photoType] || currentPhoto.photoType}
            </span>
            {currentPhoto.checkinDate && (
              <span className="text-[#94a3b8] inline-flex items-center gap-1">
                <Calendar className="h-3 w-3 inline" />
                {currentPhoto.checkinDate}
              </span>
            )}
            {currentPhoto.weightKg && (
              <span className="text-[#94a3b8] ml-2 inline-flex items-center gap-1">
                <Scale className="h-3 w-3 inline" />
                {currentPhoto.weightKg} kg
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentPhoto.url && (
            <a
              href={currentPhoto.url}
              target="_blank"
              rel="noreferrer"
              title="Abrir en pestaña nueva"
              className="p-2 text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/10 transition"
            >
              <Maximize2 className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-2 text-[#94a3b8] hover:text-white rounded-lg hover:bg-white/10 transition cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Área Principal de la Imagen (con soporte Touch Swipe) */}
      <div
        className="relative flex-1 flex items-center justify-center p-2 sm:p-6 select-none overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Botón Flecha Izquierda */}
        {photos.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            className="absolute left-2 sm:left-6 z-10 p-2.5 sm:p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-[#14352b] hover:border-[#34d399]/40 transition shadow-xl"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        {/* Imagen actual */}
        <div className="max-w-full max-h-[72vh] flex items-center justify-center">
          {currentPhoto.url ? (
            <img
              key={currentPhoto.id + currentIndex}
              src={currentPhoto.url}
              alt={currentPhoto.photoType}
              className="max-h-[72vh] max-w-full object-contain rounded-xl shadow-2xl transition-all duration-200"
            />
          ) : (
            <div className="text-[#64748b] text-sm">No se pudo cargar la imagen</div>
          )}
        </div>

        {/* Botón Flecha Derecha */}
        {photos.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 sm:right-6 z-10 p-2.5 sm:p-3 rounded-full bg-black/60 border border-white/10 text-white hover:bg-[#14352b] hover:border-[#34d399]/40 transition shadow-xl"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Tira inferior de miniaturas (thumbnails) */}
      {photos.length > 1 && (
        <div className="h-20 border-t border-white/10 bg-black/50 px-4 flex items-center gap-2 overflow-x-auto justify-center">
          {photos.map((photo, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={photo.id || idx}
                onClick={() => setCurrentIndex(idx)}
                className={`relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#34d399] scale-105 shadow-md shadow-[#34d399]/20 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                {photo.url ? (
                  <img
                    src={photo.url}
                    alt={photo.photoType}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-800" />
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-center font-bold text-white uppercase py-0.5">
                  {typeLabel[photo.photoType]?.slice(0, 3) || photo.photoType?.slice(0, 3)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
