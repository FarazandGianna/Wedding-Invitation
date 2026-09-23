import { Navigate, Route, Routes } from 'react-router-dom'
import InvitationPage from './pages/InvitationPage'
import NotFoundPage from './pages/NotFound'

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
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
