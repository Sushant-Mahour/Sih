import React from 'react';
import { Layers } from 'lucide-react';
import { useUIStore } from '../../features/useUIStore';

export function MapLegend() {
  const { mapLayers, toggleMapLayer } = useUIStore();

  return (
    <div className="p-3 rounded-lg bg-bg-elevated border border-border-subtle shadow-sm text-xs space-y-2 max-w-xs">
      <div className="flex items-center justify-between border-b border-border-subtle pb-1 font-semibold text-text-primary text-[11px]">
        <span className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-accent" /> Active Overlays
        </span>
        <span className="text-[10px] text-text-muted font-mono">NRSC / BRO</span>
      </div>

      {/* Layer Toggles */}
      <div className="space-y-1.5 text-text-secondary">
        <label className="flex items-center justify-between hover:text-text-primary cursor-pointer select-none">
          <span className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-1 bg-success rounded" /> Road Corridors
          </span>
          <input
            type="checkbox"
            checked={mapLayers.roadRisk}
            onChange={() => toggleMapLayer('roadRisk')}
            className="rounded border-border-subtle text-accent focus:ring-accent"
          />
        </label>

        <label className="flex items-center justify-between hover:text-text-primary cursor-pointer select-none">
          <span className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-accent live-dot" /> Live Fleet (GPS)
          </span>
          <input
            type="checkbox"
            checked={mapLayers.activeConvoys}
            onChange={() => toggleMapLayer('activeConvoys')}
            className="rounded border-border-subtle text-accent focus:ring-accent"
          />
        </label>
      </div>
    </div>
  );
}

export default MapLegend;
