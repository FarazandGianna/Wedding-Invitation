import type { RegistryItem } from '../types/invitation'

interface Props {
  items: RegistryItem[]
}

export default function Registry({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section id="registry" className="mx-auto max-w-2xl px-6 py-20 text-center sm:py-28">
      <p className="text-xs uppercase tracking-widest2 text-clay">Wedding Registry</p>
      <h2 className="mt-4 font-serif text-3xl text-ink">Gifts &amp; Wishes</h2>
      <p className="mt-3 text-sm text-ink/60">
        Your presence is the greatest gift. If you would like to give something more, here are our registries.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="animate-fade-up flex flex-col items-center border border-line/30 bg-paperDeep/40 px-6 py-8 text-center"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title}
                className="mb-5 h-32 w-full object-cover"
                loading="lazy"
              />
            )}
            <h3 className="font-serif text-xl text-ink">{item.title}</h3>
            {item.description && (
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                {item.description}
              </p>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex min-h-11 items-center justify-center border border-ink/20 px-8 py-3 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              {item.button_label || 'View registry'}
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
