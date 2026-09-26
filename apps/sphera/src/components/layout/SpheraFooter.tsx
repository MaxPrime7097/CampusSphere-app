import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function SpheraFooter() {
  const { t } = useTranslation('landing')

  return (
    <footer className="border-t border-sphera-border bg-sphera-bg py-8 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-col items-center md:items-start gap-1">
          <Link to="/" className="flex items-center gap-2">
            <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-6 w-auto" />
            <span className="font-display font-bold text-lg text-white">Sphera</span>
          </Link>
          <p className="text-sm text-sphera-text-muted mt-2">{t('footer.slogan')}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm text-sphera-text-muted">
          <Link to="/sphera-live" className="text-sphera-green hover:underline transition-colors font-medium">{t('footer.spheraLive')}</Link>
          <Link to="/#faq" className="hover:text-white transition-colors">{t('footer.faq')}</Link>
          <Link to="/pricing" className="hover:text-white transition-colors">{t('footer.pricing')}</Link>
          <Link to="/blogs" className="hover:text-white transition-colors">{t('footer.blog')}</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
          <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
          <Link to="/terms-of-sale" className="hover:text-white transition-colors">{t('footer.termsOfSale')}</Link>
          <Link to="/legal-notice" className="hover:text-white transition-colors">{t('footer.legalNotice')}</Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-sphera-text-muted">
          <span>{t('footer.poweredBy')}</span>
          <a href="https://campussphere.app" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cs-orange transition-colors">
            CampusSphere
          </a>
        </div>
      </div>
    </footer>
  )
}
