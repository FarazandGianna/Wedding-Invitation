import { useNavigate } from 'react-router-dom'

interface NavItem {
  label: string
  // route: navigate to this path; targetId: scroll to this section id
  route?: string
  targetId?: string
}

interface Props {
  items: NavItem[]
  onNavigate?: (targetId: string) => void
  slug?: string
}

export default function Nav({ items, onNavigate, slug }: Props) {
  const navigate = useNavigate()

  if (items.length === 0) return null

  function handleNavigate(item: NavItem) {
    if (item.route && slug) {
      navigate(`/invite/${slug}/${item.route}`)
    } else if (item.targetId) {
      if (onNavigate) {
        onNavigate(item.targetId)
      } else {
        document.getElementById(item.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }

  return (
    <nav
      className="sticky top-0 z-30 flex justify-center gap-1 overflow-x-auto border-b border-line/70 bg-paper/90 px-2 backdrop-blur"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      aria-label="Invitation sections"
    >
      {/* Buttons + programmatic scrolling instead of #anchor links: with
          HashRouter the URL hash IS the route, so plain #section anchors
          would be treated as navigation and hit the not-found page. */}
      <div className="flex gap-4 py-3 sm:gap-8">
        {items.map((item) => (
          <button
            key={item.route ?? item.targetId ?? item.label}
            type="button"
            onClick={() => handleNavigate(item)}
            className="whitespace-nowrap py-1 text-[11px] uppercase tracking-widest2 text-clay transition-colors hover:text-ink"
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
