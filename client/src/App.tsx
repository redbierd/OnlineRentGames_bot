import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import AdminRoute from './components/AdminRoute'
import TermsScreen from './components/TermsScreen'
import SubmitAccountWizard from './components/SubmitAccountWizard'
import { needsAcceptance } from './utils/terms'
import { trackOpen, trackPageVisit, trackTime } from './utils/activity'
import HomePage from './pages/HomePage'
import GamesPage from './pages/GamesPage'
import MyRentalsPage from './pages/MyRentalsPage'
import ProfilePage from './pages/ProfilePage'
import AccountsPage from './pages/AccountsPage'
import RentPage from './pages/RentPage'
import RentalDetailPage from './pages/RentalDetailPage'
import MyListingsPage from './pages/MyListingsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminUserDetail from './pages/admin/AdminUserDetail'
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminRentals from './pages/admin/AdminRentals'
import AdminGames from './pages/admin/AdminGames'
import AdminModeration from './pages/admin/AdminModeration'
import AdminListingDetail from './pages/admin/AdminListingDetail'
import AdminRentalRequests from './pages/admin/AdminRentalRequests'

function ActivityTracker() {
  const location = useLocation()
  useEffect(() => {
    trackOpen()
    const interval = setInterval(trackTime, 30000)
    window.addEventListener('beforeunload', trackTime)
    return () => { clearInterval(interval); window.removeEventListener('beforeunload', trackTime) }
  }, [])
  useEffect(() => { trackPageVisit(location.pathname) }, [location.pathname])
  return null
}

export default function App() {
  const [termsAccepted, setTermsAccepted] = useState(!needsAcceptance())

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp
    tg?.ready()
    tg?.expand()
  }, [])

  if (!termsAccepted) {
    return <TermsScreen onAccept={() => setTermsAccepted(true)} />
  }

  return (
    <>
      <ActivityTracker />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/games" element={<GamesPage />} />
        <Route path="/rentals" element={<MyRentalsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/game/:slug" element={<AccountsPage />} />
        <Route path="/rent/:accountId" element={<RentPage />} />
        <Route path="/rental/:orderId" element={<RentalDetailPage />} />
        <Route path="/submit-account" element={<SubmitAccountWizard />} />
        <Route path="/my-listings" element={<MyListingsPage />} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
        <Route path="/admin/accounts" element={<AdminRoute><AdminAccounts /></AdminRoute>} />
        <Route path="/admin/rentals" element={<AdminRoute><AdminRentals /></AdminRoute>} />
        <Route path="/admin/games" element={<AdminRoute><AdminGames /></AdminRoute>} />
        <Route path="/admin/moderation" element={<AdminRoute><AdminModeration /></AdminRoute>} />
        <Route path="/admin/moderation/:listingId" element={<AdminRoute><AdminListingDetail /></AdminRoute>} />
        <Route path="/admin/rental-requests" element={<AdminRoute><AdminRentalRequests /></AdminRoute>} />
      </Routes>
      <BottomNav />
    </>
  )
}
