import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { serviceCategories } from "./categories.js";
import { geographyPoint } from "./geography.js";
import { partners } from "./partners.js";
import { clients } from "./users.js";

export const serviceRequestStatusEnum = pgEnum("service_request_status", [
  "PENDING",
  "SEARCHING",
  "ACCEPTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
]);

export const serviceRequestPartnerStatusEnum = pgEnum("service_request_partner_status", [
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);

export const serviceRequests = pgTable(
  "service_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => serviceCategories.id),
    description: text("description").notNull(),
    address: text("address").notNull(),
    city: text("city").notNull(),
    state: text("state").notNull(),
    neighborhood: text("neighborhood"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }).notNull(),
    longitude: numeric("longitude", { precision: 10, scale: 7 }).notNull(),
    location: geographyPoint("location").generatedAlwaysAs(
      sql`ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography`,
    ),
    isHomeService: boolean("is_home_service").notNull(),
    status: serviceRequestStatusEnum("status").notNull().default("PENDING"),
    acceptedPartnerId: uuid("accepted_partner_id").references(() => partners.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("service_requests_location_gix").using("gist", table.location)],
);

export const serviceRequestPartners = pgTable(
  "service_request_partners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceRequestId: uuid("service_request_id")
      .notNull()
      .references(() => serviceRequests.id),
    partnerId: uuid("partner_id")
      .notNull()
      .references(() => partners.id),
    status: serviceRequestPartnerStatusEnum("status").notNull().default("PENDING"),
    notifiedAt: timestamp("notified_at", { withTimezone: true }),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("service_request_partners_uq").on(table.serviceRequestId, table.partnerId),
  ],
);

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type ServiceRequestPartner = typeof serviceRequestPartners.$inferSelect;
