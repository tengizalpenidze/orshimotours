import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (supports both Replit Auth and username/password)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  passwordHash: varchar("password_hash"), // For username/password auth on external deployments
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tours table
export const tours = pgTable("tours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  titleEn: text("title_en").notNull(),
  titleRu: text("title_ru").notNull(),
  titleGe: text("title_ge").notNull(),
  descriptionEn: text("description_en").notNull(),
  descriptionRu: text("description_ru").notNull(),
  descriptionGe: text("description_ge").notNull(),
  highlightsEn: jsonb("highlights_en").notNull().$type<string[]>(),
  highlightsRu: jsonb("highlights_ru").notNull().$type<string[]>(),
  highlightsGe: jsonb("highlights_ge").notNull().$type<string[]>(),
  priceGel: decimal("price_gel", { precision: 10, scale: 2 }).notNull(),
  duration: text("duration").notNull(),
  maxParticipants: integer("max_participants").default(12),
  coverImageUrl: text("cover_image_url"),
  imageUrls: jsonb("image_urls").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tour availability calendar
export const tourAvailability = pgTable("tour_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull().references(() => tours.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  isAvailable: boolean("is_available").default(true),
  maxBookings: integer("max_bookings").default(1),
  currentBookings: integer("current_bookings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourId: varchar("tour_id").notNull().references(() => tours.id),
  tourDate: timestamp("tour_date").notNull(),
  numberOfPeople: integer("number_of_people").notNull(),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  specialRequests: text("special_requests"),
  totalPriceGel: decimal("total_price_gel", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  adminComment: text("admin_comment"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const toursRelations = relations(tours, ({ many }) => ({
  availability: many(tourAvailability),
  bookings: many(bookings),
}));

export const tourAvailabilityRelations = relations(tourAvailability, ({ one }) => ({
  tour: one(tours, {
    fields: [tourAvailability.tourId],
    references: [tours.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  tour: one(tours, {
    fields: [bookings.tourId],
    references: [tours.id],
  }),
}));

// Insert schemas
export const insertTourSchema = createInsertSchema(tours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTourAvailabilitySchema = createInsertSchema(tourAvailability).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const upsertUserSchema = createInsertSchema(users);

// Types
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type Tour = typeof tours.$inferSelect;
export type InsertTour = z.infer<typeof insertTourSchema>;
export type TourAvailability = typeof tourAvailability.$inferSelect;
export type InsertTourAvailability = z.infer<typeof insertTourAvailabilitySchema>;
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;
