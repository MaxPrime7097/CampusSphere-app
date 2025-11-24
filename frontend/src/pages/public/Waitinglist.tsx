import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Clock, Send, Sparkles, Heart, CheckCircle, ChevronDown} from "lucide-react";
import { FaFacebook, FaInstagram, FaLinkedin, FaTiktok } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

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
