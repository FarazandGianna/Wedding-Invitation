import type { RegistryItem } from '../types/invitation'

interface Props {
  items: RegistryItem[]
}

/**
 * Registry content — designed to be rendered inside a Modal.
 * Renders the grid of registry links.
 */
export default function Registry({ items }: Props) {
  if (items.length === 0) return null

  return (
    <div className="grid gap-5 sm:grid-cols-2">
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
  )
}
