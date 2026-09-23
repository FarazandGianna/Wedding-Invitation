interface NavItem {
  label: string
  href: string
}

export default function Nav({ items }: { items: NavItem[] }) {
  if (items.length === 0) return null

  return (
    <nav
      className="sticky top-0 z-30 flex justify-center gap-1 overflow-x-auto border-b border-line/70 bg-paper/90 px-2 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      aria-label="Invitation sections"
    >
      <div className="flex gap-4 py-3 sm:gap-8">
        {items.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="whitespace-nowrap text-[11px] uppercase tracking-widest2 text-clay transition-colors hover:text-ink"
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  )
}
