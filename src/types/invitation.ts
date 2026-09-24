export type SectionKey =
  | 'hero'
  | 'couple'
  | 'message'
  | 'countdown'
  | 'details'
  | 'venue'
  | 'gallery'
  | 'itinerary'
  | 'rsvp'
  | 'registry'
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
  tagline: string | null
  font_style: 'cursive' | 'serif'
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
  image_url?: string | null
  alt_text: string | null
  title: string | null
  content_type: string | null
  sort_order: number
}

export interface AdminRsvpRow {
  id: string
  full_name: string
  phone: string | null
  attendance_status: 'attending' | 'not_attending'
  guest_count: number | null
  coming_from: string | null
  message: string | null
  submitted_at: string
  updated_at: string
}

export interface AdminSummary {
  attending_parties: number
  declined_parties: number
  total_guests: number
  rsvp_enabled: boolean
  rsvp_deadline: string | null
}

export type AttendanceStatus = 'attending' | 'not_attending'

export interface RsvpSubmission {
  full_name: string
  phone: string
  attendance_status: AttendanceStatus
  guest_count: number | null
  coming_from: string | null
  message: string
}

export interface WeddingEvent {
  id: string
  invitation_id: string
  title: string
  description: string | null
  event_date: string | null // YYYY-MM-DD
  event_time: string | null // HH:MM:SS
  timezone: string
  venue_name: string | null
  venue_address: string | null
  map_url: string | null
  dress_code: string | null
  sort_order: number
}

export interface RegistryItem {
  id: string
  invitation_id: string
  title: string
  description: string | null
  url: string
  button_label: string
  image_url: string | null
  sort_order: number
}

export interface AdminWeddingEvent {
  id: string
  title: string
  description: string | null
  event_date: string | null
  event_time: string | null
  timezone: string
  venue_name: string | null
  venue_address: string | null
  map_url: string | null
  dress_code: string | null
  sort_order: number
}

export interface AdminRegistryItem {
  id: string
  title: string
  description: string | null
  url: string
  button_label: string
  image_url: string | null
  sort_order: number
}

export interface PageSettings {
  id: string
  page_type: 'details' | 'venue' | 'faq' | 'gallery'
  button_label: string | null
  page_title: string | null
  page_subtitle: string | null
  is_enabled: boolean
  sort_order: number
}

export interface PageItem {
  id: string
  page_type: 'details' | 'venue' | 'gallery'
  label: string
  value: string
  sort_order: number
}

export interface FaqItem {
  id: string
  question: string
  answer: string
  sort_order: number
}

export interface AdminPageItem {
  id: string
  page_type: string
  label: string
  value: string
  sort_order: number
}

export interface AdminFaqItem {
  id: string
  question: string
  answer: string
  sort_order: number
}
