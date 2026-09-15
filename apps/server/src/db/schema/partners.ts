import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { serviceCategories } from "./categories.js";
import { geographyPoint } from "./geography.js";
import { users } from "./users.js";

export const partners = pgTable(
  "partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id),
    description: text("description"),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    neighborhood: text("neighborhood"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    location: geographyPoint("location").generatedAlwaysAs(
      sql`ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`,
    ),
    serviceRadiusMeters: integer("service_radius_meters").notNull().default(5000),
    isAvailable: boolean("is_available").notNull().default(false),
    isProfileComplete: boolean("is_profile_complete").notNull().default(false),
    completedJobsCount: integer("completed_jobs_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("partners_location_gix").using("gist", table.location),
  ],
);

export const partnerAvailabilityWindows = pgTable("partner_availability_windows", {
  id: uuid("id").defaultRandom().primaryKey(),
  partnerId: uuid("partner_id")
    .notNull()
    .references(() => partners.id),
  weekday: integer("weekday").notNull(),
  startMinutes: integer("start_minutes").notNull(),
  endMinutes: integer("end_minutes").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const partnerServices = pgTable(
  "partner_services",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id),
    minimumVisitFeeCents: integer("minimum_visit_fee_cents").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("partner_services_partner_category_uq").on(table.partnerId, table.categoryId)],
);

export type Partner = typeof partners.$inferSelect;
export type PartnerService = typeof partnerServices.$inferSelect;
export type PartnerAvailabilityWindow = typeof partnerAvailabilityWindows.$inferSelect;
