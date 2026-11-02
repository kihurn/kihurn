import React from 'react'

export function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <a href="#home" className="navbar-brand">
          <span className="brand-dot"></span>
          <span>Ki Hurn</span>
        </a>
        <nav className="navbar-nav">
          <a href="#about" className="nav-link">About</a>
          <a href="#projects" className="nav-link">Projects</a>
          <a href="#skills" className="nav-link">Skills</a>
          <a href="#contact" className="nav-link">Contact</a>
        </nav>
      </div>
    </header>
  )
}
