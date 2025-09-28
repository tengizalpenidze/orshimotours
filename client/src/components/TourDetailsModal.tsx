import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Users, Share2, Calendar } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { Tour } from "@shared/schema";
import type { Currency } from "./CurrencyToggle";

interface TourDetailsModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  onBooking: () => void;
  currency: Currency;
  exchangeRate: number;
}

export function TourDetailsModal({ 
  tour, 
  isOpen, 
  onClose, 
  onBooking, 
  currency, 
  exchangeRate 
}: TourDetailsModalProps) {
  const { currentLanguage, t } = useLanguage();

  if (!tour) return null;

  const getLocalizedContent = (field: 'title' | 'description' | 'highlights') => {
    const key = `${field}${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}` as keyof Tour;
    return tour[key] as string | string[];
  };

  const formatPrice = () => {
    const priceGel = parseFloat(tour.priceGel);
    if (currency === 'USD') {
      const priceUsd = Math.round(priceGel * exchangeRate);
      return `$${priceUsd}`;
    }
    return `${priceGel} GEL`;
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: getLocalizedContent('title') as string,
          text: getLocalizedContent('description') as string,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-tour-details">
        <div className="relative">
          {/* Tour Image Gallery */}
          <div className="relative h-64 md:h-80 mb-6">
            <img 
              src={tour.coverImageUrl || ''} 
              alt={getLocalizedContent('title') as string}
              className="w-full h-full object-cover rounded-lg" 
              data-testid="img-tour-modal-cover"
            />
            {tour.imageUrls && tour.imageUrls.length > 1 && (
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded-md">
                <span data-testid="text-image-counter">1 / {tour.imageUrls.length}</span>
              </div>
            )}
          </div>
          
          {/* Tour Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
            <div className="mb-4 md:mb-0">
              <DialogHeader>
                <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground mb-2" data-testid="text-tour-modal-title">
                  {getLocalizedContent('title')}
                </DialogTitle>
              </DialogHeader>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span data-testid="text-tour-modal-duration">{tour.duration}</span>
                <Users className="h-4 w-4 ml-4 mr-2" />
                <span>{t('tour.smallGroup')}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary mb-1" data-testid="text-tour-modal-price">
                {formatPrice()}
              </div>
              <div className="text-sm text-muted-foreground">{t('tours.perPerson')}</div>
            </div>
          </div>
          
          {/* Tour Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{t('tour.about')}</h3>
            <p className="text-muted-foreground leading-relaxed" data-testid="text-tour-modal-description">
              {getLocalizedContent('description')}
            </p>
          </div>
          
          {/* Tour Highlights */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">{t('tour.highlights')}</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-muted-foreground" data-testid="list-tour-highlights">
              {(getLocalizedContent('highlights') as string[]).map((highlight, index) => (
                <li key={index} className="flex items-center">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                  {highlight}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onBooking}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="button-book-tour"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('tour.book')}
            </Button>
            <Button 
              variant="secondary"
              onClick={handleShare}
              className="flex-1"
              data-testid="button-share-tour"
            >
              <Share2 className="h-4 w-4 mr-2" />
              {t('tour.share')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
