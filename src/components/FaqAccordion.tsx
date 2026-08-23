'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  return (
    <div
      style={{
        maxWidth: '840px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      {faqs.map((faq, idx) => {
        const isOpen = faqOpen === idx;
        const buttonId = `faq-trigger-${idx}`;
        const panelId = `faq-panel-${idx}`;

        return (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              border: '1.5px solid var(--border-cream)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              transition: 'var(--transition)',
              boxShadow: isOpen ? 'var(--shadow-sm)' : 'var(--shadow-xs)',
            }}
          >
            <button
              id={buttonId}
              onClick={() => setFaqOpen(isOpen ? null : idx)}
              aria-expanded={isOpen}
              aria-controls={panelId}
              style={{
                width: '100%',
                padding: '22px 26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                textAlign: 'left',
                fontWeight: 700,
                fontSize: '1.08rem',
                color: 'var(--brand-forest-900)',
                minHeight: '48px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <HelpCircle size={22} color="var(--gold-700)" style={{ flexShrink: 0 }} aria-hidden="true" />
                {faq.q}
              </span>
              <ChevronDown
                size={22}
                aria-hidden="true"
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.25s ease',
                  flexShrink: 0,
                  color: 'var(--brand-forest-700)',
                }}
              />
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                style={{
                  padding: '0 26px 24px 60px',
                  fontSize: '1rem',
                  color: 'var(--text-body)',
                  lineHeight: 1.7,
                  borderTop: '1px solid var(--border-cream-light)',
                  paddingTop: '18px',
                }}
              >
                {faq.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
