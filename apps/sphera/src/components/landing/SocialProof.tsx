import React from 'react'
import { useTranslation } from 'react-i18next'

export function SocialProof() {
  const { t } = useTranslation('landing')

  const testimonials = [
    {
      text: t('socialProof.testimonials.marc.text'),
      author: t('socialProof.testimonials.marc.author'),
      role: t('socialProof.testimonials.marc.role')
    },
    {
      text: t('socialProof.testimonials.ines.text'),
      author: t('socialProof.testimonials.ines.author'),
      role: t('socialProof.testimonials.ines.role')
    },
    {
      text: t('socialProof.testimonials.sarah.text'),
      author: t('socialProof.testimonials.sarah.author'),
      role: t('socialProof.testimonials.sarah.role')
    },
    {
      text: t('socialProof.testimonials.kevin.text'),
      author: t('socialProof.testimonials.kevin.author'),
      role: t('socialProof.testimonials.kevin.role')
    }
  ]

  return (
    <section className="py-24 bg-sphera-surface relative overflow-hidden border-t border-sphera-border">
      <div className="container mx-auto max-w-5xl px-4 text-center">
        
        <div className="inline-flex flex-col items-center mb-12">
          <h2 className="font-display text-3xl font-bold text-white mb-4">
            {t('socialProof.title')}
          </h2>
          <p className="text-sphera-text-muted text-lg">
            {t('socialProof.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">12K+</div>
            <div className="text-sm text-sphera-text-muted">{t('socialProof.statSessions')}</div>
          </div>
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">4.8/5</div>
            <div className="text-sm text-sphera-text-muted">{t('socialProof.statRating')}</div>
          </div>
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">50+</div>
            <div className="text-sm text-sphera-text-muted">{t('socialProof.statFields')}</div>
          </div>
          <div className="p-6 rounded-2xl bg-sphera-bg border border-sphera-border text-center">
            <div className="font-display text-3xl font-bold text-sphera-green mb-1">30s</div>
            <div className="text-sm text-sphera-text-muted">{t('socialProof.statSpeed')}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {testimonials.map((quote, idx) => (
            <div 
              key={idx} 
              className="p-6 rounded-2xl bg-sphera-surface-2 border border-sphera-border hover:border-sphera-green/40 transition-all relative group"
            >
              <div className="text-4xl text-sphera-green/20 absolute top-4 right-4 font-serif">"</div>
              <p className="text-white text-sm leading-relaxed mb-6 relative z-10">"{quote.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-sphera-border group-hover:border-sphera-green/40 transition-colors flex items-center justify-center text-xs font-bold text-white">
                  {quote.author[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{quote.author}</div>
                  <div className="text-xs text-sphera-text-muted">{quote.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
