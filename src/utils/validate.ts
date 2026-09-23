export interface RsvpFormValues {
  fullName: string
  phone: string
  attendance: 'attending' | 'not_attending' | ''
  guestCount: number
  message: string
}

export interface RsvpFormErrors {
  fullName?: string
  phone?: string
  attendance?: string
  guestCount?: string
  message?: string
}

// Strips characters that have no place in a name/message field and could be
// used for basic script/HTML injection. Real protection against injection
// is that we never render this as raw HTML — React escapes it by default —
// but stripping angle brackets here keeps stored data clean too.
export function sanitizeText(value: string): string {
  return value.replace(/[<>]/g, '').trim()
}

export function validateRsvp(values: RsvpFormValues, maxGuests: number): RsvpFormErrors {
  const errors: RsvpFormErrors = {}

  const name = sanitizeText(values.fullName)
  if (!name) errors.fullName = 'Please enter your name.'
  else if (name.length > 100) errors.fullName = 'That name is too long.'

  if (values.phone) {
    const phone = sanitizeText(values.phone)
    if (phone.length > 30) errors.phone = 'That phone number looks too long.'
    else if (!/^[0-9+\-()\s]{5,30}$/.test(phone)) errors.phone = 'Please enter a valid phone number.'
  }

  if (values.attendance !== 'attending' && values.attendance !== 'not_attending') {
    errors.attendance = 'Please let us know if you can make it.'
  }

  if (values.attendance === 'attending') {
    if (!values.guestCount || values.guestCount < 1) {
      errors.guestCount = 'Please select at least 1 guest.'
    } else if (values.guestCount > maxGuests) {
      errors.guestCount = `Please keep it to ${maxGuests} guests or fewer.`
    }
  }

  if (values.message && sanitizeText(values.message).length > 500) {
    errors.message = 'Message is too long (500 characters max).'
  }

  return errors
}

export function hasErrors(errors: RsvpFormErrors): boolean {
  return Object.keys(errors).length > 0
}
