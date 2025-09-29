import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Tour } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const tourEditSchema = z.object({
  titleEn: z.string().min(1, "English title is required"),
  titleRu: z.string().min(1, "Russian title is required"),
  titleGe: z.string().min(1, "Georgian title is required"),
  descriptionEn: z.string().min(1, "English description is required"),
  descriptionRu: z.string().min(1, "Russian description is required"),
  descriptionGe: z.string().min(1, "Georgian description is required"),
  highlightsEn: z.string().min(1, "English highlights are required"),
  highlightsRu: z.string().min(1, "Russian highlights are required"),
  highlightsGe: z.string().min(1, "Georgian highlights are required"),
  priceGel: z.string().min(1, "Price is required"),
  duration: z.string().min(1, "Duration is required"),
  maxParticipants: z.string().min(1, "Max participants is required"),
});

type TourEditForm = z.infer<typeof tourEditSchema>;

interface TourEditModalProps {
  tour: Tour | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TourEditModal({ tour, isOpen, onClose }: TourEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newCoverImage, setNewCoverImage] = useState<string | null>(null);

  const form = useForm<TourEditForm>({
    resolver: zodResolver(tourEditSchema),
    defaultValues: {
      titleEn: "",
      titleRu: "",
      titleGe: "",
      descriptionEn: "",
      descriptionRu: "",
      descriptionGe: "",
      highlightsEn: "",
      highlightsRu: "",
      highlightsGe: "",
      priceGel: "",
      duration: "",
      maxParticipants: "",
    },
  });

  useEffect(() => {
    if (tour && isOpen) {
      form.reset({
        titleEn: tour.titleEn || "",
        titleRu: tour.titleRu || "",
        titleGe: tour.titleGe || "",
        descriptionEn: tour.descriptionEn || "",
        descriptionRu: tour.descriptionRu || "",
        descriptionGe: tour.descriptionGe || "",
        highlightsEn: Array.isArray(tour.highlightsEn) ? tour.highlightsEn.join("\n") : "",
        highlightsRu: Array.isArray(tour.highlightsRu) ? tour.highlightsRu.join("\n") : "",
        highlightsGe: Array.isArray(tour.highlightsGe) ? tour.highlightsGe.join("\n") : "",
        priceGel: tour.priceGel?.toString() || "",
        duration: tour.duration || "",
        maxParticipants: tour.maxParticipants?.toString() || "12",
      });
      setNewCoverImage(tour.coverImageUrl || null);
    }
  }, [tour, isOpen, form]);

  const updateTourMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PUT', `/api/tours/${tour?.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Tour updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tours'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update tour",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);

