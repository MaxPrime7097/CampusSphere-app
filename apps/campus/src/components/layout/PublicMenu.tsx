import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpRight, List as Menu, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export function PublicMenu(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('navigation');

  const isLanding = location.pathname === '/' || location.pathname === '/cs';

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  const handleSection = (sectionId: string, fallbackPath: string) => {
    setIsOpen(false);
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={
            isOpen
              ? t('close', { defaultValue: 'Fermer le menu' })
              : t('openMenu', { defaultValue: 'Ouvrir le menu de navigation' })
          }
          className="h-10 w-10 inline-flex items-center justify-center rounded-full text-zinc-200 hover:text-white hover:bg-white/10 border border-white/15 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff9800]/50"
        >
          {isOpen ? (
            <X size={20} weight="bold" aria-hidden="true" />
          ) : (
            <Menu size={20} weight="bold" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="cs-pub-font font-semibold w-64 mt-2 p-2 rounded-2xl bg-[#111114] border border-white/10 text-zinc-100 shadow-2xl"
        align="end"
      >
        <DropdownMenuItem
          onClick={() => handleSection("produit", "/cs#produit")}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
        >
          <span>{t('features', { defaultValue: 'Fonctionnalités' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleSection("sphera", "/sphera")}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
        >
          <span>Sphera</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleNavigate("/cs/about")}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
        >
          <span>{t('about', { defaultValue: 'À propos' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleNavigate("/cs/faq")}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
        >
          <span>{t('faq', { defaultValue: 'FAQ' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleNavigate("/cs/contact")}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
        >
          <span>{t('contact', { defaultValue: 'Contact' })}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2 bg-white/10" />
        <DropdownMenuItem
          onClick={() => handleNavigate("/login")}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-zinc-200 focus:bg-white/10 focus:text-white"
        >
          <span>{t('login', { defaultValue: 'Connexion' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleNavigate("/register")}
          className="cursor-pointer mt-1 rounded-full px-4 py-2.5 bg-[#ff9800] text-white font-poppins font-semibold justify-center gap-1.5 focus:bg-[#f57c00] focus:text-white"
        >
          <span>{t('joinCommunity', { defaultValue: 'Rejoindre CampusSphere' })}</span>
          <ArrowUpRight size={15} weight="duotone" aria-hidden="true" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
