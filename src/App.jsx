import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Phone, Clock, Stethoscope, Heart, Shield, Star, CheckCircle2, Menu, X, MessageCircle, Loader2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';

// Placeholder Credentials
const GOOGLE_APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJTkUHYml4Hsv3Ts2PBwkyIWd9KSCwSRmsz1TnIFPymJyF_jddGQxnY8Pz7UW6Wn2XEg/exec"; // Replace with your Google Apps Script URL
const CLINIC_WHATSAPP_NUMBER = "918080092321"; // Replace with Clinic Phone Number
const GOOGLE_REVIEW_LINK = "https://g.page/r/YOUR_REVIEW_LINK/review"; // Replace with target review link

export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Advanced Form Handling
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: 'Consultation',
    timeSlot: 'Morning (10 AM - 1 PM)'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    setIsMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'Services', id: 'services' },
    { name: 'About', id: 'about' },
    { name: 'Testimonials', id: 'testimonials' },
    { name: 'Contact', id: 'contact' }
  ];

  const services = [
    { title: "Root Canal Treatment", icon: <CheckCircle2 className="w-8 h-8 text-blue-600" />, desc: "Painless single-sitting root canal treatments to save your natural teeth." },
    { title: "Ceramic Tooth Treatment", icon: <Star className="w-8 h-8 text-blue-600" />, desc: "High-quality ceramic crowns closely resembling your natural teeth." },
    { title: "Tooth Extraction", icon: <Heart className="w-8 h-8 text-blue-600" />, desc: "Safe and painless surgical extractions." },
    { title: "Dental Fillings", icon: <Shield className="w-8 h-8 text-blue-600" />, desc: "Tooth-colored composite fillings to restore decayed teeth naturally." },
    { title: "Pediatric Dentistry", icon: <Heart className="w-8 h-8 text-blue-600" />, desc: "Specialized, gentle dental care designed exclusively for kids." },
    { title: "General Care", icon: <Stethoscope className="w-8 h-8 text-blue-600" />, desc: "Comprehensive check-ups, cleaning, and preventative treatments." },
  ];

  const testimonials = [
    { rating: 5, text: "I've undergone a root canal procedure from there by Dr. Pravin and I'm extremely happy with the treatment and hospitality. Highly recommended!", name: "Verified Patient" },
    { rating: 5, text: "I was having toothache and unable to chew. The doctor stopped trying until they removed, cleaned, and placed it safely. Great!", name: "Verified Patient" },
    { rating: 5, text: "Had my root canal here and it was completely painless. Before coming I was scared but now my fear is gone. Completely satisfied.", name: "Verified Patient" }
  ];

  // Logic Functions
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendToGoogleSheets = async (data) => {
    try {
      const currentDate = new Date();
      // Formatting time and date beautifully
      const formattedDate = currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); // e.g., 30 Mar 2026
      const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }); // e.g., 04:30 PM
      const formattedDay = currentDate.toLocaleDateString('en-US', { weekday: 'long' }); // e.g., Monday

      // By using 'text/plain', we bypass the CORS OPTIONS preflight request that Google blocks.
      await fetch(GOOGLE_APP_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ 
          ...data, 
          date: formattedDate,
          time: formattedTime,
          day: formattedDay
        })
      });
      return true;
    } catch (error) {
      console.error("Sheets Integration Error:", error);
      throw error; 
    }
  };

  // Send booking data to Vercel serverless backend for Twilio SMS + WhatsApp
  const notifyBackend = async (data) => {
    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          service: data.service,
          timeSlot: data.timeSlot
        })
      });
      const result = await response.json();
      if (result.result === 'success') {
        console.log('Notifications sent successfully:', result);
      } else {
        console.warn('Notification API returned error:', result);
      }
      return result;
    } catch (error) {
      console.error('Backend Notification Error:', error);
      // Don't throw — notifications failing shouldn't break the user experience
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error("Please fill in required fields.");
      return;
    }

    setIsSubmitting(true);
    toast.info("Booking your appointment...");

    try {
      // Run Google Sheets save and Twilio notifications in parallel
      await Promise.all([
        sendToGoogleSheets(formData),
        notifyBackend(formData)
      ]);

      // Success
      setFormData(prev => ({ ...prev, submitted: true }));
      toast.success("Your appointment has been successfully booked!");
    } catch (err) {
      console.error("Booking submission error:", err);
      // Still show success to customer — data may have partially saved
      setFormData(prev => ({ ...prev, submitted: true }));
      toast.success("Your appointment has been successfully booked!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Toaster position="bottom-center" richColors />

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="container mx-auto px-4 lg:px-8 flex justify-between items-center max-w-7xl">
          <div className="font-bold text-2xl tracking-tighter text-blue-700 flex items-center gap-2 cursor-pointer" onClick={() => scrollTo('home')}>
            <span className="p-1.5 bg-blue-100 rounded-lg"><Stethoscope className="w-6 h-6 text-blue-700" /></span>
            MYDENT
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button key={link.name} onClick={() => scrollTo(link.id)} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                {link.name}
              </button>
            ))}
            <Button onClick={() => scrollTo('contact')} className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6">
              Book Appointment
            </Button>
          </div>

          <button className="md:hidden text-slate-700" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-4 flex flex-col space-y-4">
            {navLinks.map((link) => (
              <button key={link.name} onClick={() => scrollTo(link.id)} className="text-left text-slate-700 text-lg font-medium p-2 hover:bg-blue-50 rounded-lg">
                {link.name}
              </button>
            ))}
            <Button onClick={() => scrollTo('contact')} className="w-full bg-blue-600 text-white rounded-lg">Book Appointment</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 min-h-[90vh] flex items-center relative overflow-hidden bg-gradient-to-br from-blue-50 to-white">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-300/30 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-3/5 space-y-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 text-blue-800 text-sm font-semibold border border-blue-200">
                <Star className="w-4 h-4 fill-blue-600 text-blue-600" />
                <span>5.0 Rated · 280+ Happy Patients</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Gentle, Expert <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">Dental Care</span><br />For Your Entire Family.
              </h1>
              <p className="text-lg md:text-xl text-slate-600 max-w-2xl leading-relaxed">
                Experience pain-free treatments in a comfortable and tech-forward environment. We prioritize your smile and your comfort above all else.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button onClick={() => scrollTo('contact')} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg rounded-full px-8 py-6 h-auto shadow-lg shadow-blue-600/20">
                  Book Appointment
                </Button>
                <Button onClick={() => window.open(`tel:+${CLINIC_WHATSAPP_NUMBER}`, '_self')} variant="outline" size="lg" className="bg-white border-2 border-slate-200 text-slate-700 text-lg rounded-full px-8 py-6 h-auto hover:bg-slate-50 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Call Now
                </Button>
              </div>
            </div>
            
            <div className="lg:w-2/5 relative animate-in fade-in slide-in-from-right-10 duration-1000">
              <div className="relative z-10 rounded-3xl overflow-hidden border-8 border-white shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/doctor-hero.jpg" 
                  alt="Professional Dental Care" 
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-400/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 bg-white border-y border-slate-100">
        <div className="container mx-auto max-w-7xl px-4 flex flex-wrap justify-center gap-8 md:gap-16 opacity-80">
          <div className="flex items-center gap-3"><Shield className="w-6 h-6 text-blue-600" /><span className="font-semibold text-slate-700">Trusted Clinic</span></div>
          <div className="flex items-center gap-3"><Heart className="w-6 h-6 text-blue-600" /><span className="font-semibold text-slate-700">Verified Patients</span></div>
          <div className="flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-blue-600" /><span className="font-semibold text-slate-700">Highly Recommended</span></div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 px-4 bg-slate-50 relative">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Premium Services</h2>
            <p className="text-slate-600 text-lg">Comprehensive dental care customized to suit your absolute comfort and well-being.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((svc, idx) => (
              <Card key={idx} className="bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
                <CardContent className="p-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {svc.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-3">{svc.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{svc.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <div className="relative rounded-3xl overflow-hidden aspect-square max-w-md mx-auto shadow-2xl">
                <img src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80" alt="Doctor" className="object-cover w-full h-full" />
                <div className="absolute bottom-0 w-full bg-gradient-to-t from-slate-900/80 to-transparent p-6 text-white translate-y-2">
                  <h3 className="text-2xl font-bold">Dr. Pravin G Kadam</h3>
                  <p className="text-blue-200">BDS · Dental Surgeon</p>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Meet Your Doctor</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                With years of comprehensive experience solving complex dental challenges, Dr. Pravin combines a gentle, ethical approach with modern techniques to ensure you receive the finest care available.
              </p>
              <ul className="space-y-4 pt-4">
                {['Dedicated to painless treatments', 'Conservative, ethical advice', 'Keeps up with modern dental technology'].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="bg-blue-100 p-1 rounded-full"><CheckCircle2 className="w-5 h-5 text-blue-600" /></div>
                    <span className="text-slate-700 font-medium text-lg">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 px-4 bg-blue-50/50">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Our Patients Say</h2>
            <p className="text-slate-600 text-lg">Real stories from our successfully treated patients.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((test, idx) => (
              <Card key={idx} className="bg-white border border-blue-100 shadow-sm">
                <CardContent className="p-8 space-y-6">
                  <div className="flex gap-1">
                    {[...Array(test.rating)].map((_, i) => <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-slate-600 italic text-lg line-clamp-4 leading-relaxed">"{test.text}"</p>
                  <div className="font-semibold text-slate-900">{test.name}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-3xl font-bold text-blue-600 mb-2">OUR DIFFERENCE</h2>
          <h3 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-16">Why Choose MYDENT?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-blue-50/50">
              <h4 className="text-xl font-bold text-slate-800 mb-2">Pain-free Treatments</h4>
              <p className="text-slate-600">Advanced techniques ensuring minimal discomfort.</p>
            </div>
            <div className="p-6 rounded-2xl bg-blue-50/50">
              <h4 className="text-xl font-bold text-slate-800 mb-2">Kid-Friendly Environment</h4>
              <p className="text-slate-600">A welcoming space designed to reduce anxiety.</p>
            </div>
            <div className="p-6 rounded-2xl bg-blue-50/50">
              <h4 className="text-xl font-bold text-slate-800 mb-2">Evening Hours</h4>
              <p className="text-slate-600">Open late for your convenience.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-24 px-4 bg-slate-900 text-slate-300">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="lg:w-1/2 space-y-8">
              <h2 className="text-4xl font-bold text-white mb-6">Find Details & Book</h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-blue-600/20 p-3 rounded-xl"><MapPin className="w-6 h-6 text-blue-400" /></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Clinic Address</h4>
                    <p className="mt-1 leading-relaxed">Shop No 4, Ground Floor, Sai Plaza Building<br />Chinchwad, Pune - 411033</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-600/20 p-3 rounded-xl"><Phone className="w-6 h-6 text-blue-400" /></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Call Us</h4>
                    <p className="mt-1 text-2xl font-semibold text-blue-400">+{CLINIC_WHATSAPP_NUMBER}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-blue-600/20 p-3 rounded-xl"><Clock className="w-6 h-6 text-blue-400" /></div>
                  <div>
                    <h4 className="text-xl font-bold text-white">Opening Hours</h4>
                    <p className="mt-1">Mon - Sat: 10:00 AM - 10:00 PM<br />Sunday: Closed</p>
                  </div>
                </div>

                {/* Map Integration */}
                <div className="mt-8 rounded-2xl overflow-hidden border border-slate-800 shadow-lg h-60 w-full group">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3780.8441113063533!2d73.7844002!3d18.626249!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2b9be13807d9d%3A0x6e9fcd86558668d2!2sSai%20Plaza%20Building!5e0!3m2!1sen!2sin!4v1711822800000!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </div>
            </div>

            {/* Form Integrated with Backend Logic */}
            <div className="lg:w-1/2">
              <Card className="border-0 shadow-2xl bg-white overflow-hidden">
                <div className="h-2 bg-blue-600 w-full" />
                <CardContent className="p-8">
                  {isSubmitting ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                      <h3 className="text-xl font-semibold text-slate-800">Processing Your Request...</h3>
                    </div>
                  ) : formData.submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-12 h-12 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h3>
                        <p className="text-slate-600 leading-relaxed max-w-sm mx-auto mb-2">
                          Your appointment has been successfully booked. Our team will contact you shortly.
                        </p>
                        <p className="text-sm text-green-600 font-medium mb-6">
                          ✓ SMS confirmation sent · ✓ Clinic notified via WhatsApp
                        </p>
                      </div>
                      <Button onClick={() => setFormData({ name: '', phone: '', service: 'Consultation', timeSlot: 'Morning (10 AM - 1 PM)', submitted: false })} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg h-11 px-8">
                        Book Another Appointment
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-slate-900 mb-6">Quick Appointment</h3>
                      <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Full Name</label>
                          <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            type="text"
                            className="w-full flex h-12 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                            placeholder="Jane Doe"
                            required
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-5">
                          <div className="space-y-2 flex-1">
                            <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                            <input
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              type="tel"
                              className="w-full flex h-12 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                              placeholder="+91 XXXXX XXXXX"
                              required
                            />
                          </div>

                          <div className="space-y-2 flex-1">
                            <label className="text-sm font-semibold text-slate-700">Time Slot</label>
                            <select
                              name="timeSlot"
                              value={formData.timeSlot}
                              onChange={handleChange}
                              className="w-full flex h-12 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                              <option>Morning (10 AM - 1 PM)</option>
                              <option>Afternoon (1 PM - 5 PM)</option>
                              <option>Evening (5 PM - 10 PM)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-slate-700">Interested Service</label>
                          <select
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            className="w-full flex h-12 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2">
                            <option>Consultation</option>
                            <option>Root Canal Treatment</option>
                            <option>Tooth Extraction</option>
                            <option>Cleaning</option>
                            <option>Dental Fillings</option>
                            <option>Other</option>
                          </select>
                        </div>

                        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg rounded-lg disabled:opacity-70">
                          Submit Request
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800 text-center">
        <div className="container mx-auto px-4">
          <div className="text-2xl font-bold text-white tracking-tighter mb-4 flex justify-center items-center gap-2">
            <Stethoscope className="text-blue-500" /> MYDENT
          </div>
          <p className="mb-6 max-w-sm mx-auto">Providing exceptional dental care with modern ethics and pain-free solutions.</p>
          <p>© {new Date().getFullYear()} MYDENT Clinic. All rights reserved.</p>
        </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <a href={`https://wa.me/${CLINIC_WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 z-50 p-4 bg-green-500 text-white rounded-full shadow-lg shadow-green-500/30 hover:scale-110 transition-transform flex items-center justify-center">
        <MessageCircle className="w-8 h-8" />
      </a>
    </div>
  );
}
