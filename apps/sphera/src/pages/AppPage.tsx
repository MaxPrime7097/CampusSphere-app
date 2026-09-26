import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { UploadZone } from '../components/app/UploadZone'
import { ToolSelector, type ToolType } from '../components/app/ToolSelector'
import { GenerateButton } from '../components/app/GenerateButton'
import { SpheraHeader } from '../components/layout/SpheraHeader'

export default function AppPage() {
  const { t } = useTranslation('study')
  const { isAuthenticated } = useSpheraAuth()
  const navigate = useNavigate()

  const [file, setFile] = useState<File | null>(null)
  const [generationMode, setGenerationMode] = useState<'study' | 'annale'>('study')
  const [selectedTools, setSelectedTools] = useState<ToolType[]>(['fiche'])
  const [annaleMode, setAnnaleMode] = useState<'complete' | 'rapide'>('complete')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!file) return
    setGenerating(true)
    setError(null)

    // Simulate API call for now (since we're rebuilding the frontend structure)
    try {
      await new Promise(resolve => setTimeout(resolve, 8000)) // Fake generation time
      
      // Navigate to a result page
      navigate('/result', { 
        state: { 
          tool: generationMode === 'study' ? selectedTools[0] : 'annale', 
          filename: file.name 
        } 
      })
    } catch (e: any) {
      setError(e.message || t('appPage.generationError'))
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-sphera-bg flex flex-col font-sans">
      <SpheraHeader />

      <main className="flex-1 container mx-auto max-w-6xl px-4 py-8 md:py-12">
        
        {/* Header App */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
            {t('appPage.title')}
          </h1>
          <p className="text-sphera-text-muted">
            {t('appPage.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Upload */}
          <div className="lg:col-span-7 space-y-6">
            <UploadZone 
              onFileSelect={(f) => {
                setFile(f)
                setError(null)
              }} 
              selectedFile={file} 
            />
            
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-in fade-in">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* Right Column: Tools */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="sphera-card p-6 flex-1 flex flex-col">
              
              {/* Mode Toggle */}
              <div className="flex bg-sphera-bg p-1 rounded-lg w-full mb-6">
                <button
                  onClick={() => setGenerationMode('study')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                    generationMode === 'study'
                      ? 'bg-sphera-surface text-white shadow'
                      : 'text-sphera-text-muted hover:text-white'
                  }`}
                >
                  {t('appPage.studyMode')}
                </button>
                <button
                  onClick={() => setGenerationMode('annale')}
                  className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                    generationMode === 'annale'
                      ? 'bg-sphera-surface text-white shadow'
                      : 'text-sphera-text-muted hover:text-white'
                  }`}
                >
                  {t('appPage.annaleMode')}
                </button>
              </div>

              {generationMode === 'study' ? (
                <ToolSelector 
                  selectedTools={selectedTools}
                  onToolSelect={setSelectedTools}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  <h3 className="text-white font-medium text-lg px-1">{t('appPage.correctionMode')}</h3>
                  <div className="p-4 rounded-xl bg-sphera-surface border border-sphera-border">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setAnnaleMode('complete')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-all border ${
                          annaleMode === 'complete'
                            ? 'bg-sphera-green/10 border-sphera-green shadow-[0_0_15px_rgba(34,197,94,0.15)] text-sphera-green'
                            : 'bg-sphera-bg border-sphera-border text-sphera-text-muted hover:bg-sphera-surface-2 hover:text-white'
                        }`}
                      >
                        {t('appPage.complete')}
                      </button>
                      <button
                        onClick={() => setAnnaleMode('rapide')}
                        className={`py-3 px-4 rounded-lg text-sm font-medium transition-all border ${
                          annaleMode === 'rapide'
                            ? 'bg-sphera-green/10 border-sphera-green shadow-[0_0_15px_rgba(34,197,94,0.15)] text-sphera-green'
                            : 'bg-sphera-bg border-sphera-border text-sphera-text-muted hover:bg-sphera-surface-2 hover:text-white'
                        }`}
                      >
                        {t('appPage.rapide')}
                      </button>
                    </div>
                    <p className="text-xs text-sphera-text-muted mt-4 text-center">
                      {annaleMode === 'complete' 
                        ? t('appPage.completeDesc')
                        : t('appPage.rapideDesc')}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-6">
                <GenerateButton 
                  onGenerate={handleGenerate}
                  disabled={!file || (generationMode === 'study' && selectedTools.length === 0)}
                  isGenerating={generating}
                />
              </div>
              
              <div className="mt-6 text-center">
                {!isAuthenticated ? (
                  <p className="text-xs text-sphera-text-muted">
                    {t('appPage.guestWarning')}<br/>
                    <a href="/login" className="text-sphera-green hover:underline mt-1 inline-block">
                      {t('appPage.guestLogin')}
                    </a>
                  </p>
                ) : (
                  <p className="text-xs text-sphera-text-muted flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sphera-green inline-block"></span>
                    {t('appPage.savedNotice')}
                  </p>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
