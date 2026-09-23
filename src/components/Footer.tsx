import { useEffect, useState } from 'react'
import type { Invitation } from '../types/invitation'

export default function Footer({ invitation }: { invitation: Invitation }) {
  const [copied, setCopied] = useState(false)

  // Reset the "Copied!" feedback a few seconds after it appears.
  useEffect(() => {
    if (!copied) return
    const t = window.setTimeout(() => setCopied(false), 2500)
    return () => window.clearTimeout(t)
  }, [copied])

  async function share() {
    const shareData = {
      title: `${invitation.bride_name} & ${invitation.groom_name}`,
      text: invitation.invitation_title || 'You are invited to our wedding.',
      url: window.location.href
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled — no-op
      }
      return
    }
    // Clipboard API needs a secure context; on plain http (e.g. LAN testing)
    // fall back to a hidden textarea + execCommand so the button still works.
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(shareData.url)
      setCopied(true)
      return
    }
    const textarea = document.createElement('textarea')
    textarea.value = shareData.url
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      setCopied(true)
    } catch {
      // Last resort: nothing else to try; silently give up.
    }
    textarea.remove()
  }

  return (
    <footer id="footer" className="border-t border-line/70 px-6 py-14 text-center">
      <p className="font-display italic text-lg text-ink/70">
        {invitation.bride_name} &amp; {invitation.groom_name}
      </p>
      <button
        onClick={share}
        className="mt-6 min-h-11 border border-ink/20 px-6 py-2.5 text-xs uppercase tracking-widest2 text-ink transition-colors hover:bg-ink hover:text-paper"
      >
        {copied ? 'Link copied!' : 'Share Invitation'}
      </button>
    </footer>
  )
}
