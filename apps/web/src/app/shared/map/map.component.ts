import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
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

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    if (!this.map) {
      return;
    }

    this.layer?.remove();
    this.layer = this.cluster ? L.markerClusterGroup() : L.layerGroup();

    for (const marker of this.markers) {
      L.circleMarker([marker.lat, marker.lng], { radius: 8, color: this.markerColor() })
        .bindPopup(marker.label)
        .addTo(this.layer);
    }

    this.layer.addTo(this.map);
    this.map.invalidateSize();
  }

  private markerColor(): string {
    return getComputedStyle(document.documentElement).getPropertyValue("--color-primary").trim();
  }
}
