import { PartnerNotFoundError } from "../../utils/errors.js";
import { partnerRepository } from "./partner.repository.js";

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length !== 8) {
    return value;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function isProfileComplete(input: {
  description?: string | null;
  cep?: string | null;
  address?: string | null;
  city?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  serviceCount: number;
}) {
  return Boolean(
    input.description &&
      input.cep &&
      input.address &&
      input.city &&
      input.latitude &&
      input.longitude &&
      input.serviceCount > 0,
  );
}

export class UpdatePartner {
  async me(userId: string) {
    const partner = await partnerRepository.findByUserId(userId);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    const [services, windows] = await Promise.all([
      partnerRepository.listServices(partner.id),
      partnerRepository.listAvailability(partner.id),
    ]);

    return { ...partner, services, windows };
  }

  async execute(
    userId: string,
    input: {
      description?: string;
      cep?: string;
      address?: string;
      city?: string;
      state?: string;
      neighborhood?: string;
      latitude?: number;
      longitude?: number;
      serviceRadiusMeters?: number;
    },
  ) {
    const partner = await partnerRepository.findByUserId(userId);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    const nextCep = input.cep !== undefined ? formatCep(input.cep) : partner.cep;
    const services = await partnerRepository.listServices(partner.id);
    const updated = await partnerRepository.update(userId, {
      description: input.description ?? partner.description,
      cep: nextCep,
      address: input.address ?? partner.address,
      city: input.city ?? partner.city,
      state: input.state ?? partner.state,
      neighborhood: input.neighborhood ?? partner.neighborhood,
      latitude: input.latitude !== undefined ? String(input.latitude) : partner.latitude,
      longitude: input.longitude !== undefined ? String(input.longitude) : partner.longitude,
      serviceRadiusMeters: input.serviceRadiusMeters ?? partner.serviceRadiusMeters,
      isProfileComplete: isProfileComplete({
        description: input.description ?? partner.description,
        cep: nextCep,
        address: input.address ?? partner.address,
        city: input.city ?? partner.city,
        latitude: input.latitude !== undefined ? String(input.latitude) : partner.latitude,
        longitude: input.longitude !== undefined ? String(input.longitude) : partner.longitude,
        serviceCount: services.filter((item) => item.isActive).length,
      }),
    });

    return updated;
  }

  async setAvailability(
    userId: string,
    input: {
      isAvailable: boolean;
      windows: Array<{ weekday: number; startMinutes: number; endMinutes: number }>;
    },
  ) {
    const partner = await partnerRepository.findByUserId(userId);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    await partnerRepository.update(userId, { isAvailable: input.isAvailable });
    await partnerRepository.replaceAvailability(partner.id, input.windows);
    return this.me(userId);
  }

  async setServices(
    userId: string,
    items: Array<{ categoryId: string; minimumVisitFeeCents: number; isActive: boolean }>,
  ) {
    const partner = await partnerRepository.findByUserId(userId);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    await partnerRepository.replaceServices(partner.id, items);
    const services = await partnerRepository.listServices(partner.id);
    await partnerRepository.update(userId, {
      isProfileComplete: isProfileComplete({
        ...partner,
        serviceCount: services.filter((item) => item.isActive).length,
      }),
    });

    return this.me(userId);
  }
}

export const updatePartner = new UpdatePartner();
