import { Card, CardContent } from "@/components/ui/card";
import { Clock, Users } from "lucide-react";
import { useLanguage, type Language } from "@/lib/i18n";
import type { Tour } from "@shared/schema";
import type { Currency } from "./CurrencyToggle";

interface TourCardProps {
  tour: Tour;
  currency: Currency;
  exchangeRate: number;
  onClick: () => void;
}

export function TourCard({ tour, currency, exchangeRate, onClick }: TourCardProps) {
  const { currentLanguage, t } = useLanguage();

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

  const formatDuration = () => {
    const duration = tour.duration;
    if (duration.includes('Day')) {
      return t('tours.duration.multiDay');
    }
    return t('tours.duration.dayTrip');
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
      onClick={onClick}
      data-testid={`card-tour-${tour.id}`}
    >
      {tour.coverImageUrl && (
        <img 
          src={tour.coverImageUrl} 
          alt={getLocalizedContent('title') as string}
          className="w-full h-48 object-cover"
          data-testid={`img-tour-cover-${tour.id}`}
        />
      )}
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold mb-2 text-foreground" data-testid={`text-tour-title-${tour.id}`}>
          {getLocalizedContent('title')}
        </h3>
        <p className="text-muted-foreground mb-4 text-sm leading-relaxed line-clamp-5" data-testid={`text-tour-description-${tour.id}`}>
          {getLocalizedContent('description')}
        </p>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-primary" data-testid={`text-tour-price-${tour.id}`}>
              {formatPrice()}
            </span>
          </div>
          <div className="text-right">
            <div className="flex items-center text-muted-foreground mb-1">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm" data-testid={`text-tour-duration-${tour.id}`}>{tour.duration}</span>
            </div>
            <div className="text-xs text-muted-foreground">{formatDuration()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
