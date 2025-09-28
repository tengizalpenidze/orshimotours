import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Route, Plus, Users, TrendingUp, Calendar, Edit, Trash2, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import type { Tour, Booking } from "@shared/schema";

export function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: tours, isLoading: toursLoading } = useQuery({
    queryKey: ['/api/tours'],
    enabled: isAuthenticated,
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['/api/bookings'],
    enabled: isAuthenticated,
  });

  const deleteTourMutation = useMutation({
    mutationFn: async (tourId: string) => {
      return await apiRequest('DELETE', `/api/tours/${tourId}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tour deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete tour",
        variant: "destructive",
      });
    },
  });

  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      return await apiRequest('PUT', `/api/bookings/${bookingId}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking status updated",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleDeleteTour = (tourId: string) => {
    if (confirm('Are you sure you want to delete this tour?')) {
      deleteTourMutation.mutate(tourId);
    }
  };

  const handleEditTour = (tourId: string) => {
    // TODO: Implement edit tour functionality
    toast({
      title: "Feature Coming Soon",
      description: "Tour editing functionality will be available soon.",
    });
  };

  const handleAddTour = () => {
    // TODO: Implement add tour functionality
    toast({
      title: "Feature Coming Soon",
      description: "Add tour functionality will be available soon.",
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const pendingBookings = bookings?.filter((booking: Booking) => booking.status === 'pending') || [];
  const thisMonthBookings = bookings?.filter((booking: Booking) => {
    const bookingDate = new Date(booking.createdAt || '');
    const now = new Date();
    return bookingDate.getMonth() === now.getMonth() && bookingDate.getFullYear() === now.getFullYear();
  }) || [];

  const totalRevenue = thisMonthBookings.reduce((sum, booking) => {
    return sum + parseFloat(booking.totalPriceGel || '0');
  }, 0);

  return (
    <div className="min-h-screen bg-background" data-testid="admin-dashboard">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-admin-title">
              {t('admin.dashboard')}
            </h2>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={handleAddTour}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                data-testid="button-add-tour"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('admin.addTour')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                data-testid="button-admin-logout"
              >
                <LogOut className="h-4 w-4 mr-1" />
                {t('admin.logout')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card data-testid="card-total-tours">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.totalTours')}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-tours-count">
                    {tours?.length || 0}
                  </p>
                </div>
                <Route className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-pending-bookings">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.pendingBookings')}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-pending-bookings-count">
                    {pendingBookings.length}
                  </p>
                </div>
                <Calendar className="h-6 w-6 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-this-month">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.thisMonth')}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-this-month-count">
                    {thisMonthBookings.length}
                  </p>
                </div>
                <Users className="h-6 w-6 text-secondary" />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-revenue">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('admin.revenue')}</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-revenue-amount">
                    {totalRevenue.toFixed(0)}₾
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tours Management */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              {t('admin.manageTours')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {toursLoading ? (
              <div className="text-center py-8">Loading tours...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="table-tours">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-4 font-medium text-foreground">{t('admin.tourName')}</th>
                      <th className="text-left p-4 font-medium text-foreground">{t('admin.duration')}</th>
                      <th className="text-left p-4 font-medium text-foreground">{t('admin.price')}</th>
                      <th className="text-left p-4 font-medium text-foreground">{t('admin.status')}</th>
                      <th className="text-left p-4 font-medium text-foreground">{t('admin.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tours?.map((tour: Tour) => (
                      <tr key={tour.id} className="border-b border-border" data-testid={`row-tour-${tour.id}`}>
                        <td className="p-4 text-foreground" data-testid={`text-tour-name-${tour.id}`}>
                          {tour.titleEn}
                        </td>
                        <td className="p-4 text-muted-foreground">{tour.duration}</td>
                        <td className="p-4 text-foreground">{tour.priceGel}</td>
                        <td className="p-4">
                          <Badge 
                            variant={tour.isActive ? "default" : "secondary"}
                            className={tour.isActive ? "bg-primary/10 text-primary" : ""}
                          >
                            {tour.isActive ? t('admin.active') : 'Inactive'}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTour(tour.id)}
                              className="text-primary hover:text-primary/80"
                              data-testid={`button-edit-tour-${tour.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteTour(tour.id)}
                              className="text-destructive hover:text-destructive/80"
                              data-testid={`button-delete-tour-${tour.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Recent Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <div className="text-center py-8">Loading bookings...</div>
            ) : bookings?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No bookings yet</div>
            ) : (
              <div className="space-y-4" data-testid="list-recent-bookings">
                {bookings?.slice(0, 10).map((booking: Booking & { tour: Tour }) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`card-booking-${booking.id}`}>
                    <div>
                      <h4 className="font-medium text-foreground">{booking.tour.titleEn}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.tourDate).toLocaleDateString()} • {booking.numberOfPeople} people
                      </p>
                      <p className="text-sm text-muted-foreground">{booking.phoneNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">{booking.totalPriceGel} GEL</p>
                      <Badge 
                        variant={booking.status === 'pending' ? "secondary" : booking.status === 'confirmed' ? "default" : "destructive"}
                        className="mt-1"
                      >
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
