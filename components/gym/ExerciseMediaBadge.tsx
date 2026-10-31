'use client';

import React, { useState, useEffect } from 'react';
import { Camera, X, Info, Dumbbell, Sparkles, ExternalLink } from 'lucide-react';

interface ExerciseMediaData {
  name: string;
  equipment: string;
  muscleGroup: string;
  imageUrl: string;
  thumbnailUrl: string;
  apparatusName: string;
  setupInstructions: string;
}

// Cache em memória para acesso síncrono ultra-rápido (0ms)
const MEMORY_MEDIA_CACHE: Record<string, ExerciseMediaData> = {};

interface ExerciseMediaBadgeProps {
  exerciseName: string;
  equipment?: string;
  muscleGroup?: string;
  instructions?: string;
  variant?: 'compact' | 'pill' | 'thumbnail' | 'icon-only';
  className?: string;
}

export function ExerciseMediaBadge({
  exerciseName,
  equipment = '',
  muscleGroup = '',
  instructions = '',
  variant = 'compact',
  className = '',
}: ExerciseMediaBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [media, setMedia] = useState<ExerciseMediaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const cacheKey = `fincontrol_media_${exerciseName.trim().toLowerCase()}`;

  useEffect(() => {
    // 1. Tentar ler do cache em memória
    if (MEMORY_MEDIA_CACHE[cacheKey]) {
      setMedia(MEMORY_MEDIA_CACHE[cacheKey]);
      return;
    }

    // 2. Tentar ler do localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(cacheKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          MEMORY_MEDIA_CACHE[cacheKey] = parsed;
          setMedia(parsed);
          return;
        }
      } catch (err) {
        // silencioso
      }
    }

    // 3. Buscar na API em background
    let isMounted = true;
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          name: exerciseName,
          equipment: equipment || '',
          muscleGroup: muscleGroup || '',
        });
        const res = await fetch(`/api/gym/exercise-media?${params.toString()}`);
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setMedia(json.data);
          MEMORY_MEDIA_CACHE[cacheKey] = json.data;
          try {
            localStorage.setItem(cacheKey, JSON.stringify(json.data));
          } catch (e) {
            // quota excedida ou similar
          }
        }
      } catch (e) {
        console.warn('Erro ao carregar mídia do exercício:', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedia();

    return () => {
      isMounted = false;
    };
  }, [exerciseName, equipment, muscleGroup, cacheKey]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Gatilho Visual Conforme a Variante */}
      {variant === 'thumbnail' && (
        <button
          type="button"
          onClick={handleOpen}
          title={`Ver foto e execução de: ${exerciseName}`}
          className={`relative group h-9 w-9 rounded-xl overflow-hidden border border-border/70 hover:border-cyan-500/80 transition-all shadow-xs cursor-pointer bg-muted/60 shrink-0 ${className}`}
        >
          {media?.thumbnailUrl && !imageError ? (
            <img
              src={media.thumbnailUrl}
              alt={media.apparatusName || exerciseName}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground group-hover:text-cyan-400">
              <Camera className="h-4 w-4" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-3.5 w-3.5 text-white drop-shadow" />
          </div>
        </button>
      )}

      {variant === 'pill' && (
        <button
          type="button"
          onClick={handleOpen}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/25 transition-all shadow-xs cursor-pointer ${className}`}
        >
          <Camera className="h-3 w-3" />
          <span>Ver Aparelho</span>
        </button>
      )}

      {variant === 'icon-only' && (
        <button
          type="button"
          onClick={handleOpen}
          title="Ver foto do aparelho"
          className={`p-1.5 rounded-lg text-muted-foreground hover:text-cyan-400 hover:bg-cyan-500/10 transition-all cursor-pointer ${className}`}
        >
          <Camera className="h-4 w-4" />
        </button>
      )}

      {variant === 'compact' && (
        <button
          type="button"
          onClick={handleOpen}
          className={`inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer ${className}`}
        >
          <Camera className="h-3 w-3" />
          <span className="underline decoration-cyan-400/40 underline-offset-2">Foto / Aparelho</span>
        </button>
      )}

      {/* MODAL / SHEET ESTILO APPLE MACOS SONOMA + IOS 18 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg bg-card/95 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-500/25">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground leading-tight">
                    {exerciseName}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {media?.apparatusName || equipment || 'Equipamento de Musculação'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Corpo / Conteúdo com Scroll Suave */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4">
              {/* Imagem do Aparelho / Exercício */}
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-muted/40 border border-border/80 shadow-inner flex items-center justify-center">
                {media?.imageUrl && !imageError ? (
                  <img
                    src={media.imageUrl}
                    alt={media.apparatusName || exerciseName}
                    onError={() => setImageError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <Dumbbell className="h-10 w-10 text-cyan-400/50 mb-2" />
                    <p className="text-xs">Foto do aparelho ilustrativa</p>
                  </div>
                )}
                {/* Badge sobreposta */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-black/75 backdrop-blur text-white border border-white/10 shadow">
                    {media?.apparatusName || equipment || 'Aparelho Oficial'}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/80 backdrop-blur text-white shadow">
                    {media?.muscleGroup || muscleGroup || 'Hipertrofia'}
                  </span>
                </div>
              </div>

              {/* Badges de Grupos e Equipamentos */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {media?.muscleGroup || muscleGroup || 'Geral'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border">
                  Equipamento: {media?.equipment || equipment || 'Padrão'}
                </span>
              </div>

              {/* Instruções de Ajuste do Aparelho & Execução */}
              <div className="space-y-2 rounded-2xl bg-muted/30 p-3.5 border border-border/60">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Ajuste & Biomecânica Recomendada</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {instructions ||
                    media?.setupInstructions ||
                    'Posicione-se confortavelmente, mantenha a coluna alinhada e controle a respiração.'}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 bg-muted/20 border-t border-border/60 flex items-center justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
