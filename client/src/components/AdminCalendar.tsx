import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Lock, Unlock, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tour, TourAvailability } from "@shared/schema";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

interface AdminCalendarProps {
  tours: Tour[];
}

export function AdminCalendar({ tours }: AdminCalendarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTour, setSelectedTour] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Get the first tour as default
  useEffect(() => {
    if (tours.length > 0 && !selectedTour) {
      setSelectedTour(tours[0].id);
    }
  }, [tours, selectedTour]);

  // Fetch availability for selected tour and current month
  const startDate = startOfMonth(currentMonth);
  const endDate = endOfMonth(currentMonth);

  const { data: availability, isLoading } = useQuery({
    queryKey: ['/api/tours', selectedTour, 'availability', format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
    enabled: !!selectedTour,
    queryFn: async () => {
      const response = await fetch(`/api/tours/${selectedTour}/availability?start=${format(startDate, 'yyyy-MM-dd')}&end=${format(endDate, 'yyyy-MM-dd')}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return response.json() as TourAvailability[];
    }
  });

  // Mutation to toggle date availability
  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({ date, isBlocked }: { date: Date; isBlocked: boolean }) => {
      const existingEntry = availability?.find(
        a => format(new Date(a.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      if (existingEntry) {
        // Update existing entry
        return await apiRequest('PUT', `/api/availability/${existingEntry.id}`, {
          isAvailable: !isBlocked
        });
      } else {
        // Create new entry
        return await apiRequest('POST', `/api/tours/${selectedTour}/availability`, {
          date: date.toISOString(),
          isAvailable: !isBlocked,
          maxBookings: 1,
          currentBookings: 0
        });
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Date availability updated successfully",
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/tours', selectedTour, 'availability'] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update date availability",
        variant: "destructive",
      });
    },
  });

  const getDateStatus = (date: Date) => {
    if (!availability) return 'available';
    
    const entry = availability.find(
      a => format(new Date(a.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    
    if (!entry) return 'available';
    return entry.isAvailable ? 'available' : 'blocked';
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleToggleAvailability = () => {
    if (!selectedDate || !selectedTour) return;
    
    const currentStatus = getDateStatus(selectedDate);
    const willBeBlocked = currentStatus === 'available';
    
    toggleAvailabilityMutation.mutate({
      date: selectedDate,
      isBlocked: willBeBlocked
    });
  };

  const selectedTourData = tours.find(t => t.id === selectedTour);
  const selectedDateStatus = selectedDate ? getDateStatus(selectedDate) : null;

  return (
    <Card className="w-full" data-testid="card-admin-calendar">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Tour Availability Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tour Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Tour</label>
          <Select value={selectedTour} onValueChange={setSelectedTour}>
            <SelectTrigger data-testid="select-tour-calendar">
              <SelectValue placeholder="Choose a tour..." />
            </SelectTrigger>
            <SelectContent>
              {tours.map((tour) => (
                <SelectItem key={tour.id} value={tour.id} data-testid={`option-tour-${tour.id}`}>
                  {tour.titleEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Calendar Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            data-testid="button-prev-month"
          >
            Previous
          </Button>
          <h3 className="font-medium" data-testid="text-current-month">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            data-testid="button-next-month"
          >
            Next
          </Button>
        </div>

        {/* Calendar */}
        <div className="border rounded-md p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-sm text-muted-foreground">Loading calendar...</div>
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              month={currentMonth}
              className="w-full"
              modifiers={{
                blocked: (date) => getDateStatus(date) === 'blocked',
                available: (date) => getDateStatus(date) === 'available',
              }}
              modifiersClassNames={{
                blocked: "bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100",
                available: "bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100",
              }}
              data-testid="calendar-availability"
            />
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Blocked</span>
          </div>
        </div>

        {/* Selected Date Actions */}
        {selectedDate && selectedTourData && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" data-testid="text-selected-date">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedTourData.titleEn}
                    </p>
                  </div>
                  <Badge variant={selectedDateStatus === 'blocked' ? 'destructive' : 'default'}>
                    {selectedDateStatus === 'blocked' ? 'Blocked' : 'Available'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleToggleAvailability}
                    disabled={toggleAvailabilityMutation.isPending}
                    variant={selectedDateStatus === 'blocked' ? 'default' : 'destructive'}
                    size="sm"
                    data-testid="button-toggle-availability"
                  >
                    {selectedDateStatus === 'blocked' ? (
                      <>
                        <Unlock className="h-4 w-4 mr-2" />
                        Unblock Date
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Block Date
                      </>
                    )}
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Blocked dates will not be available for booking by customers.</p>
                    <p>Existing bookings for this date will not be affected.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}