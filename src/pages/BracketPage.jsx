import { Navigate, useParams } from 'react-router-dom'
import { DIVISIONS } from '../lib/divisions.js'

// /bracket/:division redirects to the unified tournament page with the correct tab.
export default function BracketPage() {
  const { division } = useParams()
  if (!DIVISIONS.includes(division)) return <Navigate to="/" replace />
  return <Navigate to={`/?div=${division}`} replace />
}
