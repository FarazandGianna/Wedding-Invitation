import { useState, type FormEvent, type ReactNode } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Invitation } from '../types/invitation'
import { hasErrors, sanitizeText, validateRsvp, type RsvpFormValues } from '../utils/validate'

type Phase = 'form' | 'submitting' | 'success' | 'error'

const initialValues: RsvpFormValues = {
  fullName: '',
  phone: '',
  attendance: '',
  guestCount: 1,
  message: ''
}

export default function RSVPForm({ invitation }: { invitation: Invitation }) {
  const [values, setValues] = useState<RsvpFormValues>(initialValues)
  const [errors, setErrors] = useState<ReturnType<typeof validateRsvp>>({})
  const [phase, setPhase] = useState<Phase>('form')
  const [serverError, setServerError] = useState<string | null>(null)

  const deadlinePassed = Boolean(invitation.rsvp_deadline && new Date(invitation.rsvp_deadline) < new Date())
  const closed = !invitation.rsvp_enabled || deadlinePassed

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (phase === 'submitting') return // guards against double-tap submissions

    const validation = validateRsvp(values, invitation.max_guests_per_rsvp)
    setErrors(validation)
    if (hasErrors(validation)) return

    setPhase('submitting')
    setServerError(null)

    const { error } = await supabase.rpc('submit_rsvp', {
      p_invitation_slug: invitation.slug,
      p_full_name: sanitizeText(values.fullName),
      p_phone: values.phone ? sanitizeText(values.phone) : null,
      p_attendance_status: values.attendance,
      p_guest_count: values.attendance === 'attending' ? values.guestCount : null,
      p_message: values.message ? sanitizeText(values.message) : null
    })

    if (error) {
      const code = error.message || ''
      if (code.includes('RSVP_CLOSED')) setServerError('RSVP has closed — the deadline has passed.')
      else if (code.includes('RSVP_DISABLED')) setServerError('RSVP is not currently open for this invitation.')
      else if (code.includes('INVITATION_NOT_FOUND')) setServerError('This invitation could not be found.')
      else setServerError('Something went wrong submitting your RSVP. Please try again.')
      setPhase('error')
      return
    }

    setPhase('success')
  }

  if (closed) {
    return (
      <section id="rsvp" className="mx-auto max-w-md px-6 py-20 text-center sm:py-28">
        <p className="text-xs uppercase tracking-widest2 text-clay">RSVP</p>
        <h2 className="mt-4 font-serif text-3xl text-ink">RSVP is closed</h2>
        <p className="mt-3 text-ink/70">
          {deadlinePassed
            ? "The RSVP deadline has passed. If you'd still like to reach out, please contact us directly."
            : 'RSVP is not currently open for this invitation.'}
        </p>
      </section>
    )
  }

  if (phase === 'success') {
    return (
      <section id="rsvp" className="mx-auto max-w-md px-6 py-20 text-center sm:py-28 animate-fade">
        <p className="text-xs uppercase tracking-widest2 text-clay">RSVP</p>
        <h2 className="mt-4 font-serif text-3xl text-ink">Thank you!</h2>
        <p className="mt-3 text-ink/70">
          {values.attendance === 'attending'
            ? "We've received your RSVP and can't wait to celebrate with you."
            : "We've received your response. You'll be missed!"}
        </p>
      </section>
    )
  }

  return (
    <section id="rsvp" className="mx-auto max-w-md px-6 py-20 sm:py-28">
      <p className="text-center text-xs uppercase tracking-widest2 text-clay">RSVP</p>
      <h2 className="mt-4 text-center font-serif text-3xl text-ink">Will you join us?</h2>

      <form className="mt-10 space-y-6" onSubmit={handleSubmit} noValidate>
        <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            value={values.fullName}
            onChange={(e) => setValues((v) => ({ ...v, fullName: e.target.value }))}
            className={inputClass(Boolean(errors.fullName))}
          />
        </Field>

        <Field label="Phone (optional)" htmlFor="phone" error={errors.phone}>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
            className={inputClass(Boolean(errors.phone))}
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-xs uppercase tracking-widest2 text-clay">Will you attend?</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <AttendanceOption
              label="Yes, I'll be there"
              selected={values.attendance === 'attending'}
              onClick={() => setValues((v) => ({ ...v, attendance: 'attending' }))}
            />
            <AttendanceOption
              label="Sorry, I can't attend"
              selected={values.attendance === 'not_attending'}
              onClick={() => setValues((v) => ({ ...v, attendance: 'not_attending', guestCount: 1 }))}
            />
          </div>
          {errors.attendance && <p role="alert" className="mt-2 text-xs text-rose-300">{errors.attendance}</p>}
        </fieldset>

        {values.attendance === 'attending' && (
          <Field label="Number of guests (including you)" htmlFor="guestCount" error={errors.guestCount}>
            <select
              id="guestCount"
              value={values.guestCount}
              onChange={(e) => setValues((v) => ({ ...v, guestCount: Number(e.target.value) }))}
              className={inputClass(Boolean(errors.guestCount))}
            >
              {Array.from({ length: invitation.max_guests_per_rsvp }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Message (optional)" htmlFor="message" error={errors.message}>
          <textarea
            id="message"
            rows={3}
            value={values.message}
            onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
            className={inputClass(Boolean(errors.message))}
          />
        </Field>

        {phase === 'error' && serverError && (
          <p role="alert" className="text-sm text-rose-300">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={phase === 'submitting'}
          className="min-h-11 w-full border border-ink bg-ink px-8 py-3 text-xs uppercase tracking-widest2 text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {phase === 'submitting' ? 'Sending…' : 'Send RSVP'}
        </button>
      </form>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  error,
  children
}: {
  label: string
  htmlFor: string
  error?: string
  children: ReactNode
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-xs uppercase tracking-widest2 text-clay">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-rose-300">
          {error}
        </p>
      )}
    </div>
  )
}

function AttendanceOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-11 border px-4 py-3 text-sm transition-colors ${
        selected ? 'border-ink bg-ink text-paper' : 'border-ink/20 text-ink hover:border-ink/40'
      }`}
    >
      {label}
    </button>
  )
}

function inputClass(hasError: boolean) {
  return `w-full min-h-11 border bg-transparent px-4 py-3 text-ink outline-none transition-colors ${
    hasError ? 'border-rose-400' : 'border-ink/20 focus:border-ink/50'
  }`
}
