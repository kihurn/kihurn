import React from 'react'
import { Button } from '../components/ui/Button'

export function Home() {
  const isSupabaseConfigured = Boolean(
    import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  )

  return (
    <main className="main-content">
      {/* Hero Section */}
      <section id="home" className="hero-section">
        <div className="badge-pill">
          <span className="badge-indicator"></span>
          Ready to build
        </div>

        <h1 className="hero-title">
          Hi, I'm <span className="gradient-text">Ki Hurn</span>
        </h1>
        <p className="hero-subtitle">
          Welcome to your new portfolio workspace. Cleanly scaffolded with React,
          configured for Supabase backend integration, and ready for continuous Vercel deployment.
        </p>

        <div className="hero-actions">
          <a href="#setup">
            <Button variant="primary">Getting Started</Button>
          </a>
          <a
            href="https://github.com/kihurn/kihurn"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary">GitHub Repo</Button>
          </a>
        </div>
      </section>

      {/* Stack & Readiness Status */}
      <section id="setup" className="cards-grid">
        <div className="card">
          <div className="card-header">
            <span className="card-tag">Frontend</span>
            <span className="card-status status-active">Active</span>
          </div>
          <h3>React + Vite</h3>
          <p>
            Fast modern React environment with HMR, component structure in <code>src/components/</code>, and alias support.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-tag">Backend & Auth</span>
            <span className={`card-status ${isSupabaseConfigured ? 'status-active' : 'status-pending'}`}>
              {isSupabaseConfigured ? 'Connected' : 'Config Ready (.env)'}
            </span>
          </div>
          <h3>Supabase</h3>
          <p>
            Client initialized in <code>src/lib/supabase.js</code> with built-in AuthContext and API service layer.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-tag">Deployment</span>
            <span className="card-status status-active">Configured</span>
          </div>
          <h3>Vercel</h3>
          <p>
            SPA rewrites and production build configured via <code>vercel.json</code>. Just connect the GitHub repo.
          </p>
        </div>
      </section>

      {/* Structure Guide Section */}
      <section className="guide-section">
        <h2>Architecture & Next Steps</h2>
        <div className="guide-box">
          <ul>
            <li><strong>Add your credentials:</strong> Copy <code>.env.example</code> to <code>.env</code> and paste your Supabase URL & Anon Key.</li>
            <li><strong>Components:</strong> Place UI components in <code>src/components/</code> and page views in <code>src/pages/</code>.</li>
            <li><strong>Data queries:</strong> Use <code>src/services/api.js</code> or import <code>supabase</code> from <code>src/lib/supabase</code>.</li>
            <li><strong>Styling:</strong> Tailor <code>src/index.css</code> or add your preferred CSS framework.</li>
          </ul>
        </div>
      </section>
    </main>
  )
}
