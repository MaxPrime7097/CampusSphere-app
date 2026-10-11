import React from 'react';
import { FaFacebook, FaLinkedin, FaInstagram, FaTiktok } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation('navigation');

  return (
    <footer className="bg-background border-t border-border py-10 mt-0">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/CS.svg" alt="CampusSphere" className="w-10 h-10" />
              <span className="text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
                CampusSphere
              </span>
            </div>
            <p className="font-nunito font-semibold text-muted-foreground mb-4">
              {t('footerTagline', {
                defaultValue: "La plateforme qui connecte les étudiants et enrichit l'expérience universitaire. Ensemble, nous construisons l'avenir de l'éducation collaborative.",
              })}
            </p>
            <div className="flex items-center gap-2">
              <a href="https://web.facebook.com/campussphereofficial" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                <FaFacebook className="w-7 h-7" />
              </a>
              <a href="https://www.linkedin.com/company/campussphere" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                <FaLinkedin className="w-7 h-7" />
              </a>
              <a href="https://www.instagram.com/campussphere" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                <FaInstagram className="w-7 h-7" />
              </a>
              <a href="https://www.tiktok.com/@campussphere.app" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                <FaTiktok className="w-7 h-7" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-poppins font-semibold mb-4">{t('company', { defaultValue: 'Entreprise' })}</h4>
            <ul className="font-nunito font-semibold space-y-2 text-sm text-muted-foreground">
              <li><a href="/cs-inc" className="hover:text-foreground transition-colors">CampusSphere</a></li>
              <li><a href="https://sphera.campussphere.app" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Sphera</a></li>
              <li><a href="/cs-inc/about" className="hover:text-foreground transition-colors">{t('about', { defaultValue: 'À propos' })}</a></li>
              <li><a href="/cs-inc/impact-score" className="hover:text-foreground transition-colors">{t('impactScore', { defaultValue: 'Impact Score' })}</a></li>
              <li><a href="/cs-inc/contact" className="hover:text-foreground transition-colors">{t('contact', { defaultValue: 'Contact' })}</a></li>
              <li><a href="/cs-inc/faq" className="hover:text-foreground transition-colors">{t('faq', { defaultValue: 'FAQ' })}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-poppins font-semibold mb-4 mt-0">{t('policies', { defaultValue: 'Politiques' })}</h4>
            <ul className="font-nunito font-semibold space-y-2 text-sm text-muted-foreground">
              <li><a href="/cs-inc/policies/privacy" className="hover:text-foreground transition-colors">{t('privacyPolicy', { defaultValue: 'Politique de Confidentialité' })}</a></li>
              <li><a href="/cs-inc/policies/terms" className="hover:text-foreground transition-colors">{t('termsOfService', { defaultValue: "Conditions d'Utilisation" })}</a></li>
              <li><a href="/cs-inc/policies/terms-of-sale" className="hover:text-foreground transition-colors">{t('termsOfSale', { defaultValue: 'Conditions de Vente (CGV)' })}</a></li>
              <li><a href="/cs-inc/policies/legal-notice" className="hover:text-foreground transition-colors">{t('legalNotice', { defaultValue: 'Mentions Légales' })}</a></li>
              <li><a href="/cs-inc/policies/community-guidelines" className="hover:text-foreground transition-colors">{t('communityGuidelines', { defaultValue: 'Règles de la Communauté' })}</a></li>
              <li><a href="/cs-inc/policies/cookiepolicy" className="hover:text-foreground transition-colors">{t('cookiePolicy', { defaultValue: 'Politique de Cookies' })}</a></li>
              <li><a href="/cs-inc/policies/copyright" className="hover:text-foreground transition-colors">{t('copyright', { defaultValue: "Droits d'auteur" })}</a></li>
              <li><a href="/cs-inc/policies/datadeletion" className="hover:text-foreground transition-colors">{t('dataDeletion', { defaultValue: 'Suppression des Données' })}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 CampusSphere. {t('allRightsReserved', { defaultValue: 'Tous droits réservés. Construit avec passion pour les étudiants.' })}</p>
        </div>
      </div>
    </footer>
  );
}