import { Navigate, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/AdminPage'
import DetailsPage from './pages/DetailsPage'
import FAQPage from './pages/FAQPage'
import GalleryPage from './pages/GalleryPage'
import InvitationPage from './pages/InvitationPage'
import NotFoundPage from './pages/NotFound'
import VenuePage from './pages/VenuePage'

// Single-wedding deployments can set VITE_DEFAULT_INVITE_SLUG so "/" opens
// the invitation directly; multi-wedding deployments just use /invite/<slug>.
const DEFAULT_SLUG = import.meta.env.VITE_DEFAULT_INVITE_SLUG as string | undefined

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={DEFAULT_SLUG ? <Navigate to={`/invite/${DEFAULT_SLUG}`} replace /> : <Navigate to="/invite/sample-wedding" replace />}
      />
      <Route path="/invite/:slug" element={<InvitationPage />} />
      <Route path="/invite/:slug/details" element={<DetailsPage />} />
      <Route path="/invite/:slug/venue" element={<VenuePage />} />
      <Route path="/invite/:slug/faq" element={<FAQPage />} />
      <Route path="/invite/:slug/gallery" element={<GalleryPage />} />
      {/* Admin-only guest manager (passcode-gated at the RPC level). */}
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
