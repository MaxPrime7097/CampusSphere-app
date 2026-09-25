import React, { useCallback, useState } from 'react'
import { useTranslation } from '@cs/i18n'
import { UploadCloud, File, X } from 'lucide-react'

interface UploadZoneProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
}

export function UploadZone({ onFileSelect, selectedFile }: UploadZoneProps) {
  const { t } = useTranslation('study')
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0])
    }
  }, [onFileSelect])

  return (
    <div 
      className={`sphera-upload-zone p-8 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden group min-h-[280px] ${
        isDragging ? 'border-sphera-green bg-sphera-green/5' : ''
      } ${selectedFile ? 'border-sphera-green/50 bg-sphera-green/5' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !selectedFile && document.getElementById('sphera-file-upload')?.click()}
    >
      <input 
        id="sphera-file-upload" 
        type="file" 
        accept=".pdf,.docx,.txt,.md,.markdown,text/markdown,text/plain,.png,.jpg,.jpeg,.webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
        className="hidden" 
        onChange={handleFileInput}
      />
      
      {selectedFile ? (
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-sphera-green/10 flex items-center justify-center mb-4 text-sphera-green">
            <File className="w-8 h-8" />
          </div>
          <h3 className="text-white font-medium text-lg mb-1">{selectedFile.name}</h3>
          <p className="text-sphera-text-muted text-sm mb-6">
            {t('upload.readyForGeneration', { size: (selectedFile.size / (1024 * 1024)).toFixed(2) })}
          </p>
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onFileSelect(null)
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sphera-surface-2 text-white hover:bg-sphera-border transition-colors text-sm font-medium"
          >
            <X className="w-4 h-4" /> {t('upload.changeFile')}
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center transition-transform group-hover:scale-105 duration-300">
          <div className="w-16 h-16 rounded-full bg-sphera-surface-2 border border-sphera-border flex items-center justify-center mb-4 text-sphera-green group-hover:bg-sphera-green/10 group-hover:border-sphera-green/30 transition-colors">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-white font-medium text-lg mb-2">{t('upload.dropzoneTitle')}</h3>
          <p className="text-sphera-text-muted text-sm mb-4">{t('upload.dropzoneSubtitle')}</p>
          <div className="text-xs text-sphera-text-muted bg-sphera-surface px-3 py-1.5 rounded-md border border-sphera-border">
            {t('upload.supportedFormats')}
          </div>
        </div>
      )}
    </div>
  )
}
