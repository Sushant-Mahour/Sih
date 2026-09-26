import React from 'react';

/**
 * High-Resolution Vector Basemap for India's North Eastern Region
 * Bounding Box: North 29.5, South 21.5, West 88.0, East 97.5
 * Coordinate Space: 1000 x 842
 */

export const NER_BOUNDS = {
  north: 29.5,
  south: 21.5,
  west: 88.0,
  east: 97.5,
  width: 1000,
  height: 842
};

export function projectLatLng(lat, lng, width = NER_BOUNDS.width, height = NER_BOUNDS.height) {
  const x = ((lng - NER_BOUNDS.west) / (NER_BOUNDS.east - NER_BOUNDS.west)) * width;
  const y = ((NER_BOUNDS.north - lat) / (NER_BOUNDS.north - NER_BOUNDS.south)) * height;
  return { x, y };
}

export function StaticBasemapSvg({ mode = 'static' }) {
  // SVG coordinates for NER 8 States
  return (
    <svg
      viewBox={`0 0 ${NER_BOUNDS.width} ${NER_BOUNDS.height}`}
      className="w-full h-full select-none"
      style={{ minWidth: `${NER_BOUNDS.width}px`, minHeight: `${NER_BOUNDS.height}px` }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Terrain Gradient */}
        <linearGradient id="terrainHills" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--bg-subtle)" stopOpacity="0.9" />
          <stop offset="50%" stopColor="var(--border-subtle)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="var(--bg-subtle)" stopOpacity="0.9" />
        </linearGradient>

        <pattern id="gridPattern" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--border-subtle)" strokeWidth="0.5" strokeOpacity="0.4" />
        </pattern>
      </defs>

      {/* Base Canvas */}
      <rect width="1000" height="842" fill="var(--bg-subtle)" />
      <rect width="1000" height="842" fill="url(#gridPattern)" />

      {/* State Geometries (Simplified Polygons in NER Bounds) */}
      <g id="state-boundaries" stroke="var(--border-strong)" strokeWidth="1.2" strokeLinejoin="round">
        {/* Sikkim (NW) */}
        <polygon
          points="55,170 80,165 95,210 85,250 50,240"
          fill="var(--bg-elevated)"
          fillOpacity="0.75"
        />
        <text x="65" y="210" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.05em">SIKKIM</text>

        {/* Arunachal Pradesh (North & East) */}
        <polygon
          points="360,90 550,60 760,110 920,220 880,310 740,310 630,260 510,250 400,260 360,200 370,140"
          fill="var(--bg-elevated)"
          fillOpacity="0.8"
        />
        <text x="570" y="170" fontSize="12" fontWeight="700" fill="var(--text-muted)" letterSpacing="0.08em">ARUNACHAL PRADESH</text>

        {/* Assam (Central Brahmaputra Valley) */}
        <polygon
          points="240,310 390,300 510,270 630,280 740,320 800,340 760,400 680,430 580,430 480,400 380,400 300,420 220,380 200,340"
          fill="var(--bg-elevated)"
          fillOpacity="0.85"
        />
        <text x="440" y="360" fontSize="14" fontWeight="700" fill="var(--text-muted)" letterSpacing="0.1em">ASSAM</text>

        {/* Meghalaya (South of Assam) */}
        <polygon
          points="240,430 460,410 490,480 430,510 260,510 230,460"
          fill="var(--bg-elevated)"
          fillOpacity="0.75"
        />
        <text x="320" y="470" fontSize="11" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.06em">MEGHALAYA</text>

        {/* Nagaland (East) */}
        <polygon
          points="620,380 720,360 730,460 660,500 610,440"
          fill="var(--bg-elevated)"
          fillOpacity="0.75"
        />
        <text x="640" y="440" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.05em">NAGALAND</text>

        {/* Manipur (South of Nagaland) */}
        <polygon
          points="600,490 660,490 670,610 590,620 570,540"
          fill="var(--bg-elevated)"
          fillOpacity="0.75"
        />
        <text x="605" y="560" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.05em">MANIPUR</text>

        {/* Mizoram (South) */}
        <polygon
          points="470,550 550,550 560,730 470,740 450,620"
          fill="var(--bg-elevated)"
          fillOpacity="0.75"
        />
        <text x="485" y="650" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.05em">MIZORAM</text>

        {/* Tripura (SW) */}
        <polygon
          points="310,540 390,530 400,660 320,650 300,580"
          fill="var(--bg-elevated)"
          fillOpacity="0.75"
        />
        <text x="330" y="610" fontSize="10" fontWeight="600" fill="var(--text-muted)" letterSpacing="0.05em">TRIPURA</text>
      </g>

      {/* Major River Arteries (Brahmaputra, Barak, Teesta) */}
      <g id="rivers" fill="none" stroke="var(--accent)" strokeOpacity="0.3" strokeLinecap="round">
        {/* Brahmaputra River */}
        <path d="M 880,240 Q 740,320 620,330 T 420,360 T 260,390 T 180,450" strokeWidth="4.5" />
        {/* Barak River */}
        <path d="M 640,510 Q 560,520 480,510 T 360,540" strokeWidth="2.5" />
        {/* Teesta River */}
        <path d="M 75,160 Q 85,230 110,290" strokeWidth="2" />
      </g>

      {/* Major Mountain Contour Ridges */}
      <g id="mountain-ridges" fill="none" stroke="var(--text-muted)" strokeOpacity="0.2" strokeDasharray="3 3">
        <path d="M 360,110 Q 500,160 700,140" strokeWidth="1.5" />
        <path d="M 400,200 Q 580,220 800,210" strokeWidth="1.5" />
        <path d="M 260,470 Q 380,460 480,470" strokeWidth="1.5" />
      </g>

      {/* Pre-drawn Major Corridors (Base Infrastructure Layer) */}
      <g id="major-highways" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* NH-27 / NH-15 Valley Trunk */}
        <path d="M 393,353 L 493,332 L 600,320 L 727,213" stroke="var(--border-strong)" strokeWidth="3" />
        {/* NH-6 Guwahati-Shillong-Silchar */}
        <path d="M 393,353 L 410,412 L 505,491" stroke="var(--border-strong)" strokeWidth="3" />
        {/* NH-29 / NH-2 Dimapur-Kohima-Imphal */}
        <path d="M 602,378 L 643,402 L 625,493" stroke="var(--border-strong)" strokeWidth="3" />
        {/* NH-8 Silchar-Agartala */}
        <path d="M 505,491 L 346,596" stroke="var(--border-strong)" strokeWidth="3" />
        {/* NH-306 / NH-54 Silchar-Aizawl */}
        <path d="M 505,491 L 496,607" stroke="var(--border-strong)" strokeWidth="3" />
        {/* NH-13 Trans-Arunachal Sela Pass */}
        <path d="M 590,254 L 407,201" stroke="var(--border-strong)" strokeWidth="2.5" strokeDasharray="4 3" />
      </g>

      {/* Primary City / Hub Labels */}
      <g id="city-labels" fontSize="10" fontWeight="600" fill="var(--text-secondary)">
        <circle cx="393" cy="353" r="3.5" fill="var(--accent)" />
        <text x="402" y="356">Guwahati (HQ)</text>

        <circle cx="410" cy="412" r="3" fill="var(--accent)" />
        <text x="418" y="416">Shillong</text>

        <circle cx="505" cy="491" r="3" fill="var(--accent)" />
        <text x="513" y="495">Silchar</text>

        <circle cx="590" cy="254" r="3" fill="var(--accent)" />
        <text x="598" y="258">Itanagar</text>

        <circle cx="407" cy="201" r="3" fill="var(--danger)" />
        <text x="415" y="204">Tawang (Sela Pass)</text>

        <circle cx="643" cy="402" r="3" fill="var(--accent)" />
        <text x="651" y="406">Kohima</text>

        <circle cx="625" cy="493" r="3" fill="var(--accent)" />
        <text x="633" y="497">Imphal</text>

        <circle cx="496" cy="607" r="3" fill="var(--accent)" />
        <text x="504" y="611">Aizawl</text>

        <circle cx="346" cy="596" r="3" fill="var(--accent)" />
        <text x="354" y="600">Agartala</text>

        <circle cx="64" cy="227" r="3" fill="var(--accent)" />
        <text x="72" y="231">Gangtok</text>

        <circle cx="727" cy="213" r="3" fill="var(--accent)" />
        <text x="735" y="217">Dibrugarh</text>
      </g>
    </svg>
  );
}

export default StaticBasemapSvg;
