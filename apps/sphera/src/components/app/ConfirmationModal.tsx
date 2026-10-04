import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Warning as AlertTriangle, StopCircle } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next';

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  confirmIcon?: React.ReactNode;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'danger',
  confirmIcon,
}: ConfirmationModalProps) {
  const { t } = useTranslation('study');

  const colorClasses = {
    danger: {
      border: 'border-red-500/20',
      iconBg: 'bg-red-500/10 text-red-500',
      btn: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-500',
      btn: 'bg-amber-500 hover:bg-amber-600 text-black font-semibold',
    },
    primary: {
      border: 'border-sphera-green/20',
      iconBg: 'bg-sphera-green/10 text-sphera-green',
      btn: 'bg-sphera-green hover:bg-sphera-green-hover text-black font-semibold',
    },
  }[variant];

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-sphera-surface-2 border ${colorClasses.border} rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col gap-4 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${colorClasses.iconBg} flex items-center justify-center shrink-0`}>
                {confirmIcon || (variant === 'danger' ? <StopCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />)}
              </div>
              <Dialog.Title className="text-base sm:text-lg font-semibold">{title}</Dialog.Title>
            </div>
            <Dialog.Close className="text-sphera-text-muted hover:text-white transition-colors bg-sphera-surface hover:bg-sphera-border p-1.5 rounded-full">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-sphera-text-muted leading-relaxed mt-1">
            {description}
          </Dialog.Description>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-sphera-text-muted hover:text-white bg-sphera-surface hover:bg-sphera-border rounded-xl transition-colors"
            >
              {cancelLabel || t('common.cancel', 'Annuler')}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 text-sm rounded-xl transition-colors flex items-center gap-2 ${colorClasses.btn}`}
            >
              {confirmLabel || t('common.confirm', 'Confirmer')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
