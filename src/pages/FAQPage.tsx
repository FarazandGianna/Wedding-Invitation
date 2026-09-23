import { useState } from 'react'
import SubPageLayout from './SubPage'

export default function FAQPage() {
  return (
    <SubPageLayout>
      {({ pageSettings, faqItems }) => {
        const settings = pageSettings.find((ps) => ps.page_type === 'faq')

        return (
          <div>
            <p className="text-xs uppercase tracking-widest2 text-clay">FAQ</p>
            <h1 className="mt-4 font-serif text-4xl text-ink">
              {settings?.page_title || 'Frequently Asked Questions'}
            </h1>
            {settings?.page_subtitle && (
              <p className="mt-4 text-ink/70">{settings.page_subtitle}</p>
            )}

            {faqItems.length > 0 ? (
              <div className="mt-10 space-y-6">
                {faqItems.map((item) => (
                  <FAQEntry key={item.id} question={item.question} answer={item.answer} />
                ))}
              </div>
            ) : (
              <p className="mt-10 text-center text-sm text-ink/60">
                No questions yet. Check back soon.
              </p>
            )}
          </div>
        )
      }}
    </SubPageLayout>
  )
}

function FAQEntry({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-line/70">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-serif text-lg text-ink">{question}</span>
        <span className={`flex-shrink-0 text-clay transition-transform ${open ? 'rotate-45' : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 text-ink/70">
          {answer}
        </div>
      )}
    </div>
  )
}
