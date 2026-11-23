import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@cs/i18n'
import { ArrowUpRight, Lightning as Zap } from '@phosphor-icons/react'

export function SpheraFooter() {
  const { t } = useTranslation('landing')

  return (
    <footer className="border-t border-sphera-border bg-[#0b0c0e] mt-auto">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-sphera-border/80">
          {/* Brand Column */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img src="/sphera_logo.svg" alt="Sphera" className="h-7 w-auto" />
              <span className="font-display font-bold text-xl tracking-tight text-white">Sphera</span>
            </Link>
            <p className="text-sm text-sphera-text-muted leading-relaxed max-w-xs">
              {t('footer.slogan')}
            </p>
            <a
              href="https://campussphere.app/cs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-sphera-border bg-sphera-surface px-3 py-2 text-xs text-sphera-text-muted hover:border-cs-orange/50 hover:text-white transition-colors"
            >
              <img src="/CS.svg" alt="CampusSphere" className="w-4 h-4 object-contain" />
              <span>
                {t('footer.poweredBy')}{' '}
                <strong className="text-white font-semibold">CampusSphere</strong>
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-cs-orange" />
            </a>
          </div>

          {/* Product */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-sphera-text-muted font-semibold">
              {t('footer.colProduct')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/sphera-live"
                  className="inline-flex items-center gap-1.5 text-sphera-green hover:underline font-medium"
                >
                  <Zap className="w-3.5 h-3.5" weight="fill" />
                  {t('footer.spheraLive')}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.pricing')}
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.blog')}
                </Link>
              </li>
              <li>
                <Link to="/#faq" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-sphera-text-muted font-semibold">
              {t('footer.colEcosystem')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href="https://campussphere.app/cs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sphera-text-muted hover:text-cs-orange transition-colors"
                >
                  {t('footer.campusSphere')}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </li>
              <li>
                <Link to="/login" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.login')}
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.register')}
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@campussphere.app"
                  className="text-sphera-text-muted hover:text-white transition-colors"
                >
                  {t('footer.support')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-sphera-text-muted font-semibold">
              {t('footer.colLegal')}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/privacy" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/terms-of-sale" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.termsOfSale')}
                </Link>
              </li>
              <li>
                <Link to="/legal-notice" className="text-sphera-text-muted hover:text-white transition-colors">
                  {t('footer.legalNotice')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sphera-text-muted">
          <p>© {new Date().getFullYear()} Sphera — CampusSphere. {t('footer.copyright')}</p>
          <LanguageSwitcher variant="minimal" />
        </div>
      </div>
    </footer>
  )
}
