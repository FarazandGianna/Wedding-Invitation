import type { Invitation } from '../types/invitation'

/**
 * Updates document title + Open Graph / Twitter meta tags so links shared
 * in WhatsApp/social apps show a proper preview. Runs client-side; for a
 * crawler-perfect preview on a static host, a prerender/SSR step could be
 * added later, but this covers the common WhatsApp/iMessage/Slack unfurlers
 * that execute JS or read tags set shortly after load.
 */
export function applyInvitationMeta(invitation: Invitation) {
  const title = `${invitation.bride_name} & ${invitation.groom_name}`
  const description =
    invitation.invitation_title ||
    `Join us as we celebrate the wedding of ${invitation.bride_name} and ${invitation.groom_name}.`

  document.title = title

  // Absolute page URL so unfurlers can resolve the canonical share target.
  const pageUrl = window.location.href.split('#')[0]
  // Default share image: the FG-monogram card rendered at build time.
  const defaultOgImage = new URL('og-image.png', document.baseURI).href
  setMeta('description', description)
  setMeta('og:title', title, true)
  setMeta('og:description', description, true)
  setMeta('og:type', 'website', true)
  setMeta('og:url', pageUrl, true)
  setMeta('og:image', invitation.og_image_url || defaultOgImage, true)
  setMeta('twitter:card', 'summary_large_image', true)
  setMeta('twitter:title', title, true)
  setMeta('twitter:description', description, true)
}

function setMeta(name: string, content: string, isProperty = false) {
  const attr = isProperty ? 'property' : 'name'
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}
