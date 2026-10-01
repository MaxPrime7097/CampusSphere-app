import React, { useState } from 'react';
import { X, FileText, ArrowRight, WarningCircle as AlertCircle, Sparkle as Sparkles } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next';

interface PasteTextModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string, title: string) => void;
}

export function PasteTextModal({ isOpen, onClose, onConfirm }: PasteTextModalProps) {
  const { t } = useTranslation('study');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const charCount = text.trim().length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const minChars = 50;
  const isValid = charCount >= minChars;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) {
      setError(t('modals.pasteText.minError', { min: minChars }));
      return;
    }
    const finalTitle = title.trim() || t('modals.pasteText.defaultTitle');
    onConfirm(text.trim(), finalTitle);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-2xl bg-sphera-surface-2 border border-sphera-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Accent Line */}
          <div className="h-1 w-full bg-gradient-to-r from-sphera-green/50 via-sphera-green to-sphera-green/50" />

          {/* Header */}
          <div className="p-6 pb-4 border-b border-sphera-border flex items-start justify-between bg-sphera-surface">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sphera-green/10 border border-sphera-green/30 flex items-center justify-center text-sphera-green shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-display">
                  {t('modals.pasteText.title')}
                </h3>
                <p className="text-xs sm:text-sm text-sphera-text-muted mt-0.5">
                  {t('modals.pasteText.subtitle')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-sphera-text-muted hover:text-white hover:bg-sphera-bg rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="course-title" className="block text-xs font-semibold uppercase tracking-wider text-sphera-text-muted mb-2">
                {t('modals.pasteText.docTitleLabel')}
              </label>
              <input
                id="course-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('modals.pasteText.docTitlePlaceholder')}
                className="w-full bg-sphera-bg border border-sphera-border focus:border-sphera-green rounded-xl px-4 py-3 text-white text-sm focus:outline-none transition-colors"
                maxLength={100}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="course-text" className="block text-xs font-semibold uppercase tracking-wider text-sphera-text-muted">
                  {t('modals.pasteText.contentLabel')}
                </label>
                <div className="text-xs text-sphera-text-muted flex items-center gap-2 font-mono">
                  <span>{t('modals.pasteText.wordsCount', { count: wordCount })}</span>
                  <span>•</span>
                  <span className={charCount < minChars && charCount > 0 ? 'text-amber-400' : ''}>
                    {t('modals.pasteText.charsCount', { count: charCount })}
                  </span>
                </div>
              </div>
              <textarea
                id="course-text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (error) setError(null);
                }}
                rows={12}
                placeholder={t('modals.pasteText.contentPlaceholder')}
                className="w-full bg-sphera-bg border border-sphera-border focus:border-sphera-green rounded-xl p-4 text-white text-sm focus:outline-none leading-relaxed resize-none custom-scrollbar font-sans transition-colors"
              />
              <p className="text-[11px] text-sphera-text-muted mt-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sphera-green shrink-0" />
                <span>
                  {charCount >= minChars 
                    ? t('modals.pasteText.minCharsReached') 
                    : t('modals.pasteText.minChars', { count: minChars })}
                </span>
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-sphera-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-sphera-border text-sphera-text-muted hover:text-white hover:bg-sphera-bg transition-colors text-sm font-medium"
              >
                {t('modals.pasteText.cancel')}
              </button>
              <button
                type="submit"
                disabled={!isValid}
                className="px-6 py-2.5 rounded-xl bg-sphera-green text-black font-bold text-sm hover:bg-sphera-green/90 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{t('modals.pasteText.submit')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
