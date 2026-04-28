import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import { ToastContainer } from './components/UI'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GeneratePage from './pages/GeneratePage'
import GalleryPage from './pages/GalleryPage'
import SharePage from './pages/SharePage'

function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  )
}

export default function App() {
  const fetchMe = useAuthStore(s => s.fetchMe)
  useEffect(() => { fetchMe() }, [fetchMe])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/share/:token" element={<SharePage />} />
        <Route path="/generate" element={<ProtectedRoute><Layout><GeneratePage /></Layout></ProtectedRoute>} />
        <Route path="/gallery" element={<ProtectedRoute><Layout><GalleryPage /></Layout></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/generate" replace />} />
        <Route path="*" element={<Navigate to="/generate" replace />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
