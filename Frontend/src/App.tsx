import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Profile from './pages/Profile'
import AppDownload from './pages/AppDownload'
import WatchParty from './pages/WatchParty'
import About from './pages/About'
import Contact from './pages/Contact'
import Careers from './pages/Careers'
import Faq from './pages/Faq'
import Support from './pages/Support'
import Terms from './pages/Terms'
import CategoryPage from './pages/CategoryPage'
import ContentDetailPage from './pages/ContentDetailPage'
import './styles/globals.css'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <AuthProvider>
        <ThemeProvider defaultTheme="dark" storageKey="flodrama-theme">
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/app" element={<AppDownload />} />
              <Route path="/watchparty" element={<WatchParty />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/faq" element={<Faq />} />
              <Route path="/support" element={<Support />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/category/:categoryName" element={<CategoryPage />} />
              <Route path="/content/:id" element={<ContentDetailPage />} />
            </Routes>
          </Layout>
        </ThemeProvider>
      </AuthProvider>
    </>
  )
}

export default App 