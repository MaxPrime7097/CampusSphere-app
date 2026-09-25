import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function Privacy() {
  const { t } = useTranslation('legal')

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('privacy.seoTitle')}</title>
        <meta name="description" content={t('privacy.seoDesc')} />
        <link rel="canonical" href="https://sphera.campussphere.app/privacy" />
        <meta property="og:title" content={t('privacy.title') + ' — Sphera'} />
        <meta property="og:description" content={t('privacy.seoDesc')} />
        <meta property="og:url" content="https://sphera.campussphere.app/privacy" />
      </Helmet>

      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">{t('privacy.title')}</h1>
          <p className="mb-8">{t('lastUpdated')}</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.sec1.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('privacy.sec1.p1') }} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.sec2.title')}</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>{t('privacy.sec2.item1Title')}</strong> {t('privacy.sec2.item1Desc')}</li>
                <li><strong>{t('privacy.sec2.item2Title')}</strong> {t('privacy.sec2.item2Desc')}</li>
                <li><strong>{t('privacy.sec2.item3Title')}</strong> {t('privacy.sec2.item3Desc')}</li>
                <li><strong>{t('privacy.sec2.item4Title')}</strong> {t('privacy.sec2.item4Desc')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.sec3.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('privacy.sec3.p1') }} />
              <div className="mt-4 p-4 rounded-xl bg-sphera-surface border border-sphera-border font-semibold text-white">
                {t('privacy.sec3.commitment')}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.sec4.title')}</h2>
              <p>{t('privacy.sec4.p1')}</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>{t('privacy.sec4.item1Title')}</strong> {t('privacy.sec4.item1Desc')}</li>
                <li><strong>{t('privacy.sec4.item2Title')}</strong> {t('privacy.sec4.item2Desc')}</li>
                <li><strong>{t('privacy.sec4.item3Title')}</strong> {t('privacy.sec4.item3Desc')}</li>
                <li><strong>{t('privacy.sec4.item4Title')}</strong> {t('privacy.sec4.item4Desc')}</li>
                <li><strong>{t('privacy.sec4.item5Title')}</strong> {t('privacy.sec4.item5Desc')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.sec5.title')}</h2>
              <p>{t('privacy.sec5.p1')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('privacy.sec6.title')}</h2>
              <p>
                {t('privacy.sec6.p1')} <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
