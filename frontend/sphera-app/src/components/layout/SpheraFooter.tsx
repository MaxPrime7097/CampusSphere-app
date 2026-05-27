import React from 'react'
import { Link } from 'react-router-dom'

export function SpheraFooter() {
  return (
    <footer className="border-t border-sphera-border bg-sphera-bg py-8 mt-auto">
      <div className="container mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-col items-center md:items-start gap-1">
          <Link to="/" className="flex items-center gap-2">
            <img src="/sphera-logo-dark.png" alt="Sphera logo" className="h-6 w-auto" />
            <span className="font-display font-bold text-lg text-white">Sphera</span>
          </Link>
          <p className="text-sm text-sphera-text-muted mt-2">Upload. Revise. Succeed.</p>
        </div>

        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 md:gap-6 text-sm text-sphera-text-muted">
          <Link to="/#faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link to="/pricing" className="hover:text-white transition-colors">Tarifs</Link>
          <Link to="/blogs" className="hover:text-white transition-colors">Blog</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Confidentialité</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Conditions</Link>
        </div>

        <div className="flex items-center gap-2 text-sm text-sphera-text-muted">
          <span>Powered by</span>
          <a href="https://campussphere.app" target="_blank" rel="noopener noreferrer" className="font-semibold text-white hover:text-cs-orange transition-colors">
            CampusSphere
          </a>
        </div>
      </div>
    </footer>
  )
}
