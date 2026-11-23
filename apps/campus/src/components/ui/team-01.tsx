import React from "react";
import { motion } from "motion/react";
import {
  Envelope,
  GithubLogo,
  Globe,
  LinkedinLogo,
} from "@phosphor-icons/react";

export type TeamShape = "peanut" | "arch" | "oval" | "triple" | "leaf" | "pill";

export interface TeamMember {
  name: string;
  role: string;
  description?: string;
  image: string;
  initials: string;
  shape: TeamShape;
  accentBg?: string;
  socials: {
    website?: string;
    linkedin?: string;
    github?: string;
    email?: string;
  };
}

interface Team01Props {
  badge?: string;
  title?: string;
  highlight?: string;
  subtitle?: string;
  members: TeamMember[];
}

const CLIP_IDS: Record<TeamShape, string> = {
  peanut: "cs-team-clip-peanut",
  arch: "cs-team-clip-arch",
  oval: "cs-team-clip-oval",
  triple: "cs-team-clip-triple",
  leaf: "cs-team-clip-leaf",
  pill: "cs-team-clip-pill",
};

const TeamClipDefs = () => (
  <svg width="0" height="0" className="absolute pointer-events-none" aria-hidden="true">
    <defs>
      {/* 1. Double-pill / Peanut (comme carte 1 de team-01) */}
      <clipPath id={CLIP_IDS.peanut} clipPathUnits="objectBoundingBox">
        <path d="M 0.24,0 H 0.76 C 0.90,0 1,0.11 1,0.25 C 1,0.38 0.92,0.47 0.80,0.50 C 0.92,0.53 1,0.62 1,0.75 C 1,0.89 0.90,1 0.76,1 H 0.24 C 0.10,1 0,0.89 0,0.75 C 0,0.62 0.08,0.53 0.20,0.50 C 0.08,0.47 0,0.38 0,0.25 C 0,0.11 0.10,0 0.24,0 Z" />
      </clipPath>

      {/* 2. Arche éditoriale (comme carte 2 de team-01) */}
      <clipPath id={CLIP_IDS.arch} clipPathUnits="objectBoundingBox">
        <path d="M 0,0.45 C 0,0.18 0.22,0 0.50,0 C 0.78,0 1,0.18 1,0.45 V 0.92 C 1,0.97 0.96,1 0.91,1 H 0.09 C 0.04,1 0,0.97 0,0.92 Z" />
      </clipPath>

      {/* 3. Ovale / Cercle doux (comme carte 3 de team-01) */}
      <clipPath id={CLIP_IDS.oval} clipPathUnits="objectBoundingBox">
        <ellipse cx="0.5" cy="0.5" rx="0.5" ry="0.5" />
      </clipPath>

      {/* 4. Triple-pill / Nuage géométrique (comme carte 4 de team-01) */}
      <clipPath id={CLIP_IDS.triple} clipPathUnits="objectBoundingBox">
        <path d="M 0.18,0 H 0.82 C 0.93,0 1,0.07 1,0.165 C 1,0.245 0.94,0.305 0.85,0.333 C 0.94,0.36 1,0.42 1,0.50 C 1,0.58 0.94,0.64 0.85,0.667 C 0.94,0.695 1,0.755 1,0.835 C 1,0.93 0.93,1 0.82,1 H 0.18 C 0.07,1 0,0.93 0,0.835 C 0,0.755 0.06,0.695 0.15,0.667 C 0.06,0.64 0,0.58 0,0.50 C 0,0.42 0.06,0.36 0.15,0.333 C 0.06,0.305 0,0.245 0,0.165 C 0,0.07 0.07,0 0.18,0 Z" />
      </clipPath>

      {/* 5. Feuille / Squircle asymétrique */}
      <clipPath id={CLIP_IDS.leaf} clipPathUnits="objectBoundingBox">
        <path d="M 0.44,0 H 0.88 C 0.95,0 1,0.05 1,0.12 V 0.56 C 1,0.82 0.82,1 0.56,1 H 0.12 C 0.05,1 0,0.95 0,0.88 V 0.44 C 0,0.18 0.18,0 0.44,0 Z" />
      </clipPath>

      {/* 6. Arche inversée / Fenêtre douce */}
      <clipPath id={CLIP_IDS.pill} clipPathUnits="objectBoundingBox">
        <path d="M 0.10,0 H 0.90 C 0.96,0 1,0.04 1,0.10 V 0.55 C 1,0.82 0.78,1 0.50,1 C 0.22,1 0,0.82 0,0.55 V 0.10 C 0,0.04 0.04,0 0.10,0 Z" />
      </clipPath>
    </defs>
  </svg>
);

