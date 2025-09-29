import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Phone, Mail, MapPin, Shield } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencyToggle, type Currency } from "@/components/CurrencyToggle";
import { TourCard } from "@/components/TourCard";
import { TourDetailsModal } from "@/components/TourDetailsModal";
import { BookingModal } from "@/components/BookingModal";
import { useQuery } from "@tanstack/react-query";
import type { Tour } from "@shared/schema";

export default function Home() {
  const { t } = useLanguage();
  const [currency, setCurrency] = useState<Currency>('GEL');
  const [exchangeRate, setExchangeRate] = useState(0.375);
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [showTourDetails, setShowTourDetails] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch tours
  const { data: tours, isLoading: toursLoading } = useQuery({
    queryKey: ['/api/tours'],
  });

  // Fetch exchange rate
  const { data: exchangeData } = useQuery({
    queryKey: ['/api/exchange-rate'],
  });

  useEffect(() => {
    if (exchangeData?.gelToUsd) {
      setExchangeRate(exchangeData.gelToUsd);
    }
  }, [exchangeData]);

  const handleTourClick = (tour: Tour) => {
    setSelectedTour(tour);
    setShowTourDetails(true);
  };

  const handleBookingClick = () => {
    setShowTourDetails(false);
    setShowBookingModal(true);
  };

  const handleAdminLogin = () => {
    window.location.href = "/api/login";
  };

  const scrollToTours = () => {
    document.getElementById('tours-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background text-foreground" data-testid="page-home">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2" data-testid="logo">
              <Mountain className="text-primary text-2xl" />
              <span className="text-xl font-bold text-foreground">Orshimo Tours</span>
            </div>
            
            {/* Language & Currency Switcher */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <CurrencyToggle onCurrencyChange={setCurrency} />
              
              {/* Admin Login */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminLogin}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-admin-login"
              >
                <Shield className="h-4 w-4 mr-1" />
                {t('nav.admin')}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-bg min-h-[60vh] flex items-center justify-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-accent/70" />
        <div className="relative text-center text-white px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" data-testid="text-hero-title">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
            {t('hero.subtitle')}
          </p>
          <Button 
            onClick={scrollToTours}
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg shadow-lg min-h-[44px]"
            data-testid="button-hero-cta"
          >
            {t('hero.cta')}
          </Button>
        </div>
      </section>

      {/* Tours Section */}
      <section id="tours-section" className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" data-testid="text-tours-title">
            {t('tours.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-tours-subtitle">
            {t('tours.subtitle')}
          </p>
        </div>

        {/* Tours Grid */}
        {toursLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="w-full h-48 bg-muted animate-pulse" />
                <CardContent className="p-6">
                  <div className="h-6 bg-muted rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-muted rounded mb-4 animate-pulse" />
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-6 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" data-testid="grid-tours">
            {tours?.map((tour: Tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                currency={currency}
                exchangeRate={exchangeRate}
                onClick={() => handleTourClick(tour)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Mountain className="text-primary text-xl" />
                <span className="text-lg font-bold text-foreground">Orshimo Tours</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Discover the authentic beauty of Georgia with our expertly guided tours and unforgettable experiences.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.allTours')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.about')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.faq')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">{t('footer.popularTours')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.svanetiMountains')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.tbilisiCity')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.wineTasting')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('footer.blackSeaCoast')}</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">{t('footer.contact')}</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  <span>+995 XXX XXX XXX</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <span>info@georgiatours.ge</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>Tbilisi, Georgia</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <TourDetailsModal
        tour={selectedTour}
        isOpen={showTourDetails}
        onClose={() => setShowTourDetails(false)}
        onBooking={handleBookingClick}
        currency={currency}
        exchangeRate={exchangeRate}
      />

      <BookingModal
        tour={selectedTour}
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        currency={currency}
        exchangeRate={exchangeRate}
      />
    </div>
  );
}
