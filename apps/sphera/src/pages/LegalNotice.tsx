import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function LegalNotice() {
  const { t } = useTranslation('legal')

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('notice.seoTitle')}</title>
        <meta name="description" content={t('notice.seoDesc')} />
        <link rel="canonical" href="https://sphera.campussphere.app/legal-notice" />
        <meta property="og:title" content={t('notice.title') + ' — Sphera'} />
        <meta property="og:description" content={t('notice.seoDesc')} />
        <meta property="og:url" content="https://sphera.campussphere.app/legal-notice" />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">{t('notice.title')}</h1>
          <p className="mb-8">{t('lastUpdated')}</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('notice.sec1.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('notice.sec1.p1') }} />
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>{t('notice.sec1.service')}</strong> {t('notice.sec1.serviceVal')}</li>
                <li><strong>{t('notice.sec1.location')}</strong> {t('notice.sec1.locationVal')}</li>
                <li><strong>{t('notice.sec1.partners')}</strong> <a href="mailto:contact@campussphere.app" className="text-sphera-green hover:underline">contact@campussphere.app</a></li>
                <li><strong>{t('notice.sec1.support')}</strong> <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a></li>
                <li><strong>{t('notice.sec1.legal')}</strong> <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('notice.sec2.title')}</h2>
              <p>{t('notice.sec2.p1')}</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>{t('notice.sec2.frontend')}</strong> {t('notice.sec2.frontendVal')}</li>
                <li><strong>{t('notice.sec2.backend')}</strong> {t('notice.sec2.backendVal')}</li>
                <li><strong>{t('notice.sec2.storage')}</strong> {t('notice.sec2.storageVal')}</li>
                <li><strong>{t('notice.sec2.ai')}</strong> {t('notice.sec2.aiVal')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('notice.sec3.title')}</h2>
              <p>{t('notice.sec3.p1')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('notice.sec4.title')}</h2>
              <p>{t('notice.sec4.p1')}</p>
              <p className="mt-2">
                {t('notice.sec4.p2')} <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a> ou <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
