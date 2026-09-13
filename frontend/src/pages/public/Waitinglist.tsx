import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function Waitinglist(): JSX.Element {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    newsletter: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log("Form submitted:", formData);
    // You can add form submission logic here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <Helmet>
        <title>Rejoindre la Liste d'Attente Campus | CampusSphere</title>
        <meta name="description" content="Inscrivez votre université ou école sur la liste d'attente CampusSphere et soyez prévenu en priorité dès l'ouverture sur votre campus." />
        <link rel="canonical" href="https://campussphere.app/cs-inc/waitlist" />
        <meta property="og:title" content="Liste d'Attente - CampusSphere" />
        <meta property="og:description" content="Rejoignez la liste d'attente pour accélérer l'arrivée de CampusSphere dans votre établissement." />
        <meta property="og:url" content="https://campussphere.app/cs-inc/waitlist" />
      </Helmet>
      {/* Navigation: brand + links + CTA */}
      <Header />

      {/* Hero Section */}
      <section id="waitlist" className="waitlist-section">
        <iframe 
          src="https://tally.so/embed/Y5D9Gz" 
          width="100%" 
          height="1000" 
          title="CampusSphere Waitlist">
        </iframe>
    </section>

      {/* Footer */}
      <Footer/>
    </div>
  );
}
