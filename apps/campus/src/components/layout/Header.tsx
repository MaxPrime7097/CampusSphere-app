import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicMenu } from './PublicMenu';

export function Header(): JSX.Element {
  const navigate = useNavigate();

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/60 transition-colors duration-200">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/cs-inc')}>
          <img src="/CS.svg" alt="CampusSphere Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
          <span className="text-xl sm:text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-5 font-nunito font-semibold">
          <a href="/cs-inc/about" className="text-muted-foreground hover:text-foreground transition-colors">À propos</a>
          <a href="/cs-inc/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          <a href="/cs-inc/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          <a href="/cs-inc/policies" className="text-muted-foreground hover:text-foreground transition-colors">Politiques</a>
          
          <div className="h-4 w-px bg-border/80" />

          <a href="/login" className="text-primary hover:text-foreground transition-colors">Connexion</a>
          <button
            onClick={() => navigate('/register')}
            className="campus-gradient text-white hover:opacity-90 px-4 py-2 rounded-lg transition-all duration-300 font-poppins text-sm font-semibold"
          >
            Rejoins la communauté
          </button>
        </div>

        {/* Mobile controls (Menu Hamburger) */}
        <div className="flex items-center gap-2 lg:hidden">
          <PublicMenu />
        </div>
      </div>
    </nav>
  );
}