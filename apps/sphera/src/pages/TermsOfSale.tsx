import React from 'react'
import { Helmet } from 'react-helmet-async'
import { useTranslation } from 'react-i18next'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'

export default function TermsOfSale() {
  const { t } = useTranslation('legal')

  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <Helmet>
        <title>{t('sale.seoTitle')}</title>
        <meta name="description" content={t('sale.seoDesc')} />
        <link rel="canonical" href="https://sphera.campussphere.app/terms-of-sale" />
        <meta property="og:title" content={t('sale.title') + ' — Sphera'} />
        <meta property="og:description" content={t('sale.seoDesc')} />
        <meta property="og:url" content="https://sphera.campussphere.app/terms-of-sale" />
      </Helmet>

      <SpheraHeader />

      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-sphera-green/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="container mx-auto px-4 max-w-4xl relative z-10 text-sphera-text-muted">
          <h1 className="text-4xl font-display font-bold text-white mb-8">{t('sale.title')}</h1>
          <p className="mb-8">{t('lastUpdated')}</p>

          <div className="space-y-8 text-sm md:text-base leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('sale.sec1.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('sale.sec1.p1') }} />
              <p className="mt-2" dangerouslySetInnerHTML={{ __html: t('sale.sec1.p2') }} />
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('sale.sec2.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('sale.sec2.p1') }} />
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>{t('sale.sec2.item1Title')}</strong> {t('sale.sec2.item1Desc')}</li>
                <li><strong>{t('sale.sec2.item2Title')}</strong> {t('sale.sec2.item2Desc')}</li>
                <li><strong>{t('sale.sec2.item3Title')}</strong> {t('sale.sec2.item3Desc')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('sale.sec3.title')}</h2>
              <p dangerouslySetInnerHTML={{ __html: t('sale.sec3.p1') }} />
              <p className="mt-2">{t('sale.sec3.p2')}</p>
              <ul className="list-disc pl-5 space-y-2 mt-2">
                <li><strong>{t('sale.sec3.item1')}</strong></li>
                <li><strong>{t('sale.sec3.item2')}</strong></li>
              </ul>
              <p className="mt-3">{t('sale.sec3.p3')}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('sale.sec4.title')}</h2>
              <p>{t('sale.sec4.p1')}</p>
              <p className="mt-2 font-semibold text-white">
                {t('sale.sec4.p2')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-4">{t('sale.sec5.title')}</h2>
              <p>{t('sale.sec5.p1')}</p>
              <p className="mt-2">
                {t('sale.sec5.p2')} <a href="mailto:support@campussphere.app" className="text-sphera-green hover:underline">support@campussphere.app</a>
              </p>
              <p className="mt-1">{t('sale.sec5.delay')}</p>
            </section>
          </div>
        </div>
      </main>

      <SpheraFooter />
    </div>
  )
}
