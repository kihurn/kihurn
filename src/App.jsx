import React from 'react'
import { AuthProvider } from './context/AuthContext'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { Home } from './pages/Home'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Navbar />
        <Home />
        <Footer />
      </div>
    </AuthProvider>
  )
}
