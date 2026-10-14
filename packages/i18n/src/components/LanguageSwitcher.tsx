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
    return (
      <div
        className={`inline-flex items-center p-0.5 rounded-lg border border-zinc-800 bg-zinc-900/70 backdrop-blur-sm ${className}`}
        role="group"
        aria-label="Language selector"
      >
        {supportedLanguages.map((lang) => {
          const isActive = lang.code === currentLanguage;
          const activeClasses = 'bg-sphera-green/20 text-sphera-green border-sphera-green/30 shadow-xs';
          const inactiveClasses = 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent';

          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                isActive ? activeClasses : inactiveClasses
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
    return (
      <button
        type="button"
        onClick={() => {
          const currentIndex = supportedLanguages.findIndex((l) => l.code === currentLanguage);
          const nextIndex = (currentIndex + 1) % supportedLanguages.length;
          changeLanguage(supportedLanguages[nextIndex].code);
        }}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/5 border border-transparent hover:border-zinc-800 transition-colors ${className}`}
        title={`Changer de langue (actuel : ${activeOption.label})`}
      >
        {showIcon && <Globe className="w-3.5 h-3.5 opacity-70" />}
        <span className="font-semibold uppercase">{activeOption.code}</span>
      </button>
    );
  }

  // Variant 3: Default Dropdown élégant
  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-800 hover:border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-sphera-green/40 shadow-xs"
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
          className="absolute right-0 mt-1.5 w-36 rounded-xl border border-zinc-800 bg-[#161618] shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider border-b border-zinc-800 text-zinc-400">
            Langue / Language
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            const itemClasses = isSelected
              ? 'bg-sphera-green/10 text-sphera-green font-semibold'
              : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white';

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
                  <Check className="w-3.5 h-3.5 text-sphera-green" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
