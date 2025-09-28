import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Tour } from "@shared/schema";
import type { Currency } from "./CurrencyToggle";

interface BookingModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  exchangeRate: number;
}

export function BookingModal({ tour, isOpen, onClose, currency, exchangeRate }: BookingModalProps) {
  const { currentLanguage, t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    tourDate: '',
    numberOfPeople: '',
    phoneNumber: '',
    email: '',
    specialRequests: '',
  });

  const bookingMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('POST', '/api/bookings', data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: t('booking.success'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      tourDate: '',
      numberOfPeople: '',
      phoneNumber: '',
      email: '',
      specialRequests: '',
    });
  };

  if (!tour) return null;

  const getLocalizedContent = (field: 'title' | 'description' | 'highlights') => {
    const key = `${field}${currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}` as keyof Tour;
    return tour[field + currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1) as keyof Tour] as string | string[];
  };

  const formatPrice = () => {
    const priceGel = parseFloat(tour.priceGel);
    if (currency === 'USD') {
      const priceUsd = Math.round(priceGel * exchangeRate);
      return `$${priceUsd}`;
    }
    return `${priceGel} GEL`;
  };

  const calculateTotalPrice = () => {
    const people = parseInt(formData.numberOfPeople) || 1;
    const priceGel = parseFloat(tour.priceGel);
    const totalGel = priceGel * people;
    
    if (currency === 'USD') {
      const totalUsd = Math.round(totalGel * exchangeRate);
      return `$${totalUsd}`;
    }
    return `${totalGel} GEL`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tourDate || !formData.numberOfPeople || !formData.phoneNumber) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const people = parseInt(formData.numberOfPeople);
    const priceGel = parseFloat(tour.priceGel);
    const totalPriceGel = priceGel * people;

    bookingMutation.mutate({
      tourId: tour.id,
      tourDate: new Date(formData.tourDate),
      numberOfPeople: people,
      phoneNumber: formData.phoneNumber,
      email: formData.email || null,
      specialRequests: formData.specialRequests || null,
      totalPriceGel: totalPriceGel.toString(),
    });
  };

  // Set date constraints (next 3 months)
  const today = new Date();
  const minDate = new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
  const maxDate = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // 3 months

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-booking">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {t('booking.title')}
          </DialogTitle>
        </DialogHeader>
        
        {/* Tour Summary */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-start space-x-4">
              <img 
                src={tour.coverImageUrl || ''} 
                alt={getLocalizedContent('title') as string}
                className="w-20 h-20 object-cover rounded-md"
                data-testid="img-booking-tour-cover"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground" data-testid="text-booking-tour-title">
                  {getLocalizedContent('title')}
                </h3>
                <p className="text-sm text-muted-foreground mb-2" data-testid="text-booking-tour-duration">
                  {tour.duration}
                </p>
                <p className="text-xl font-bold text-primary" data-testid="text-booking-tour-price">
                  {formatPrice()} {t('tours.perPerson')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date Selection */}
          <div>
            <Label htmlFor="tourDate" className="text-sm font-medium text-foreground mb-2">
              {t('booking.selectDate')} *
            </Label>
            <Input
              type="date"
              id="tourDate"
              value={formData.tourDate}
              onChange={(e) => setFormData({ ...formData, tourDate: e.target.value })}
              min={minDate.toISOString().split('T')[0]}
              max={maxDate.toISOString().split('T')[0]}
              required
              data-testid="input-tour-date"
            />
            <div className="text-xs text-muted-foreground mt-1">
              {t('booking.availableDates')}
            </div>
          </div>
          
          {/* Number of People */}
          <div>
            <Label htmlFor="peopleCount" className="text-sm font-medium text-foreground mb-2">
              {t('booking.numberOfPeople')} *
            </Label>
            <Select 
              value={formData.numberOfPeople} 
              onValueChange={(value) => setFormData({ ...formData, numberOfPeople: value })}
            >
              <SelectTrigger data-testid="select-people-count">
                <SelectValue placeholder={t('booking.selectPeople')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 person</SelectItem>
                <SelectItem value="2">2 people</SelectItem>
                <SelectItem value="3">3 people</SelectItem>
                <SelectItem value="4">4 people</SelectItem>
                <SelectItem value="5">5 people</SelectItem>
                <SelectItem value="6">6+ people</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Phone Number */}
          <div>
            <Label htmlFor="phoneNumber" className="text-sm font-medium text-foreground mb-2">
              {t('booking.phone')} *
            </Label>
            <Input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              placeholder={t('booking.phonePlaceholder')}
              required
              data-testid="input-phone-number"
            />
          </div>
          
          {/* Email (Optional) */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium text-foreground mb-2">
              {t('booking.emailOptional')}
            </Label>
            <Input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('booking.emailPlaceholder')}
              data-testid="input-email"
            />
          </div>
          
          {/* Special Requests */}
          <div>
            <Label htmlFor="specialRequests" className="text-sm font-medium text-foreground mb-2">
              {t('booking.specialRequests')}
            </Label>
            <Textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              placeholder={t('booking.specialRequestsPlaceholder')}
              className="h-20"
              data-testid="textarea-special-requests"
            />
          </div>
          
          {/* Total Price */}
          <Card className="bg-primary/10">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-medium">{t('booking.totalPrice')}</span>
                <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
                  {calculateTotalPrice()}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {t('booking.paymentNote')}
              </div>
            </CardContent>
          </Card>
          
          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            disabled={bookingMutation.isPending}
            data-testid="button-submit-booking"
          >
            <Send className="h-4 w-4 mr-2" />
            {bookingMutation.isPending ? 'Submitting...' : t('booking.submit')}
          </Button>
          
          <div className="text-xs text-muted-foreground text-center">
            {t('booking.confirmationNote')}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
