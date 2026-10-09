import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { List as Menu, X } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";

export function PublicMenu(): JSX.Element {
  const navigate = useNavigate(); 
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation('navigation');

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={isOpen ? t('close', { defaultValue: 'Fermer le menu' }) : t('openMenu', { defaultValue: 'Ouvrir le menu de navigation' })}
          className="h-10 w-10 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border/60 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-200 rotate-0" />
          ) : (
            <Menu className="h-6 w-6 transition-transform duration-200" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="font-nunito font-semibold w-56 mt-2" align="end">
        <DropdownMenuItem 
          onClick={() => handleNavigate("/cs-inc/about")}
          className="cursor-pointer"
        >
          <span>{t('about', { defaultValue: 'À propos' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleNavigate("/cs-inc/contact")}
          className="cursor-pointer"
        >
          <span>{t('contact', { defaultValue: 'Contact' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleNavigate("/cs-inc/faq")}
          className="cursor-pointer"
        >
          <span>{t('faq', { defaultValue: 'FAQ' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleNavigate("/cs-inc/policies")}
          className="cursor-pointer"
        >
          <span>{t('policies', { defaultValue: 'Politiques' })}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem 
          onClick={() => handleNavigate("/register")}
          className="cursor-pointer"
        >
          <span className="text-primary font-bold">{t('joinCommunity', { defaultValue: 'Rejoindre la communauté' })}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleNavigate("/login")}
          className="cursor-pointer"
        >
          <span className="text-foreground font-bold">{t('login', { defaultValue: 'Connexion' })}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
