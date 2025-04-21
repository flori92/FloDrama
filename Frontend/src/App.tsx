import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import Layout from './components/Layout'
import Home from './pages/Home'
import Search from './pages/Search'
import Profile from './pages/Profile'
import './styles/globals.css'
import { Toaster } from 'react-hot-toast'

const App: React.FC = () => {
  return (
    <>
      <Toaster position="top-right" />
      <ThemeProvider defaultTheme="dark" storageKey="flodrama-theme">
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Layout>
      </ThemeProvider>
    </>
  )
}

export default App 