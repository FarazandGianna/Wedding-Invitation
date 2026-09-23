import type { Invitation } from '../types/invitation'

export default function CoupleMessage({ invitation }: { invitation: Invitation }) {
  if (!invitation.invitation_message) return null

  return (
    <section id="message" className="mx-auto max-w-3xl px-6 py-20 text-center sm:py-28">
      <p className="font-serif text-lg leading-8 text-ink/90 sm:text-xl sm:leading-9">
        {invitation.invitation_message}
      </p>
      <div className="mx-auto mt-8 h-px w-12 bg-line" />
    </section>
  )
}
