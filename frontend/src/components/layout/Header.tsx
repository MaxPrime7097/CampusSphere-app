import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { PublicMenu } from './PublicMenu';
export function Header() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/cs-inc')}>
          <img src="/CS.svg" alt="CampusSphere Logo" className="w-8 h-8 sm:w-10 sm:h-10" />
          <span className="text-xl sm:text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
            CampusSphere
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-4 font-nunito font-semibold">
          <a href="/cs-inc/about" className="text-muted-foreground hover:text-foreground transition-colors">À propos</a>
          <a href="/cs-inc/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          <a href="/cs-inc/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          <a href="/cs-inc/policies" className="text-muted-foreground hover:text-foreground transition-colors">Politiques</a>
          <a href="/login" className="primary/80 text-primary hover:text-foreground transition-colors">Connexion</a>
          <button
            onClick={() => navigate('/register')}
            className="campus-gradient text-white hover:opacity-90 px-4 py-2 rounded-lg transition-all duration-300"
          >
            Rejoins la communauté

          </button>
        </div>

        {/* Mobile menu placeholder */}
        <div className="lg:hidden">
          <PublicMenu />
        </div>
      </div>
    </nav>
  );
}