import { Injectable, inject } from "@angular/core";
import { ApiClient } from "../../core/api/api-client";
import { onlyDigits } from "../br/cep.util";

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

@Injectable({ providedIn: "root" })
export class GeoApiService {
  private readonly api = inject(ApiClient);

  lookupCep(cep: string) {
    return this.api.get<GeoAddress>(`/geo/cep/${onlyDigits(cep)}`);
  }

  reverse(lat: number, lng: number) {
    return this.api.get<GeoAddress>("/geo/reverse", { lat, lng });
  }
}
