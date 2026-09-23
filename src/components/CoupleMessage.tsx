import type { Invitation } from '../types/invitation'

export default function CoupleMessage({ invitation }: { invitation: Invitation }) {
  if (!invitation.invitation_message) return null

  const nameFont = invitation.font_style === 'serif' ? 'font-serif' : 'font-script'
  const raw = invitation.invitation_message

  // Try to split off the sign-off: "With all our love, <names>"
  const signOffMatch = raw.match(/(.+?)\s*(With all our love,?)\s*$/is)
  let bodyText = raw
  let signOff = ''
  let names = ''
  if (signOffMatch) {
    bodyText = signOffMatch[1].trim()
    signOff = signOffMatch[2].trim()
  } else {
    // Try to find names at the end after "With all our love,"
    const altMatch = raw.match(/(.+?)\n+\s*With all our love,?\s*\n+\s*(.+)$/is)
    if (altMatch) {
      bodyText = altMatch[1].trim()
      signOff = 'With all our love,'
      names = altMatch[2].trim()
    }
  }

  // If no sign-off found, check for the names pattern at the end
  if (!signOff && !names) {
    const endMatch = raw.match(/(.+?)\n+\s*(With all our love,?)\s*\n+\s*(.+)$/is)
    if (endMatch) {
      bodyText = endMatch[1].trim()
      signOff = endMatch[2].trim()
      names = endMatch[3].trim()
    }
  }

  return (
    <section id="message" className="mx-auto max-w-3xl px-6 py-10 text-center sm:py-12">
      <p className="font-serif text-lg leading-8 text-ink/90 sm:text-xl sm:leading-9">
        {bodyText}
      </p>
      {signOff && (
        <p className="mt-6 font-serif text-lg text-ink/80 sm:text-xl">
          {signOff}
        </p>
      )}
      {names && (
        <p className={`mt-1 text-2xl text-ink sm:text-3xl ${nameFont}`}>
          {names}
        </p>
      )}
      {!signOff && !names && (
        <div className="mx-auto mt-8 h-px w-12 bg-line" />
      )}
      {(signOff || names) && (
        <div className="mx-auto mt-8 h-px w-12 bg-line" />
      )}
    </section>
  )
}
