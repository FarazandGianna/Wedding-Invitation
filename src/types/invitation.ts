export type SectionKey =
  | 'hero'
  | 'couple'
  | 'message'
  | 'countdown'
  | 'details'
  | 'venue'
  | 'gallery'
  | 'rsvp'
  | 'contact'
  | 'footer'

export interface Invitation {
  id: string
  slug: string
  is_published: boolean
  bride_name: string
  groom_name: string
  invitation_title: string | null
  invitation_message: string | null
  wedding_date: string // YYYY-MM-DD
  wedding_time: string | null // HH:MM:SS
  timezone: string
  venue_name: string | null
  venue_address: string | null
  map_url: string | null
  contact_name: string | null
  contact_phone: string | null
  rsvp_enabled: boolean
  rsvp_deadline: string | null // ISO timestamp
  max_guests_per_rsvp: number
  og_image_url: string | null
}

export interface InvitationSection {
  id: string
  invitation_id: string
  section_key: SectionKey
  is_enabled: boolean
  sort_order: number
}

export interface GalleryItem {
  id: string
  invitation_id: string
  storage_path: string
  alt_text: string | null
  sort_order: number
}

export type AttendanceStatus = 'attending' | 'not_attending'

export interface RsvpSubmission {
  full_name: string
  phone: string
  attendance_status: AttendanceStatus
  guest_count: number | null
  message: string
}
