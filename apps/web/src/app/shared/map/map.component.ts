import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import * as L from "leaflet";
import "leaflet.markercluster";

@Component({
  selector: "app-map",
  template: `<div #map class="map" role="img" [attr.aria-label]="label"></div>`,
})
export class MapComponent implements AfterViewInit, OnChanges {
  @ViewChild("map", { static: true }) mapEl!: ElementRef<HTMLDivElement>;
  @Input() label = "Mapa";
  @Input() center: [number, number] = [-23.55, -46.63];
  @Input() zoom = 12;
  @Input() markers: Array<{ lat: number; lng: number; label: string }> = [];
  @Input() cluster = false;
  @Input() clickable = false;
  @Input() draggable = false;
  @Output() pick = new EventEmitter<{ lat: number; lng: number }>();

  private map?: L.Map;
  private layer?: L.LayerGroup;

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement).setView(this.center, this.zoom);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(this.map);

    if (this.clickable) {
      this.map.on("click", (event: L.LeafletMouseEvent) => {
        this.pick.emit({ lat: event.latlng.lat, lng: event.latlng.lng });
      });
    }

    this.render();
    queueMicrotask(() => this.map?.invalidateSize());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.map) {
      return;
    }

    if (changes["center"] && this.center) {
      const [lat, lng] = this.center;
      const current = this.map.getCenter();
      if (Math.abs(current.lat - lat) > 1e-6 || Math.abs(current.lng - lng) > 1e-6) {
        this.map.setView([lat, lng], this.zoom);
      }
    }

    this.render();
  }

  private render(): void {
    if (!this.map) {
      return;
    }

    this.layer?.remove();
    this.layer = this.cluster ? L.markerClusterGroup() : L.layerGroup();
    const color = this.markerColor();

    for (const marker of this.markers) {
      if (this.draggable && !this.cluster) {
        const pin = L.marker([marker.lat, marker.lng], {
          draggable: true,
          icon: L.divIcon({
            className: "map-pin",
            html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          }),
        }).bindPopup(marker.label);

        pin.on("dragend", () => {
          const position = pin.getLatLng();
          this.pick.emit({ lat: position.lat, lng: position.lng });
        });

        pin.addTo(this.layer);
      } else {
        L.circleMarker([marker.lat, marker.lng], { radius: 8, color })
          .bindPopup(marker.label)
          .addTo(this.layer);
      }
    }

    this.layer.addTo(this.map);
    this.map.invalidateSize();
  }

  private markerColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim() || "#2563eb";
  }
}
