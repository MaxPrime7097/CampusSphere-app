import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from "@phosphor-icons/react";

interface LeaderboardProps {
  entries: { displayName: string; score: number; userId?: number }[];
  highlightUserId?: number;
}

export function Leaderboard({ entries, highlightUserId }: LeaderboardProps) {
  const { t } = useTranslation('live');
  const sorted = [...entries].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">
      <div className="text-center mb-4">
        <h2 className="text-3xl font-live font-bold text-white flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          {t('leaderboard.title')}
        </h2>
      </div>

      <div className="flex flex-col gap-3">
        {sorted.map((entry, idx) => {
          const isHighlighted = highlightUserId && entry.userId === highlightUserId;
          let rankBadge = (
            <div className="w-8 h-8 rounded-full bg-sphera-surface border border-sphera-border flex items-center justify-center text-sphera-text font-bold text-sm">
              {idx + 1}
            </div>
          );

          if (idx === 0) {
            rankBadge = (
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 border border-yellow-500 flex items-center justify-center text-yellow-500 font-bold text-sm">
                1
              </div>
            );
          } else if (idx === 1) {
            rankBadge = (
              <div className="w-8 h-8 rounded-full bg-gray-400/20 border border-gray-400 flex items-center justify-center text-gray-300 font-bold text-sm">
                2
              </div>
            );
          } else if (idx === 2) {
            rankBadge = (
              <div className="w-8 h-8 rounded-full bg-orange-700/20 border border-orange-700 flex items-center justify-center text-orange-500 font-bold text-sm">
                3
              </div>
            );
          }

          let containerClass = "flex items-center justify-between p-4 rounded-xl border bg-sphera-surface-2 transition-all";
          if (isHighlighted) {
            containerClass += " border-sphera-green bg-sphera-green/10";
          } else {
            containerClass += " border-sphera-border";
          }

          return (
            <div key={idx} className={containerClass}>
              <div className="flex items-center gap-4">
                {rankBadge}
                <span className={`font-medium text-lg ${isHighlighted ? 'text-white font-bold' : 'text-sphera-text'}`}>
                  {entry.displayName} {isHighlighted && t('leaderboard.you')}
                </span>
              </div>
              <div className="text-sphera-green font-bold text-xl">
                {entry.score} <span className="text-sm font-normal text-sphera-text-muted">{t('leaderboard.pts')}</span>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="text-center p-8 text-sphera-text-muted bg-sphera-surface rounded-xl border border-sphera-border">
            {t('leaderboard.empty')}
          </div>
        )}
      </div>
    </div>
  );
}
