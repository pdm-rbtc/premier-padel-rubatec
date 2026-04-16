import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import BracketPage from './pages/BracketPage.jsx'
import MatchDetail from './pages/MatchDetail.jsx'
import PlayerPortal from './pages/PlayerPortal.jsx'
import AdminDashboard from './pages/admin/Dashboard.jsx'
import ManageCouples from './pages/admin/ManageCouples.jsx'
import ManageMatches from './pages/admin/ManageMatches.jsx'
import ManageBrackets from './pages/admin/ManageBrackets.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<PlayerPortal />} />
        <Route path="/torneo" element={<Home />} />
        <Route path="/bracket/:division" element={<BracketPage />} />
        <Route path="/match/:id" element={<MatchDetail />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/couples" element={<ManageCouples />} />
        <Route path="/admin/matches" element={<ManageMatches />} />
        <Route path="/admin/brackets" element={<ManageBrackets />} />
      </Route>
    </Routes>
  )
}
