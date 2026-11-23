import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight } from '@phosphor-icons/react';
import { PublicMenu } from './PublicMenu';
import { LanguageSwitcher } from '@cs/i18n';
import { useTranslation } from 'react-i18next';

export function Header(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('navigation');

  const isLanding = location.pathname === '/' || location.pathname === '/cs';

  const handleSectionLink = (sectionId: string, fallbackPath: string) => {
    if (isLanding) {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    navigate(fallbackPath);
  };

  return (
    <header className="cs-pub-font sticky top-0 z-50 bg-[#09090b]/90 backdrop-blur-md border-b border-white/10 text-zinc-100">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/cs')}
          className="flex items-center gap-2.5 cursor-pointer bg-transparent border-0 p-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9800]/60 rounded-lg"
        >
          <img src="/CS.svg" alt="CampusSphere Logo" className="w-8 h-8 sm:w-9 sm:h-9" />
          <span className="text-lg sm:text-xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
        </button>

        <nav
          aria-label="Navigation principale"
          className="hidden lg:flex items-center gap-7 font-nunito font-semibold text-sm"
        >
          <button
            type="button"
            onClick={() => handleSectionLink('produit', '/cs#produit')}
            className="text-zinc-300 hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer"
          >
            {t('features', { defaultValue: 'Fonctionnalités' })}
          </button>
          <button
            type="button"
            onClick={() => handleSectionLink('sphera', '/sphera')}
            className="text-zinc-300 hover:text-white transition-colors bg-transparent border-0 p-0 cursor-pointer"
          >
            Sphera
          </button>
          <a href="/cs/about" className="text-zinc-300 hover:text-white transition-colors">
            {t('about', { defaultValue: 'À propos' })}
          </a>
          <a href="/cs/contact" className="text-zinc-300 hover:text-white transition-colors">
            {t('contact', { defaultValue: 'Contact' })}
          </a>
          <a href="/cs/faq" className="text-zinc-300 hover:text-white transition-colors">
            {t('faq', { defaultValue: 'FAQ' })}
          </a>
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <LanguageSwitcher variant="minimal" />

          <div className="h-4 w-px bg-white/15" />

          <a
            href="/login"
            className="text-sm font-poppins font-semibold text-zinc-200 hover:text-white px-3 py-2 transition-colors"
          >
            {t('login', { defaultValue: 'Connexion' })}
          </a>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#ff9800] hover:bg-[#f57c00] text-white px-5 py-2 font-poppins text-sm font-semibold shadow-[0_6px_18px_rgba(255,152,0,0.28)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <span>{t('joinCommunity', { defaultValue: 'Rejoindre' })}</span>
            <ArrowUpRight size={15} weight="duotone" aria-hidden="true" />
          </button>
        </div>

        {/* Mobile controls (Language + Menu Hamburger) */}
        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSwitcher variant="minimal" />
          <PublicMenu />
        </div>
      </div>
    </header>
  );
}
