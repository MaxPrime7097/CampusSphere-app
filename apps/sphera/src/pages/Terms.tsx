import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function Terms() {
  const { t } = useTranslation('legal')

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('terms.seoTitle')}</title>
        <meta name="description" content={t('terms.seoDesc')} />
        <link rel="canonical" href="https://sphera.campussphere.app/terms" />
        <meta property="og:title" content={t('terms.title') + ' — Sphera'} />
        <meta property="og:description" content={t('terms.seoDesc')} />
        <meta property="og:url" content="https://sphera.campussphere.app/terms" />
      </Helmet>

      <SpheraHeader />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">{t('terms.title')}</h1>
          <p className="mb-8">{t('lastUpdated')}</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec1.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('terms.sec1.p1') }} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec2.title')}</h2>
              <p>{t('terms.sec2.p1')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec3.title')}</h2>
              <p>{t('terms.sec3.p1')}</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li>{t('terms.sec3.item1')}</li>
                <li>{t('terms.sec3.item2')}</li>
                <li>{t('terms.sec3.item3')}</li>
              </ul>
              <p className="mt-3">{t('terms.sec3.p2')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec4.title')}</h2>
              <p>{t('terms.sec4.p1')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec5.title')}</h2>
              <p>{t('terms.sec5.p1')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec6.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('terms.sec6.p1') }} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec7.title')}</h2>
              <p>{t('terms.sec7.p1')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('terms.sec8.title')}</h2>
              <p>
                {t('terms.sec8.p1')} <a href="mailto:policies@campussphere.app" className="text-sphera-green hover:underline">policies@campussphere.app</a> ou <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
