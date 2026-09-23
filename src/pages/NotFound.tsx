import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-6 text-center">
      <p className="text-xs uppercase tracking-widest2 text-clay">404</p>
      <h1 className="mt-4 font-serif text-3xl text-ink">Invitation not found</h1>
      <p className="mt-3 max-w-sm text-ink/70">
        This invitation link doesn't match one we recognize. Please double-check the link you were sent.
      </p>
      <Link to="/" className="mt-8 text-xs uppercase tracking-widest2 text-clay underline underline-offset-4">
        Go home
      </Link>
    </div>
  )
}
