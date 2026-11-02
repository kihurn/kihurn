import React from 'react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <p>© {currentYear} Ki Hurn. All rights reserved.</p>
        <p className="footer-built">
          Built with React &bull; Supabase &bull; Deployed on Vercel
        </p>
      </div>
    </footer>
  )
}
