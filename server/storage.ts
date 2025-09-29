import {
  users,
  tours,
  tourAvailability,
  bookings,
  type User,
  type UpsertUser,
  type Tour,
  type InsertTour,
  type TourAvailability,
  type InsertTourAvailability,
  type Booking,
  type InsertBooking,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tour operations
  getTours(): Promise<Tour[]>;
  getTour(id: string): Promise<Tour | undefined>;
  createTour(tour: InsertTour): Promise<Tour>;
  updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour>;
  deleteTour(id: string): Promise<void>;
  
  // Tour availability operations
  getTourAvailability(tourId: string, startDate: Date, endDate: Date): Promise<TourAvailability[]>;
  setTourAvailability(availability: InsertTourAvailability): Promise<TourAvailability>;
  updateTourAvailability(id: string, updates: Partial<InsertTourAvailability>): Promise<TourAvailability>;
  deleteTourAvailability(id: string): Promise<void>;
  
  // Booking operations
  getBookings(): Promise<(Booking & { tour: Tour })[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: string, status: string): Promise<Booking>;
  updateBooking(id: string, updates: Partial<{ status: string; adminComment: string }>): Promise<Booking>;
  deleteBooking(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by ID
    const existingUserById = await db.select().from(users).where(eq(users.id, userData.id)).limit(1);
    
    if (existingUserById.length > 0) {
      // Update existing user with new information
      const [user] = await db
        .update(users)
        .set({
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return user;
    } else {
      // Check if user exists by email (for email conflicts)
      const existingUserByEmail = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);
      
      if (existingUserByEmail.length > 0) {
        // Update existing user with new ID and information
        const [user] = await db
          .update(users)
          .set({
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            profileImageUrl: userData.profileImageUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.email, userData.email))
          .returning();
        return user;
      } else {
        // Insert new user
        const [user] = await db
          .insert(users)
          .values(userData)
          .returning();
        return user;
      }
    }
  }

  // Tour operations
  async getTours(): Promise<Tour[]> {
    return await db.select().from(tours).where(eq(tours.isActive, true)).orderBy(desc(tours.createdAt));
  }

  async getTour(id: string): Promise<Tour | undefined> {
    const [tour] = await db.select().from(tours).where(eq(tours.id, id));
    return tour;
  }

  async createTour(tour: InsertTour): Promise<Tour> {
    const [createdTour] = await db.insert(tours).values(tour).returning();
    return createdTour;
  }

  async updateTour(id: string, tour: Partial<InsertTour>): Promise<Tour> {
    const [updatedTour] = await db
      .update(tours)
      .set({ ...tour, updatedAt: new Date() })
      .where(eq(tours.id, id))
      .returning();
    return updatedTour;
  }

  async deleteTour(id: string): Promise<void> {
    await db.update(tours).set({ isActive: false }).where(eq(tours.id, id));
  }

  // Tour availability operations
  async getTourAvailability(tourId: string, startDate: Date, endDate: Date): Promise<TourAvailability[]> {
    return await db
      .select()
      .from(tourAvailability)
      .where(
        and(
          eq(tourAvailability.tourId, tourId),
          gte(tourAvailability.date, startDate),
          lte(tourAvailability.date, endDate)
        )
      );
  }

  async setTourAvailability(availability: InsertTourAvailability): Promise<TourAvailability> {
    const [created] = await db.insert(tourAvailability).values(availability).returning();
    return created;
  }

  async updateTourAvailability(id: string, updates: Partial<InsertTourAvailability>): Promise<TourAvailability> {
    const [updated] = await db
      .update(tourAvailability)
      .set(updates)
      .where(eq(tourAvailability.id, id))
      .returning();
    return updated;
  }

  async deleteTourAvailability(id: string): Promise<void> {
    await db.delete(tourAvailability).where(eq(tourAvailability.id, id));
  }

  // Booking operations
  async getBookings(): Promise<(Booking & { tour: Tour })[]> {
    return await db
      .select()
      .from(bookings)
      .innerJoin(tours, eq(bookings.tourId, tours.id))
      .orderBy(desc(bookings.createdAt))
      .then(rows => rows.map(row => ({ ...row.bookings, tour: row.tours })));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking;
  }

  async createBooking(booking: InsertBooking): Promise<Booking> {
    const [created] = await db.insert(bookings).values(booking).returning();
    return created;
  }

  async updateBookingStatus(id: string, status: string): Promise<Booking> {
    const [updated] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async updateBooking(id: string, updates: Partial<{ status: string; adminComment: string }>): Promise<Booking> {
    const [updated] = await db
      .update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return updated;
  }

  async deleteBooking(id: string): Promise<void> {
    await db.delete(bookings).where(eq(bookings.id, id));
  }
}

export const storage = new DatabaseStorage();
