import React from 'react'
import { Download, Loader2 } from 'lucide-react'
interface DownloadPDFButtonProps {
  onDownload: () => void | Promise<void>
  isDownloading?: boolean
  label?: string
  className?: string
}

const DownloadPDFButton = ({
  onDownload,
  isDownloading = false,
  label = 'Télécharger en PDF',
  className = '',
}: DownloadPDFButtonProps) => {
  return (
    <button
      onClick={onDownload}
      disabled={isDownloading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
        border border-sphera-green/30 text-sphera-green bg-transparent
        hover:bg-sphera-green/10 hover:border-sphera-green/60
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
    >
      {isDownloading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Génération...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

export default DownloadPDFButton
