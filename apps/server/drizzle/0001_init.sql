CREATE TYPE "user_role" AS ENUM ('CLIENT', 'PARTNER', 'ADMIN');
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'INACTIVE', 'BLOCKED');
CREATE TYPE "service_request_status" AS ENUM (
  'PENDING',
  'SEARCHING',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED'
);
CREATE TYPE "service_request_partner_status" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED');

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" citext NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" text NOT NULL,
  "phone" text NOT NULL,
  "role" "user_role" NOT NULL,
  "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "updated_by" uuid
);

CREATE TABLE "refresh_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "token_hash" text NOT NULL UNIQUE,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "clients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id"),
  "home_address" text,
  "home_city" text,
  "home_state" text,
  "home_neighborhood" text,
  "home_latitude" text,
  "home_longitude" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id"),
  "description" text,
  "address" text,
  "city" text,
  "state" text,
  "neighborhood" text,
  "latitude" numeric(10, 7),
  "longitude" numeric(10, 7),
  "location" geography(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  "service_radius_meters" integer NOT NULL DEFAULT 5000,
  "is_available" boolean NOT NULL DEFAULT false,
  "is_profile_complete" boolean NOT NULL DEFAULT false,
  "completed_jobs_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "partners_location_gix" ON "partners" USING GIST ("location");

CREATE TABLE "partner_availability_windows" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "weekday" integer NOT NULL,
  "start_minutes" integer NOT NULL,
  "end_minutes" integer NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "service_categories" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" text NOT NULL,
  "slug" citext NOT NULL UNIQUE,
  "description" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "partner_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "category_id" uuid NOT NULL REFERENCES "service_categories"("id"),
  "minimum_visit_fee_cents" integer NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "partner_services_partner_category_uq" UNIQUE ("partner_id", "category_id")
);

CREATE TABLE "service_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "client_id" uuid NOT NULL REFERENCES "clients"("id"),
  "category_id" uuid NOT NULL REFERENCES "service_categories"("id"),
  "description" text NOT NULL,
  "address" text NOT NULL,
  "city" text NOT NULL,
  "state" text NOT NULL,
  "neighborhood" text,
  "latitude" numeric(10, 7) NOT NULL,
  "longitude" numeric(10, 7) NOT NULL,
  "location" geography(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED,
  "is_home_service" boolean NOT NULL,
  "status" "service_request_status" NOT NULL DEFAULT 'PENDING',
  "accepted_partner_id" uuid REFERENCES "partners"("id"),
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "service_requests_location_gix" ON "service_requests" USING GIST ("location");

CREATE TABLE "service_request_partners" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "service_request_id" uuid NOT NULL REFERENCES "service_requests"("id"),
  "partner_id" uuid NOT NULL REFERENCES "partners"("id"),
  "status" "service_request_partner_status" NOT NULL DEFAULT 'PENDING',
  "notified_at" timestamptz,
  "responded_at" timestamptz,
  "rejection_reason" text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "service_request_partners_uq" UNIQUE ("service_request_id", "partner_id")
);

CREATE TABLE "notifications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "read_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
