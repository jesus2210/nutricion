// LAYER: Interface
// Componente cliente para visualización de fotos con zoom, swipe móvil y lightbox interactivo
'use client';

import { useState } from 'react';
import { Image as ImageIcon, ZoomIn } from 'lucide-react';
import PhotoGalleryModal, { GalleryPhoto } from '@/components/portal/PhotoGalleryModal';

interface PatientPhotoGalleryClientProps {
  checkinsWithUrls: any[];
}

export default function PatientPhotoGalleryClient({
  checkinsWithUrls,
}: PatientPhotoGalleryClientProps) {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Aplanar todas las fotos con sus metadatos
  const allPhotos: GalleryPhoto[] = checkinsWithUrls
    .flatMap((c) =>
      (c.checkin_photos || []).map((p: any) => ({
        id: p.id,
        url: p.url || '',
        photoType: p.photo_type || 'front',
        checkinDate: c.checkin_date,
        weightKg: c.weight_kg,
      }))
    )
    .filter((p) => Boolean(p.url));

  const openAtPhoto = (photoId: string) => {
    const idx = allPhotos.findIndex((p) => p.id === photoId);
    setCurrentIndex(idx >= 0 ? idx : 0);
    setGalleryOpen(true);
  };

  const typeLabels: Record<string, string> = {
    front: 'Frente',
    side: 'Perfil',
    back: 'Espalda',
  };

  if (allPhotos.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-[#64748b]">
        No hay fotos cargadas todavía. Adjunta fotos de frente, perfil y espalda en tu próximo check-in semanal.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {checkinsWithUrls.map((c: any) => {
        if (!c.checkin_photos || c.checkin_photos.length === 0) return null;

        return (
          <div key={c.id} className="rounded-2xl border border-white/5 bg-[#162229] p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between text-xs font-bold text-[#a7f3d0]">
              <span>Reporte del {c.checkin_date} ({c.weight_kg} kg)</span>
              <span className="text-[#94a3b8]">{c.checkin_photos.length} fotos</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {c.checkin_photos.map((photo: any) => (
                <div key={photo.id} className="space-y-2 text-center">
                  <div className="text-xs font-bold capitalize text-[#94a3b8]">
                    {typeLabels[photo.photo_type] || photo.photo_type}
                  </div>
                  {photo.url ? (
                    <button
                      type="button"
                      onClick={() => openAtPhoto(photo.id)}
                      className="group relative block h-64 sm:h-72 w-full overflow-hidden rounded-xl bg-black/40 border border-white/5 text-left transition hover:border-[#34d399]/50 cursor-pointer"
                    >
                      <img
                        src={photo.url}
                        alt={photo.photo_type}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-[2px]">
                        <ZoomIn className="h-5 w-5 text-[#34d399]" />
                        <span>Ver en Pantalla Completa</span>
                      </div>
                      <div className="absolute bottom-2 right-2 rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Deslizar ↔
                      </div>
                    </button>
                  ) : (
                    <div className="flex h-64 sm:h-72 items-center justify-center rounded-xl bg-black/20 text-xs text-[#64748b]">
                      Foto no disponible
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Visor Modal de Fotos Deslizable */}
      <PhotoGalleryModal
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        photos={allPhotos}
        initialIndex={currentIndex}
      />
    </div>
  );
}
