import { CepNotFoundError, GeocodeNotFoundError, ValidationError } from "../../utils/errors.js";

export type GeoAddress = {
  cep: string | null;
  address: string;
  addressNumber: string | null;
  neighborhood: string;
  city: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
};

type BrasilApiCepResponse = {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  location?: {
    coordinates?: {
      latitude?: string | number | null;
      longitude?: string | number | null;
    };
  };
  message?: string;
};

type NominatimResult = {
  lat?: string;
  lon?: string;
  address?: {
    postcode?: string;
    road?: string;
    pedestrian?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    "ISO3166-2-lvl4"?: string;
  };
};

const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "pt-BR",
  "User-Agent": "HeliosAtlas/1.0 (geo-proxy; https://github.com/EdsonCandido/helios_altas)",
};

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCep(value: string): string {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length !== 8) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function parseCoord(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function stateFromNominatim(address: NominatimResult["address"]): string {
  if (!address) {
    return "";
  }
  const iso = address["ISO3166-2-lvl4"];
  if (iso?.includes("-")) {
    return iso.split("-")[1]!.toUpperCase();
  }
  return (address.state ?? "").slice(0, 2).toUpperCase();
}

function mapNominatim(result: NominatimResult): GeoAddress {
  const address = result.address ?? {};
  return {
    cep: address.postcode ? formatCep(address.postcode) : null,
    address: address.road ?? address.pedestrian ?? "",
    addressNumber: address.house_number ?? null,
    neighborhood: address.suburb ?? address.neighbourhood ?? address.city_district ?? "",
    city: address.city ?? address.town ?? address.village ?? address.municipality ?? "",
    state: stateFromNominatim(address),
    latitude: parseCoord(result.lat),
    longitude: parseCoord(result.lon),
  };
}

export class GeoService {
  async lookupCep(rawCep: string): Promise<GeoAddress> {
    const digits = onlyDigits(rawCep);
    if (digits.length !== 8) {
      throw new ValidationError("CEP must contain 8 digits.");
    }

    const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
    if (response.status === 404) {
      throw new CepNotFoundError();
    }
    if (!response.ok) {
      throw new ValidationError("Failed to lookup CEP.");
    }

    const payload = (await response.json()) as BrasilApiCepResponse;
    if (payload.message || !payload.city) {
      throw new CepNotFoundError();
    }

    let latitude = parseCoord(payload.location?.coordinates?.latitude);
    let longitude = parseCoord(payload.location?.coordinates?.longitude);

    const base: GeoAddress = {
      cep: formatCep(payload.cep ?? digits),
      address: payload.street ?? "",
      addressNumber: null,
      neighborhood: payload.neighborhood ?? "",
      city: payload.city ?? "",
      state: (payload.state ?? "").toUpperCase(),
      latitude,
      longitude,
    };

    if (latitude === null || longitude === null) {
      const query = [base.address, base.neighborhood, base.city, base.state, "Brasil"]
        .filter(Boolean)
        .join(", ");
      const geocoded = await this.forwardGeocode(query);
      if (geocoded) {
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }
    }

    return { ...base, latitude, longitude };
  }

  async reverse(lat: number, lng: number): Promise<GeoAddress> {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lng));
    url.searchParams.set("format", "json");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!response.ok) {
      throw new GeocodeNotFoundError();
    }

    const payload = (await response.json()) as NominatimResult & { error?: string };
    if (payload.error || !payload.address) {
      throw new GeocodeNotFoundError();
    }

    const mapped = mapNominatim(payload);
    return {
      ...mapped,
      latitude: lat,
      longitude: lng,
    };
  }

  private async forwardGeocode(query: string): Promise<{ latitude: number; longitude: number } | null> {
    if (!query.trim()) {
      return null;
    }

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "br");
    url.searchParams.set("addressdetails", "1");

    const response = await fetch(url, { headers: NOMINATIM_HEADERS });
    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as NominatimResult[];
    const first = results[0];
    if (!first) {
      return null;
    }

    const latitude = parseCoord(first.lat);
    const longitude = parseCoord(first.lon);
    if (latitude === null || longitude === null) {
      return null;
    }

    return { latitude, longitude };
  }
}

export const geoService = new GeoService();
