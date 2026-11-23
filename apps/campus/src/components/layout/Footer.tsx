import React from 'react';
import {
  FacebookLogo,
  InstagramLogo,
  LinkedinLogo,
  TiktokLogo,
  WhatsappLogo,
} from '@phosphor-icons/react';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation('navigation');

  return (
    <footer className="cs-pub-font bg-[#09090b] text-zinc-300 border-t border-white/10 mt-0">
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-12">
          {/* Bloc Marque à gauche */}
          <div className="lg:max-w-[340px] shrink-0">
            <a href="/cs" className="inline-flex items-center gap-2.5 mb-4">
              <img src="/CS.svg" alt="CampusSphere" className="w-9 h-9" />
              <span className="text-xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
                CampusSphere
              </span>
            </a>
            <p className="font-poppins text-xs font-semibold uppercase tracking-[0.14em] text-[#ff9800] mb-2">
              Connect. Share. Grow.
            </p>
            <p className="font-nunito text-sm text-zinc-400 leading-relaxed mb-6">
              {t('footerTagline', {
                defaultValue:
                  'Tout ce qui fait vivre ton campus, au même endroit : échanges, ressources, projets et opportunités étudiantes.',
              })}
            </p>
            <div className="flex items-center gap-2.5">
               <a
                href="https://whatsapp.com/channel/0029Vb9I6hzDp2QIHVJYpM44"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp CampusSphere"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-[#ff9800] hover:border-[#ff9800]/40 hover:bg-[#ff9800]/10 transition-all"
              >
                <WhatsappLogo size={18} weight="duotone" aria-hidden="true" />
              </a>
              <a
                href="https://web.facebook.com/campussphereofficial"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook CampusSphere"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-[#ff9800] hover:border-[#ff9800]/40 hover:bg-[#ff9800]/10 transition-all"
              >
                <FacebookLogo size={18} weight="duotone" aria-hidden="true" />
              </a>
              <a
                href="https://www.linkedin.com/company/campussphere"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn CampusSphere"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-[#ff9800] hover:border-[#ff9800]/40 hover:bg-[#ff9800]/10 transition-all"
              >
                <LinkedinLogo size={18} weight="duotone" aria-hidden="true" />
              </a>
              <a
                href="https://www.instagram.com/campussphere"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram CampusSphere"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-[#ff9800] hover:border-[#ff9800]/40 hover:bg-[#ff9800]/10 transition-all"
              >
                <InstagramLogo size={18} weight="duotone" aria-hidden="true" />
              </a>
              <a
                href="https://www.tiktok.com/@campussphere.app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok CampusSphere"
                className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-[#ff9800] hover:border-[#ff9800]/40 hover:bg-[#ff9800]/10 transition-all"
              >
                <TiktokLogo size={18} weight="duotone" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* 3 colonnes regroupées côte à côte à droite */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12 flex-1 lg:max-w-[700px]">
            {/* Colonne Plateforme */}
            <div>
              <h4 className="font-poppins text-xs font-bold uppercase tracking-[0.12em] text-zinc-200 mb-4">
                {t('platform', { defaultValue: 'Plateforme' })}
              </h4>
              <ul className="font-nunito font-semibold space-y-2.5 text-sm text-zinc-400">
                <li>
                  <a href="/cs" className="hover:text-white transition-colors">
                    CampusSphere
                  </a>
                </li>
                <li>
                  <a
                    href="https://sphera.campussphere.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors"
                  >
                    Sphera
                  </a>
                </li>
                <li>
                  <a href="/cs/impact-score" className="hover:text-white transition-colors">
                    {t('impactScore', { defaultValue: 'Impact Score' })}
                  </a>
                </li>
                <li>
                  <a href="/cs/about" className="hover:text-white transition-colors">
                    {t('about', { defaultValue: 'À propos' })}
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne Communauté */}
            <div>
              <h4 className="font-poppins text-xs font-bold uppercase tracking-[0.12em] text-zinc-200 mb-4">
                {t('community', { defaultValue: 'Communauté' })}
              </h4>
              <ul className="font-nunito font-semibold space-y-2.5 text-sm text-zinc-400">
                <li>
                  <a href="/cs/faq" className="hover:text-white transition-colors">
                    {t('faq', { defaultValue: 'FAQ' })}
                  </a>
                </li>
                <li>
                  <a href="/cs/contact" className="hover:text-white transition-colors">
                    {t('contact', { defaultValue: 'Contact' })}
                  </a>
                </li>                
                <li>
                  <a
                    href="/cs/policies/community-guidelines"
                    className="hover:text-white transition-colors"
                  >
                    {t('communityGuidelines', { defaultValue: 'Règles de la communauté' })}
                  </a>
                </li>
                <li>
                  <a href="/cs/policies" className="hover:text-white transition-colors">
                    {t('policies', { defaultValue: 'Politiques' })}
                  </a>
                </li>
                <li>
                  <a
                    href="/register"
                    className="text-[#ff9800] hover:text-[#ffb74d] transition-colors"
                  >
                    {t('joinCommunity', { defaultValue: 'Rejoindre' })}
                  </a>
                </li>
              </ul>
            </div>

            {/* Colonne Politiques (toutes regroupées ici) */}
            <div>
              <h4 className="font-poppins text-xs font-bold uppercase tracking-[0.12em] text-zinc-200 mb-4">
                {t('policies', { defaultValue: 'Politiques' })}
              </h4>
              <ul className="font-nunito font-semibold space-y-2.5 text-sm text-zinc-400">
                <li>
                  <a href="/cs/policies/privacy" className="hover:text-white transition-colors">
                    {t('privacyPolicy', { defaultValue: 'Politique de confidentialité' })}
                  </a>
                </li>
                <li>
                  <a href="/cs/policies/terms" className="hover:text-white transition-colors">
                    {t('termsOfService', { defaultValue: "Conditions d'utilisation" })}
                  </a>
                </li>
                <li>
                  <a
                    href="/cs/policies/terms-of-sale"
                    className="hover:text-white transition-colors"
                  >
                    {t('termsOfSale', { defaultValue: 'Conditions de vente (CGV)' })}
                  </a>
                </li>
                <li>
                  <a
                    href="/cs/policies/legal-notice"
                    className="hover:text-white transition-colors"
                  >
                    {t('legalNotice', { defaultValue: 'Mentions légales' })}
                  </a>
                </li>
                <li>
                  <a
                    href="/cs/policies/cookiepolicy"
                    className="hover:text-white transition-colors"
                  >
                    {t('cookiePolicy', { defaultValue: 'Politique de cookies' })}
                  </a>
                </li>
                <li>
                  <a
                    href="/cs/policies/copyright"
                    className="hover:text-white transition-colors"
                  >
                    {t('copyright', { defaultValue: "Droits d'auteur" })}
                  </a>
                </li>
                <li>
                  <a
                    href="/cs/policies/datadeletion"
                    className="hover:text-white transition-colors"
                  >
                    {t('dataDeletion', { defaultValue: 'Suppression des données' })}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Barre inférieure épurée */}
        <div className="border-t border-white/10 mt-12 pt-6 text-center text-xs text-zinc-500 font-nunito">
          <p className="m-0">
            &copy; 2026 CampusSphere · Connect. Share. Grow.{' '}
            {t('allRightsReserved', { defaultValue: 'Tous droits réservés.' })}
          </p>
        </div>
      </div>
    </footer>
  );
}
