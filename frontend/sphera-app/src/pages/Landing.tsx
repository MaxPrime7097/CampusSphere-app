import React from 'react'
import { SpheraHeader } from '../components/layout/SpheraHeader'
import { SpheraFooter } from '../components/layout/SpheraFooter'
import { Hero } from '../components/landing/Hero'
import { HowItWorks } from '../components/landing/HowItWorks'
import { Features } from '../components/landing/Features'
import { CampusSphereSection } from '../components/landing/CampusSphereSection'
import { SocialProof } from '../components/landing/SocialProof'
import { FAQ } from '../components/landing/FAQ'

export default function Landing() {
  return (
    <div className="flex flex-col min-h-screen bg-sphera-bg font-sans selection:bg-sphera-green/30">
      <SpheraHeader />
      
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <CampusSphereSection />
        <SocialProof />
        <FAQ />
      </main>

      <SpheraFooter />
    </div>
  )
}