export function Team01({
  title = "Les esprits étudiants",
  highlight = "derrière CampusSphere.",
  subtitle = "Une équipe 100 % étudiante qui conçoit, teste et fait grandir la plateforme au plus près des campus.",
  members,
}: Team01Props) {
  return (
    <div className="relative">
      <TeamClipDefs />

      <motion.div
        initial={{ y: -24, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.65, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="max-w-2xl mx-auto flex flex-col items-center justify-center text-center gap-3 mb-12 md:mb-16"
      >
        <h2 className="pub-h2 text-center">
          {title}
          {highlight && (
            <>
              <br />
              <em>{highlight}</em>
            </>
          )}
        </h2>
        {subtitle && <p className="pub-lede text-center max-w-xl">{subtitle}</p>}
      </motion.div>

      <div className="flex flex-wrap justify-center gap-x-8 gap-y-12">
        {members.map((member, index) => (
          <motion.article
            key={member.name}
            initial={{ y: 32, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              duration: 0.65,
              delay: index * 0.08,
              ease: [0.21, 0.47, 0.32, 0.98],
            }}
            className="group flex flex-col items-center text-center w-full sm:w-[calc(50%-16px)] lg:w-[calc(33.333%-22px)] max-w-[300px]"
          >
            {/* Portrait découpé dans une forme géométrique organique */}
            <div className="relative w-[228px] h-[252px] mb-5">
              <div
                className="relative w-full h-full overflow-hidden transition-transform duration-300 group-hover:-translate-y-1.5"
                style={{
                  clipPath: `url(#${CLIP_IDS[member.shape]})`,
                  WebkitClipPath: `url(#${CLIP_IDS[member.shape]})`,
                  backgroundColor: member.accentBg ?? "#fff3e0",
                }}
              >
                <img
                  src={member.image}
                  alt={member.name}
                  loading="lazy"
                  className="w-full h-full object-cover object-top transition-all duration-300 group-hover:grayscale group-hover:scale-[1.03]"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                    if (fallback) fallback.classList.remove("hidden");
                  }}
                />
                <div className="hidden absolute inset-0 flex items-center justify-center text-3xl font-bold font-poppins text-[#ff9800]">
                  {member.initials}
                </div>
              </div>
            </div>

            {/* Nom, rôle et réseaux */}
            <h3 className="font-poppins text-xl font-bold text-[#18181b] tracking-tight mb-1">
              {member.name}
            </h3>
            <p
              className={`font-poppins text-xs font-semibold uppercase tracking-[0.08em] text-[#e65100] ${
                member.description ? "mb-2.5" : "mb-4"
              }`}
            >
              {member.role}
            </p>
            {member.description && (
              <p className="font-nunito text-sm text-[#52525b] leading-relaxed mb-4 max-w-[280px]">
                {member.description}
              </p>
            )}

            <div className="flex items-center justify-center gap-2 mt-auto">
              {member.socials.website && (
                <a
                  href={member.socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Site web de ${member.name}`}
                  className="w-9 h-9 rounded-full bg-white border border-black/10 text-[#52525b] hover:text-[#ff9800] hover:border-[#ff9800]/45 hover:bg-[#fff7ed] flex items-center justify-center transition-all"
                >
                  <Globe size={17} weight="duotone" aria-hidden="true" />
                </a>
              )}
              {member.socials.linkedin && (
                <a
                  href={member.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`LinkedIn de ${member.name}`}
                  className="w-9 h-9 rounded-full bg-white border border-black/10 text-[#52525b] hover:text-[#ff9800] hover:border-[#ff9800]/45 hover:bg-[#fff7ed] flex items-center justify-center transition-all"
                >
                  <LinkedinLogo size={17} weight="duotone" aria-hidden="true" />
                </a>
              )}
              {member.socials.github && (
                <a
                  href={member.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`GitHub de ${member.name}`}
                  className="w-9 h-9 rounded-full bg-white border border-black/10 text-[#52525b] hover:text-[#ff9800] hover:border-[#ff9800]/45 hover:bg-[#fff7ed] flex items-center justify-center transition-all"
                >
                  <GithubLogo size={17} weight="duotone" aria-hidden="true" />
                </a>
              )}
              {member.socials.email && (
                <a
                  href={member.socials.email}
                  aria-label={`Envoyer un email à ${member.name}`}
                  className="w-9 h-9 rounded-full bg-white border border-black/10 text-[#52525b] hover:text-[#ff9800] hover:border-[#ff9800]/45 hover:bg-[#fff7ed] flex items-center justify-center transition-all"
                >
                  <Envelope size={17} weight="duotone" aria-hidden="true" />
                </a>
              )}
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}

export default Team01;
