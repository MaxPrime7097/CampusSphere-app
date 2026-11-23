import React from 'react'
import { useTranslation } from 'react-i18next'
import * as Accordion from '@radix-ui/react-accordion'
import { CaretDown } from '@phosphor-icons/react'
import { Reveal } from '../public/SpheraMotion'

export function FAQ() {
  const { t } = useTranslation('landing')

  const faqs = [
    { question: t('faq.q1'), answer: t('faq.a1') },
    { question: t('faq.q2'), answer: t('faq.a2') },
    { question: t('faq.q3'), answer: t('faq.a3') },
    { question: t('faq.q4'), answer: t('faq.a4') },
    { question: t('faq.q5'), answer: t('faq.a5') },
    { question: t('faq.q6'), answer: t('faq.a6') },
    { question: t('faq.q7'), answer: t('faq.a7') },
    { question: t('faq.q8'), answer: t('faq.a8') },
  ]

  return (
    <section className="py-20 md:py-28 border-t border-sphera-border/70 bg-sphera-bg relative" id="faq">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Sticky Header */}
          <Reveal className="lg:col-span-4 lg:sticky lg:top-24">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-sphera-green mb-3">
              {t('faq.eyebrow')}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-white mb-4">
              {t('faq.title')}
            </h2>
            <p className="text-sm sm:text-base text-sphera-text-muted leading-relaxed mb-6">
              {t('faq.subtitle')}
            </p>
            <p className="text-xs text-sphera-text-muted">
              {t('faq.contactPrompt')}{' '}
              <a
                href="mailto:support@campussphere.app"
                className="text-sphera-green font-medium hover:underline"
              >
                support@campussphere.app
              </a>
            </p>
          </Reveal>

          {/* Right Accordion */}
          <Reveal delay={100} className="lg:col-span-8">
            <Accordion.Root type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <Accordion.Item
                  key={index}
                  value={`item-${index}`}
                  className="bg-sphera-surface border border-sphera-border rounded-2xl overflow-hidden transition-colors duration-200 hover:border-sphera-green/40 data-[state=open]:border-sphera-green/50"
                >
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex flex-1 items-center justify-between gap-4 py-5 px-6 text-left group">
                      <span className="font-display font-semibold text-sm sm:text-base text-white group-hover:text-sphera-green transition-colors">
                        {faq.question}
                      </span>
                      <CaretDown
                        className="w-4 h-4 text-sphera-text-muted shrink-0 transition-transform duration-300 ease-out group-data-[state=open]:rotate-180 group-data-[state=open]:text-sphera-green"
                        aria-hidden
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content className="overflow-hidden text-sphera-text-muted text-sm leading-relaxed data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <div className="px-6 pb-5 pt-0.5">{faq.answer}</div>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
