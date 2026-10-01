import React from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { FicheView, QuizView, FlashcardsView, AnnaleView } from '../components/app/ResultViews'
import { ArrowLeft, ShareNetwork as Share2, Download, WarningCircle as AlertCircle } from "@phosphor-icons/react";
import { useSpheraAuth } from '../contexts/SpheraAuthContext'

export default function GuestResult() {
  const { t } = useTranslation('study')
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useSpheraAuth()
  
  const { tool, filename, result } = location.state || { tool: 'fiche', filename: 'document.pdf', result: null }

  const renderResult = () => {
    switch(tool) {
      case 'fiche': return <FicheView content={result} sourceName={filename} />
      case 'quiz': return <QuizView content={result} />
      case 'flashcards': return <FlashcardsView content={result} />
      case 'annale': return <AnnaleView annale={{ content: result, mode: 'complete' }} sourceName={filename} />
      default: return <FicheView content={result} sourceName={filename} />
    }
  }

  const getToolName = () => {
    switch(tool) {
      case 'fiche': return t('guestResult.toolNames.fiche')
      case 'quiz': return t('guestResult.toolNames.quiz')
      case 'flashcards': return t('guestResult.toolNames.flashcards')
      case 'annale': return t('guestResult.toolNames.annale')
      default: return t('guestResult.toolNames.default')
    }
  }

  return (
    <div className="min-h-screen bg-sphera-bg flex flex-col font-sans">
      <SpheraHeader />

      {!isAuthenticated && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 py-3 px-4 text-center">
          <p className="text-sm text-orange-400 flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>
              {t('guestResult.notSavedWarning')}{' '}
              <Link to="/login" className="font-bold underline hover:text-orange-300">
                {t('guestResult.connectLink')}
              </Link>{' '}
              {t('guestResult.toKeepRevisions')}
            </span>
          </p>
        </div>
      )}

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
        
        {/* Result Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-sphera-border">
          <div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="text-sm text-sphera-text-muted hover:text-white flex items-center gap-2 mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t('guestResult.back')}
            </button>
            <h1 className="font-display text-2xl font-bold text-white flex items-center gap-3">
              {filename}
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-sphera-green/10 text-sphera-green border border-sphera-green/20">
                {getToolName()}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button className="btn btn-outline border-sphera-border text-white hover:bg-sphera-surface-2 p-2 rounded-lg" title={t('guestResult.share')}>
              <Share2 className="w-5 h-5" />
            </button>
            <button className="btn btn-outline border-sphera-border text-white hover:bg-sphera-surface-2 p-2 rounded-lg" title={t('guestResult.download')}>
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/app')}
              className="sphera-primary-btn py-2 px-4 text-sm"
            >
              {t('guestResult.newGeneration')}
            </button>
          </div>
        </div>

        {/* Content Render */}
        <div className="pb-24">
          {renderResult()}
        </div>

      </main>
    </div>
  )
}