    try {
      // Get upload URL
      const { uploadURL } = await apiRequest('POST', '/api/objects/upload');
      
      // Upload file to object storage
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch(uploadURL, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      
      // Set image as tour image
      const { objectPath } = await apiRequest('PUT', '/api/tour-images', {
        imageURL: uploadResult.objectPath || uploadResult.url,
      });

      setNewCoverImage(objectPath);
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const onSubmit = (data: TourEditForm) => {
    if (!tour) return;

    const updateData = {
      ...data,
      highlightsEn: data.highlightsEn.split('\n').filter(h => h.trim()),
      highlightsRu: data.highlightsRu.split('\n').filter(h => h.trim()),
      highlightsGe: data.highlightsGe.split('\n').filter(h => h.trim()),
      priceGel: data.priceGel, // Keep as string for decimal type
      maxParticipants: parseInt(data.maxParticipants),
      coverImageUrl: newCoverImage,
    };

    updateTourMutation.mutate(updateData);
  };

  if (!tour) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="modal-tour-edit">
        <DialogHeader>
          <DialogTitle data-testid="text-edit-tour-title">Edit Tour</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Cover Image Upload */}
          <Card>
            <CardContent className="p-4">
              <Label className="text-sm font-medium">Cover Image</Label>
              <div className="mt-2">
                {newCoverImage ? (
                  <div className="relative">
                    <img 
                      src={newCoverImage} 
                      alt="Tour cover" 
                      className="w-full h-48 object-cover rounded-md"
                      data-testid="img-tour-cover-preview"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => setNewCoverImage(null)}
                      data-testid="button-remove-cover-image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-md p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">Upload cover image</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploadingImage}
                      className="hidden"
                      id="cover-image-upload"
                      data-testid="input-cover-image-upload"
                    />
                    <Label
                      htmlFor="cover-image-upload"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
                    >
                      {uploadingImage ? "Uploading..." : "Choose Image"}
                    </Label>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* English Fields */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">English Content</h3>
              <div>
                <Label htmlFor="titleEn">Title (English)</Label>
                <Input
                  id="titleEn"
                  {...form.register("titleEn")}
                  data-testid="input-title-en"
                />
                {form.formState.errors.titleEn && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.titleEn.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="descriptionEn">Description (English)</Label>
                <Textarea
                  id="descriptionEn"
                  {...form.register("descriptionEn")}
                  rows={3}
                  data-testid="textarea-description-en"
                />
                {form.formState.errors.descriptionEn && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.descriptionEn.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="highlightsEn">Highlights (English) - One per line</Label>
                <Textarea
                  id="highlightsEn"
                  {...form.register("highlightsEn")}
                  rows={3}
                  placeholder="UNESCO World Heritage site&#10;Breathtaking mountain views&#10;Traditional Georgian cuisine"
                  data-testid="textarea-highlights-en"
                />
                {form.formState.errors.highlightsEn && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.highlightsEn.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Russian Fields */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Russian Content</h3>
              <div>
                <Label htmlFor="titleRu">Title (Russian)</Label>
                <Input
                  id="titleRu"
                  {...form.register("titleRu")}
                  data-testid="input-title-ru"
                />
                {form.formState.errors.titleRu && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.titleRu.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="descriptionRu">Description (Russian)</Label>
                <Textarea
                  id="descriptionRu"
                  {...form.register("descriptionRu")}
                  rows={3}
                  data-testid="textarea-description-ru"
                />
                {form.formState.errors.descriptionRu && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.descriptionRu.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="highlightsRu">Highlights (Russian) - One per line</Label>
                <Textarea
                  id="highlightsRu"
                  {...form.register("highlightsRu")}
                  rows={3}
                  data-testid="textarea-highlights-ru"
                />
                {form.formState.errors.highlightsRu && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.highlightsRu.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Georgian Fields */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Georgian Content</h3>
              <div>
                <Label htmlFor="titleGe">Title (Georgian)</Label>
                <Input
                  id="titleGe"
                  {...form.register("titleGe")}
                  data-testid="input-title-ge"
                />
                {form.formState.errors.titleGe && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.titleGe.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="descriptionGe">Description (Georgian)</Label>
                <Textarea
                  id="descriptionGe"
                  {...form.register("descriptionGe")}
                  rows={3}
                  data-testid="textarea-description-ge"
                />
                {form.formState.errors.descriptionGe && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.descriptionGe.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="highlightsGe">Highlights (Georgian) - One per line</Label>
                <Textarea
                  id="highlightsGe"
                  {...form.register("highlightsGe")}
                  rows={3}
                  data-testid="textarea-highlights-ge"
                />
                {form.formState.errors.highlightsGe && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.highlightsGe.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tour Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold">Tour Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="priceGel">Price (GEL)</Label>
                  <Input
                    id="priceGel"
                    type="number"
                    step="0.01"
                    {...form.register("priceGel")}
                    data-testid="input-price-gel"
                  />
                  {form.formState.errors.priceGel && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.priceGel.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 8 Hours, 2 Days"
                    {...form.register("duration")}
                    data-testid="input-duration"
                  />
                  {form.formState.errors.duration && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.duration.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="maxParticipants">Max Participants</Label>
                  <Input
                    id="maxParticipants"
                    type="number"
                    {...form.register("maxParticipants")}
                    data-testid="input-max-participants"
                  />
                  {form.formState.errors.maxParticipants && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.maxParticipants.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateTourMutation.isPending}
              data-testid="button-save-tour"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateTourMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}