import React from 'react';
import { FaFacebook, FaLinkedin, FaInstagram, FaTiktok } from 'react-icons/fa';

export function Footer() {
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
                La plateforme qui connecte les étudiants et enrichit l'expérience universitaire.
                Ensemble, nous construisons l'avenir de l'éducation collaborative.
              </p>
              <div className="flex items-center gap-2">
                <a href="https://www.facebook.com/profile.php?id=61583216355151" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                  <FaFacebook className="w-7 h-7" />
                </a>
                <a href="https://www.linkedin.com/company/campussphere/" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                  <FaLinkedin className="w-7 h-7" />
                </a>
                <a href="https://www.instagram.com/campussphere/" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                  <FaInstagram className="w-7 h-7" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:scale-110 transition-all duration-300 hover:text-primary group">
                  <FaTiktok className="w-7 h-7" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-poppins font-semibold mb-4">Informations</h4>
              <ul className="font-nunito font-semibold space-y-2 text-sm text-muted-foreground">
                <li><a href="/cs-inc" className="hover:text-foreground transition-colors">CampusSphere</a></li>
                <li><a href="/cs-inc/about" className="hover:text-foreground transition-colors">À propos</a></li>
                <li><a href="/cs-inc/contact" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="/cs-inc/faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-poppins font-semibold mb-4 mt-0">Politiques</h4>
                <ul className="font-nunito font-semibold space-y-2 text-sm text-muted-foreground">
                  <li><a href="/cs-inc/policies/privacy" className="hover:text-foreground transition-colors">Politique de Confidentialité</a></li>
                  <li><a href="/cs-inc/policies/terms" className="hover:text-foreground transition-colors">Conditions d'Utilisation</a></li>
                  <li><a href="/cs-inc/policies/cookiepolicy" className="hover:text-foreground transition-colors">Politique de Cookies</a></li>
                  <li><a href="/cs-inc/policies/community-guidelines" className="hover:text-foreground transition-colors">Règles de la communauté</a></li>
                  <li><a href="/cs-inc/policies/datadeletion" className="hover:text-foreground transition-colors">Suppression de données</a></li>
                  <li><a href="/cs-inc/policies/copyright" className="hover:text-foreground transition-colors">Politique de droits d'auteur</a></li>
                </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 CampusSphere. Tous droits réservés. Construit avec passion pour les étudiants.</p>
          </div>
        </div>
    </footer>
  );
}