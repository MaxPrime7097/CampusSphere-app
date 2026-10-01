import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Trash as Trash2, Warning as AlertTriangle } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next';

export function DeleteConfirmModal({
  isOpen,
  setIsOpen,
  onConfirm,
  title,
  description,
}: {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}) {
  const { t } = useTranslation('study');
  const resolvedTitle = title || t('modals.deleteConfirm.defaultTitle');
  const resolvedDesc = description || t('modals.deleteConfirm.defaultDesc');

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-sphera-surface-2 border border-red-500/20 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 p-6 flex flex-col gap-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <Dialog.Title className="text-lg font-semibold">{resolvedTitle}</Dialog.Title>
            </div>
            <Dialog.Close className="text-sphera-text-muted hover:text-white transition-colors bg-sphera-surface hover:bg-sphera-border p-1.5 rounded-full">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-sm text-sphera-text-muted leading-relaxed pl-13 mt-2">
            {resolvedDesc}
          </Dialog.Description>

          <div className="flex items-center justify-end gap-3 mt-4">
            <Dialog.Close className="px-4 py-2 text-sm font-medium text-sphera-text-muted hover:text-white bg-sphera-surface hover:bg-sphera-border rounded-lg transition-colors">
              {t('modals.deleteConfirm.cancel')}
            </Dialog.Close>
            <button 
              onClick={() => {
                onConfirm();
                setIsOpen(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> {t('modals.deleteConfirm.delete')}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
