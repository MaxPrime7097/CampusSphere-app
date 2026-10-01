import React, { useId } from 'react';
import type { SupportedLanguage } from '../types.ts';

export interface FlagProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

/**
 * Drapeau de la République Française (Bleu, Blanc, Rouge)
 * Couleurs officielles : #002654, #FFFFFF, #CE1126
 */
export const FrenchFlag: React.FC<FlagProps> = ({
  className = 'w-4 h-3',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3 2"
      className={`inline-block shrink-0 rounded-[2px] shadow-[0_0_1px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden ${className}`}
      aria-label="Français"
      role="img"
      {...props}
    >
      <rect width="1" height="2" x="0" fill="#002654" />
      <rect width="1" height="2" x="1" fill="#FFFFFF" />
      <rect width="1" height="2" x="2" fill="#CE1126" />
    </svg>
  );
};

/**
 * Drapeau du Royaume-Uni / English (Union Jack officiel)
 * Tracé vectoriel précis sans distorsion avec clipPath dynamique isolé (useId).
 */
export const UkFlag: React.FC<FlagProps> = ({
  className = 'w-4 h-3',
  ...props
}) => {
  const rawId = useId();
  const idS = `cs-uk-s-${rawId.replace(/:/g, '')}`;
  const idT = `cs-uk-t-${rawId.replace(/:/g, '')}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 30"
      className={`inline-block shrink-0 rounded-[2px] shadow-[0_0_1px_rgba(0,0,0,0.4)] border border-white/10 overflow-hidden ${className}`}
      aria-label="English"
      role="img"
      {...props}
    >
      <defs>
        <clipPath id={idS}>
          <path d="M0,0 v30 h60 v-30 z" />
        </clipPath>
        <clipPath id={idT}>
          <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${idS})`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath={`url(#${idT})`}
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
};

export interface FlagIconProps extends FlagProps {
  code: SupportedLanguage | string;
}

/**
 * Composant universel de drapeau haute fidélité (résout le problème d'affichage sur Windows)
 */
export const FlagIcon: React.FC<FlagIconProps> = ({ code, className, ...props }) => {
  switch (code) {
    case 'fr':
      return <FrenchFlag className={className} {...props} />;
    case 'en':
      return <UkFlag className={className} {...props} />;
    default:
      return null;
  }
};
