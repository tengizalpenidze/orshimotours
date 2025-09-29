import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, MessageSquare, Trash2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Booking, Tour } from "@shared/schema";

interface BookingManagementModalProps {
  booking: (Booking & { tour?: Tour }) | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookingManagementModal({ booking, isOpen, onClose }: BookingManagementModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>("");
  const [comment, setComment] = useState<string>("");

  useEffect(() => {
    if (booking && isOpen) {
      setStatus(booking.status || "pending");
      setComment(booking.adminComment || "");
    }
  }, [booking, isOpen]);

  const updateBookingMutation = useMutation({
    mutationFn: async (data: { status?: string; adminComment?: string }) => {
      return await apiRequest('PUT', `/api/bookings/${booking?.id}/update`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update booking",
        variant: "destructive",
      });
    },
  });

  const deleteBookingMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', `/api/bookings/${booking?.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete booking",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!booking) return;

    updateBookingMutation.mutate({
      status,
      adminComment: comment.trim() || undefined,
    });
  };

  const handleDelete = () => {
    if (!booking) return;
    
    if (confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      deleteBookingMutation.mutate();
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!booking) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="modal-booking-management">
        <DialogHeader>
          <DialogTitle data-testid="text-booking-management-title">Manage Booking</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Booking Details</span>
                <Badge variant={getStatusBadgeVariant(booking.status)} data-testid="badge-booking-status">
                  {booking.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Tour:</span> 
                <span className="ml-2" data-testid="text-booking-tour-title">
                  {booking.tour?.titleEn || 'Unknown Tour'}
                </span>
              </div>
              <div>
                <span className="font-medium">Date:</span> 
                <span className="ml-2" data-testid="text-booking-date">
                  {formatDate(booking.tourDate.toString())}
                </span>
              </div>
              <div>
                <span className="font-medium">Participants:</span> 
                <span className="ml-2" data-testid="text-booking-participants">
                  {booking.numberOfPeople} people
                </span>
              </div>
              <div>
                <span className="font-medium">Phone:</span> 
                <span className="ml-2" data-testid="text-booking-phone">
                  {booking.phoneNumber}
                </span>
              </div>
              {booking.email && (
                <div>
                  <span className="font-medium">Email:</span> 
                  <span className="ml-2" data-testid="text-booking-email">
                    {booking.email}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium">Total Price:</span> 
                <span className="ml-2 font-bold text-primary" data-testid="text-booking-total">
                  {booking.totalPriceGel} GEL
                </span>
              </div>
              {booking.specialRequests && (
                <div>
                  <span className="font-medium">Special Requests:</span>
                  <p className="mt-1 text-sm text-muted-foreground bg-muted p-2 rounded" data-testid="text-booking-special-requests">
                    {booking.specialRequests}
                  </p>
                </div>
              )}
              <div>
                <span className="font-medium">Booking Date:</span> 
                <span className="ml-2 text-sm text-muted-foreground" data-testid="text-booking-created">
                  {formatDate(booking.createdAt?.toString() || '')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Booking Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="status" data-testid="select-booking-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending" data-testid="option-status-pending">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value="confirmed" data-testid="option-status-confirmed">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Confirmed
                      </div>
                    </SelectItem>
                    <SelectItem value="cancelled" data-testid="option-status-cancelled">
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 mr-2 text-red-600" />
                        Cancelled
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="comment">Admin Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  placeholder="Add a comment about this booking..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  data-testid="textarea-admin-comment"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This comment is for internal use and won't be shared with the customer.
                </p>
              </div>

              {booking.adminComment && booking.adminComment !== comment && (
                <div>
                  <Label>Previous Comment</Label>
                  <p className="text-sm text-muted-foreground bg-muted p-2 rounded mt-1" data-testid="text-previous-comment">
                    {booking.adminComment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteBookingMutation.isPending}
              data-testid="button-delete-booking"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteBookingMutation.isPending ? "Deleting..." : "Delete Booking"}
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-booking-edit"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateBookingMutation.isPending}
                data-testid="button-save-booking"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateBookingMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}