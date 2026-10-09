import React, { useState, useRef, useEffect } from 'react';
import { Globe, CaretDown as ChevronDown, Check } from "@phosphor-icons/react";
import { useLanguage } from '../hooks/useLanguage.ts';

export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'minimal';
  theme?: 'auto' | 'dark';
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  theme = 'auto',
  className = '',
  showIcon = true,
  showLabel = true,
}) => {
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption =
    supportedLanguages.find((lang) => lang.code === currentLanguage) || supportedLanguages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Variant 1: Toggle pastilles (FR | EN) — épuré et ultra-rapide
  if (variant === 'toggle') {
    const containerClasses =
      theme === 'dark'
        ? 'bg-white/5 border-white/10'
        : 'bg-muted/60 border-border/60';

    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-lg border backdrop-blur-sm ${containerClasses} ${className}`}
        role="group"
        aria-label="Language selector"
      >
        {supportedLanguages.map((lang) => {
          const isActive = lang.code === currentLanguage;
          const activeClasses =
            theme === 'dark'
              ? 'bg-sphera-green/20 text-sphera-green border-sphera-green/30'
              : 'bg-primary/15 text-primary border-primary/30';

          const inactiveClasses =
            theme === 'dark'
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/60 border-transparent';

          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                isActive ? `${activeClasses} shadow-xs` : inactiveClasses
              }`}
            >
              {lang.code.toUpperCase()}
            </button>
          );
        })}
      </div>
    );
  }

  // Variant 2: Minimal bouton switch
  if (variant === 'minimal') {
    const buttonClasses =
      theme === 'dark'
        ? 'text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/10'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60 hover:border-border/60';

    return (
      <button
        type="button"
        onClick={() => {
          const currentIndex = supportedLanguages.findIndex((l) => l.code === currentLanguage);
          const nextIndex = (currentIndex + 1) % supportedLanguages.length;
          changeLanguage(supportedLanguages[nextIndex].code);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border border-transparent ${buttonClasses} ${className}`}
        title={`Changer de langue (actuel : ${activeOption.label})`}
      >
        {showIcon && <Globe className="w-3.5 h-3.5 opacity-70" />}
        <span className="font-semibold uppercase">{activeOption.code}</span>
      </button>
    );
  }

  // Variant 3: Default Dropdown élégant
  const buttonStyle =
    theme === 'dark'
      ? 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border-zinc-700/60 hover:border-zinc-600 focus:ring-sphera-green/40'
      : 'bg-background/80 hover:bg-muted/80 text-foreground border-border/80 hover:border-border focus:ring-primary/40';

  const menuStyle =
    theme === 'dark'
      ? 'bg-zinc-900 border-zinc-800 shadow-black/40'
      : 'bg-popover border-border shadow-black/10';

  const menuHeaderStyle =
    theme === 'dark'
      ? 'text-zinc-400 border-zinc-800'
      : 'text-muted-foreground border-border/60';

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-xs transition-colors focus:outline-none focus:ring-1 ${buttonStyle}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {showIcon && <Globe className="w-3.5 h-3.5 opacity-70" />}
        {showLabel ? (
          <span>{activeOption.label}</span>
        ) : (
          <span className="font-semibold uppercase">{activeOption.code}</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 mt-1.5 w-36 rounded-xl border shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 ${menuStyle}`}
          role="menu"
        >
          <div className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-b ${menuHeaderStyle}`}>
            Langue / Language
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            const itemClasses = isSelected
              ? theme === 'dark'
                ? 'bg-sphera-green/10 text-sphera-green font-semibold'
                : 'bg-primary/10 text-primary font-semibold'
              : theme === 'dark'
                ? 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground';

            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${itemClasses}`}
                role="menuitem"
              >
                <span>{lang.nativeName}</span>
                {isSelected && (
                  <Check
                    className={`w-3.5 h-3.5 ${
                      theme === 'dark' ? 'text-sphera-green' : 'text-primary'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
