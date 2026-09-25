import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage.ts';

export interface LanguageSwitcherProps {
  variant?: 'dropdown' | 'toggle' | 'minimal';
  className?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
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
        className={`inline-flex items-center p-0.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm ${className}`}
        role="group"
        aria-label="Language selector"
      >
        {supportedLanguages.map((lang) => {
          const isActive = lang.code === currentLanguage;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => changeLanguage(lang.code)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                isActive
                  ? 'bg-sphera-green/20 text-sphera-green border border-sphera-green/30 shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:text-white hover:bg-white/10 transition-colors border border-transparent hover:border-white/10 ${className}`}
        title={`Changer de langue (actuel : ${activeOption.label})`}
      >
        {showIcon && <Globe className="w-3.5 h-3.5 text-zinc-400" />}
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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/60 shadow-xs hover:border-zinc-600 transition-colors focus:outline-none focus:ring-1 focus:ring-sphera-green/40"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {showIcon && <Globe className="w-3.5 h-3.5 text-zinc-400" />}
        {showLabel ? (
          <span>{activeOption.label}</span>
        ) : (
          <span className="font-semibold uppercase">{activeOption.code}</span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1.5 w-36 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl shadow-black/40 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
            Langue / Language
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === currentLanguage;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-sphera-green/10 text-sphera-green font-semibold'
                    : 'text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                }`}
                role="menuitem"
              >
                <span>{lang.nativeName}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-sphera-green" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
