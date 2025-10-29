import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
export function Header() {
  const navigate = useNavigate();
  return (
<nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/cs-inc')}>
            <img src="/CS.svg" alt="CampusSphere Logo" className="hidden md:w-10 h-10" />
            <span className="text-2xl font-bold font-automata campus-gradient bg-clip-text text-transparent">
              CampusSphere
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <a href="/cs-inc/about" className="text-muted-foreground hover:text-foreground transition-colors">À propos</a>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                Politiques
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/privacy')}>
                  Politique de Confidentialité
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/cs-inc/policies/terms')}>
                  Conditions d'Utilisation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <a href="/cs-inc/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
            <a href="/cs-inc/faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
            <a href="/login" className="text-muted-foreground hover:text-foreground transition-colors">Connexion</a>
            <button
              onClick={() => navigate('/register')}
              className="campus-gradient text-white hover:opacity-90 px-4 py-2 rounded-lg transition-all duration-300"
            >
              S'inscrire
            </button>
          </div>

          {/* Mobile menu placeholder */}
          <div className="sm:hidden">
            <button
              onClick={() => navigate('/register')}
              className="campus-gradient text-white hover:opacity-90 px-3 py-1.5 rounded-lg"
            >
              S'inscrire
            </button>
          </div>
        </div>
      </nav>
    );
}