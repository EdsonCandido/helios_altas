import { PartnerNotFoundError } from "../../utils/errors.js";
import { roundDistanceMeters } from "../matching/matching-criteria.js";
import { partnerRepository } from "./partner.repository.js";

export class FindNearbyPartners {
  async execute(input: {
    latitude: number;
    longitude: number;
    radiusMeters?: number;
    categoryId?: string;
    availableOnly?: boolean;
  }) {
    const rows = await partnerRepository.findNearby({
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters ?? 10_000,
      categoryId: input.categoryId,
      availableOnly: input.availableOnly,
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      neighborhood: row.neighborhood,
      city: row.city,
      category: row.categoryName,
      categoryId: row.categoryId,
      minimumVisitFeeCents: row.minimumVisitFeeCents,
      isAvailable: row.isAvailable,
      distanceMeters: roundDistanceMeters(Number(row.distanceMeters)),
    }));
  }

  async publicProfile(id: string, origin?: { latitude: number; longitude: number }) {
    const partner = await partnerRepository.findPublicById(id, origin);
    if (!partner) {
      throw new PartnerNotFoundError();
    }

    const services = await partnerRepository.listServices(id);

    return {
      id: partner.id,
      name: partner.name,
      description: partner.description,
      neighborhood: partner.neighborhood,
      city: partner.city,
      isAvailable: partner.isAvailable,
      distanceMeters:
        partner.distanceMeters === null ? null : roundDistanceMeters(Number(partner.distanceMeters)),
      services: services
        .filter((item) => item.isActive)
        .map((item) => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          minimumVisitFeeCents: item.minimumVisitFeeCents,
        })),
    };
  }
}

export const findNearbyPartners = new FindNearbyPartners();
