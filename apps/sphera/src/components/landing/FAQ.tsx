import React from 'react';
import { useTranslation } from 'react-i18next';
import * as Accordion from '@radix-ui/react-accordion';
import { CaretDown as ChevronDown } from "@phosphor-icons/react";

export function FAQ() {
  const { t } = useTranslation('landing');

  const faqs = [
    {
      question: t('faq.q1'),
      answer: t('faq.a1')
    },
    {
      question: t('faq.q2'),
      answer: t('faq.a2')
    },
    {
      question: t('faq.q3'),
      answer: t('faq.a3')
    },
    {
      question: t('faq.q4'),
      answer: t('faq.a4')
    },
    {
      question: t('faq.q5'),
      answer: t('faq.a5')
    },
    {
      question: t('faq.q6'),
      answer: t('faq.a6')
    },
    {
      question: t('faq.q7'),
      answer: t('faq.a7')
    },
    {
      question: t('faq.q8'),
      answer: t('faq.a8')
    }
  ];

  return (
    <section className="py-24 bg-sphera-bg relative overflow-hidden" id="faq">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-sphera-green/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
            {t('faq.title')}
          </h2>
          <p className="text-xl text-sphera-text-muted">
            {t('faq.subtitle')}
          </p>
        </div>

        <Accordion.Root type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <Accordion.Item
              key={index}
              value={`item-${index}`}
              className="bg-sphera-surface border border-sphera-border rounded-xl overflow-hidden transition-all duration-300 hover:border-sphera-green/50 data-[state=open]:border-sphera-green/50 data-[state=open]:shadow-[0_0_20px_rgba(34,197,94,0.1)]"
            >
              <Accordion.Header className="flex">
                <Accordion.Trigger className="flex flex-1 items-center justify-between py-5 px-6 text-left group">
                  <span className="font-semibold text-white group-hover:text-sphera-green transition-colors">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className="w-5 h-5 text-sphera-text-muted transition-transform duration-300 ease-[cubic-bezier(0.87,_0,_0.13,_1)] group-data-[state=open]:rotate-180 group-data-[state=open]:text-sphera-green"
                    aria-hidden
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden text-sphera-text-muted text-sm md:text-base data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
                <div className="px-6 pb-5 leading-relaxed opacity-90">
                  {faq.answer}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
