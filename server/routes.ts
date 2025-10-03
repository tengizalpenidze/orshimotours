import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { handlePasswordLogin, handlePasswordLogout, isPasswordAuthenticated } from "./passwordAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { sendBookingNotificationEmail } from "./emailService";
import { insertTourSchema, insertBookingSchema, insertTourAvailabilitySchema } from "@shared/schema";
import { z } from "zod";

// Unified authentication middleware that supports both Replit Auth and password auth
const unifiedAuth: any = async (req: any, res: any, next: any) => {
  // Check if using password authentication (session-based)
  const hasPasswordSession = (req.session as any)?.userId && (req.session as any)?.isAdmin;
  
  if (hasPasswordSession) {
    // Use password authentication
    return isPasswordAuthenticated(req, res, next);
  }
  
  // Fall back to Replit authentication
  return isAuthenticated(req, res, next);
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Password authentication endpoints (for external deployments)
  app.post('/api/auth/password/login', handlePasswordLogin);
  app.post('/api/auth/password/logout', handlePasswordLogout);

  // Auth routes
  app.get('/api/auth/user', unifiedAuth, async (req: any, res) => {
    try {
      // Password auth: user is already attached to request
      if (req.user && !req.user.claims) {
        return res.json(req.user);
      }
      
      // Replit auth: get user from claims
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Object storage routes for protected uploads
  app.get("/objects/:objectPath(*)", unifiedAuth, async (req, res) => {
    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", unifiedAuth, async (req, res) => {
    try {
      console.log('[BACKEND-UPLOAD] 📡 Received upload URL request');
      const objectStorageService = new ObjectStorageService();
      const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadURL();
      
      console.log('[BACKEND-UPLOAD] ✅ Generated upload URL', {
        objectPath,
        uploadURLPrefix: uploadURL.substring(0, 100) + '...',
        hasSignature: uploadURL.includes('X-Goog-Signature')
      });
      
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error('[BACKEND-UPLOAD] ❌ Failed to generate upload URL:', error);
      console.error('[BACKEND-UPLOAD] Error stack:', error instanceof Error ? error.stack : undefined);
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  });

  app.put("/api/tour-images", unifiedAuth, async (req, res) => {
    console.log('[BACKEND-ACL] 🔐 Received ACL update request', {
      imageURL: req.body.imageURL,
      hasImageURL: !!req.body.imageURL
    });
    
    if (!req.body.imageURL) {
      console.error('[BACKEND-ACL] ❌ Missing imageURL in request body');
      return res.status(400).json({ error: "imageURL is required" });
    }

    const userId = (req.user as any)?.claims?.sub || (req.user as any)?.id;
    console.log('[BACKEND-ACL] 👤 User ID:', userId);

    try {
      const objectStorageService = new ObjectStorageService();
      
      console.log('[BACKEND-ACL] 🔄 Attempting to set ACL policy...', {
        imageURL: req.body.imageURL,
        owner: userId,
        visibility: 'public'
      });
      
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: userId,
          visibility: "public", // Tour images should be publicly accessible
        },
      );

      console.log('[BACKEND-ACL] ✅ ACL policy set successfully', {
        objectPath
      });

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error('[BACKEND-ACL] ❌ Error setting tour image ACL:', error);
      console.error('[BACKEND-ACL] Error type:', error?.constructor?.name);
      console.error('[BACKEND-ACL] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[BACKEND-ACL] Error stack:', error instanceof Error ? error.stack : undefined);
      
      res.status(500).json({ 
        error: "Failed to set image ACL",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Tour routes
  app.get('/api/tours', async (req, res) => {
    try {
      const tours = await storage.getTours();
      res.json(tours);
    } catch (error) {
      console.error("Error fetching tours:", error);
      res.status(500).json({ message: "Failed to fetch tours" });
    }
  });

  app.get('/api/tours/:id', async (req, res) => {
    try {
      const tour = await storage.getTour(req.params.id);
      if (!tour) {
        return res.status(404).json({ message: "Tour not found" });
      }
      res.json(tour);
    } catch (error) {
      console.error("Error fetching tour:", error);
      res.status(500).json({ message: "Failed to fetch tour" });
    }
  });

  app.post('/api/tours', unifiedAuth, async (req, res) => {
    try {
      const tourData = insertTourSchema.parse(req.body);
      const tour = await storage.createTour(tourData);
      res.status(201).json(tour);
    } catch (error) {
      console.error("Error creating tour:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tour" });
    }
  });

  app.put('/api/tours/:id', unifiedAuth, async (req, res) => {
    try {
      const tourData = insertTourSchema.partial().parse(req.body);
      const tour = await storage.updateTour(req.params.id, tourData);
      res.json(tour);
    } catch (error) {
      console.error("Error updating tour:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tour" });
    }
  });

  app.delete('/api/tours/:id', unifiedAuth, async (req, res) => {
    try {
      await storage.deleteTour(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting tour:", error);
      res.status(500).json({ message: "Failed to delete tour" });
    }
  });

  // Tour availability routes
  app.get('/api/tours/:id/availability', async (req, res) => {
    try {
      const { start, end } = req.query;
      if (!start || !end) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      const startDate = new Date(start as string);
      const endDate = new Date(end as string);
      
      const availability = await storage.getTourAvailability(req.params.id, startDate, endDate);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  app.post('/api/tours/:id/availability', unifiedAuth, async (req, res) => {
    try {
      const availabilityData = insertTourAvailabilitySchema.parse({
        ...req.body,
        tourId: req.params.id,
      });
      const availability = await storage.setTourAvailability(availabilityData);
      res.status(201).json(availability);
    } catch (error) {
      console.error("Error setting availability:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to set availability" });
    }
  });

  app.put('/api/availability/:id', unifiedAuth, async (req, res) => {
    try {
      const updateData = z.object({
        isAvailable: z.boolean().optional(),
        maxBookings: z.number().optional(),
        currentBookings: z.number().optional(),
      }).parse(req.body);
      
      const availability = await storage.updateTourAvailability(req.params.id, updateData);
      res.json(availability);
    } catch (error) {
      console.error("Error updating availability:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update availability" });
    }
  });

  app.delete('/api/availability/:id', unifiedAuth, async (req, res) => {
    try {
      await storage.deleteTourAvailability(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting availability:", error);
      res.status(500).json({ message: "Failed to delete availability" });
    }
  });

  // Booking routes
  app.post('/api/bookings', async (req, res) => {
    try {
      // Convert tourDate string to Date object if it's a string
      if (req.body.tourDate && typeof req.body.tourDate === 'string') {
        req.body.tourDate = new Date(req.body.tourDate);
      }
      
      const bookingData = insertBookingSchema.parse(req.body);
      const booking = await storage.createBooking(bookingData);
      
      // Get tour details for email
      const tour = await storage.getTour(bookingData.tourId);
      if (tour) {
        // Send email notification to admin
        const emailSent = await sendBookingNotificationEmail({
          tourTitle: tour.titleEn, // Use English title for admin
          tourDate: bookingData.tourDate.toISOString(),
          numberOfPeople: bookingData.numberOfPeople,
          phoneNumber: bookingData.phoneNumber,
          email: bookingData.email || undefined,
          specialRequests: bookingData.specialRequests || undefined,
          totalPrice: `${bookingData.totalPriceGel} GEL`,
          bookingId: booking.id,
        });

        if (!emailSent) {
          console.warn("Failed to send booking notification email");
        }
      }
      
      res.status(201).json(booking);
    } catch (error) {
      console.error("Error creating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.get('/api/bookings', unifiedAuth, async (req, res) => {
    try {
      const bookings = await storage.getBookings();
      res.json(bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });


  app.put('/api/bookings/:id/update', unifiedAuth, async (req, res) => {
    try {
      const bookingUpdateSchema = z.object({
        status: z.enum(['pending', 'confirmed', 'cancelled']).optional(),
        adminComment: z.string().max(1000).optional(),
      });
      
      const updateData = bookingUpdateSchema.parse(req.body);
      const booking = await storage.updateBooking(req.params.id, updateData);
      res.json(booking);
    } catch (error) {
      console.error("Error updating booking:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update booking" });
    }
  });

  app.delete('/api/bookings/:id', unifiedAuth, async (req, res) => {
    try {
      await storage.deleteBooking(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ message: "Failed to delete booking" });
    }
  });

  // Exchange rate endpoint (mock implementation - in production would use real API)
  app.get('/api/exchange-rate', async (req, res) => {
    try {
      // Mock exchange rate - in production, fetch from actual API
      const rate = 0.375; // 1 GEL = 0.375 USD (approximate)
      res.json({ gelToUsd: rate });
    } catch (error) {
      console.error("Error fetching exchange rate:", error);
      res.status(500).json({ message: "Failed to fetch exchange rate" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
