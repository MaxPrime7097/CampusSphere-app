import React, { useState } from 'react';
import { MagnifyingGlassPlus as ZoomIn, MagnifyingGlassMinus as ZoomOut, ArrowCounterClockwise as RotateCcw, ArrowClockwise as RotateCw, ArrowSquareOut as ExternalLink, ImageIcon } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next';

interface DocumentImageViewerProps {
  src: string;
  alt?: string;
  title?: string;
}

export function DocumentImageViewer({ src, alt, title }: DocumentImageViewerProps) {
  const { t } = useTranslation('study');
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const defaultAlt = alt || t('imageViewer.sourceImage');
  const displayTitle = title || t('imageViewer.sourceImage');

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className="flex flex-col h-full bg-[#121212] relative overflow-hidden font-sans">
      {/* Toolbar */}
      <div className="h-12 border-b border-sphera-border bg-sphera-surface-2/90 px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs text-sphera-text-muted truncate max-w-[200px]">
          <ImageIcon className="w-3.5 h-3.5 text-sphera-green shrink-0" />
          <span className="truncate">{displayTitle}</span>
        </div>

        <div className="flex items-center gap-1.5 bg-sphera-surface px-2 py-1 rounded-lg border border-sphera-border">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors disabled:opacity-40"
            title={t('imageViewer.zoomOut')}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-mono text-white/80 min-w-[40px] text-center select-none">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors disabled:opacity-40"
            title={t('imageViewer.zoomIn')}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-sphera-border mx-1" />

          <button
            type="button"
            onClick={handleRotate}
            className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors"
            title={t('imageViewer.rotate')}
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors"
            title={t('imageViewer.reset')}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-3.5 bg-sphera-border mx-1" />

          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors"
            title={t('imageViewer.openNewTab')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Image Canvas */}
      <div 
        className="flex-1 overflow-auto p-6 flex items-center justify-center custom-scrollbar select-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
        onDoubleClick={handleReset}
      >
        <div 
          className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
          }}
        >
          <img
            src={src}
            alt={defaultAlt}
            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl border border-sphera-border/60 bg-black/40"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
