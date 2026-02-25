interface StaticMapWidgetProps {
  latitude: number;
  longitude: number;
}

export default function StaticMapWidget({ latitude, longitude }: StaticMapWidgetProps) {
  const hasCoords = latitude !== 0 || longitude !== 0;

  // Normalize lat/lng to a grid position within the widget
  // lat: -90 to 90, lng: -180 to 180
  const pinX = hasCoords ? ((longitude + 180) / 360) * 100 : 50;
  const pinY = hasCoords ? ((90 - latitude) / 180) * 100 : 50;

  // Clamp to safe range
  const clampedX = Math.max(5, Math.min(95, pinX));
  const clampedY = Math.max(5, Math.min(90, pinY));

  return (
    <div className="space-y-3">
      {/* Map grid */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/30 dark:to-indigo-950/30">
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          {/* Horizontal lines */}
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={`h-${y}`} x1="0" y1={`${y}%`} x2="100%" y2={`${y}%`} stroke="#3b82f6" strokeWidth="1" />
          ))}
          {/* Vertical lines */}
          {[0, 25, 50, 75, 100].map((x) => (
            <line key={`v-${x}`} x1={`${x}%`} y1="0" x2={`${x}%`} y2="100%" stroke="#3b82f6" strokeWidth="1" />
          ))}
          {/* Equator */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" />
          {/* Prime meridian */}
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" />
        </svg>

        {/* Continent-like shapes for visual context */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="30%" cy="40%" rx="12%" ry="8%" fill="#3b82f6" />
          <ellipse cx="50%" cy="35%" rx="18%" ry="10%" fill="#3b82f6" />
          <ellipse cx="72%" cy="38%" rx="10%" ry="7%" fill="#3b82f6" />
          <ellipse cx="55%" cy="60%" rx="8%" ry="12%" fill="#3b82f6" />
          <ellipse cx="25%" cy="65%" rx="6%" ry="8%" fill="#3b82f6" />
          <ellipse cx="80%" cy="55%" rx="5%" ry="6%" fill="#3b82f6" />
        </svg>

        {/* Pin */}
        {hasCoords && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full"
            style={{ left: `${clampedX}%`, top: `${clampedY}%` }}
          >
            <div className="relative">
              {/* Pin shadow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-1 bg-black/20 rounded-full blur-sm" />
              {/* Pin body */}
              <div className="w-7 h-7 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>
              {/* Pin tail */}
              <div className="w-0 h-0 mx-auto border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500" />
            </div>
          </div>
        )}

        {/* No coords placeholder */}
        {!hasCoords && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full">
              No coordinates set
            </p>
          </div>
        )}

        {/* Compass */}
        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center text-xs font-bold text-primary">
          N
        </div>
      </div>

      {/* Coordinates display */}
      <div className="flex gap-3">
        <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Latitude</p>
          <p className="text-sm font-mono font-medium text-foreground">
            {hasCoords ? latitude.toFixed(6) : '—'}
          </p>
        </div>
        <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
          <p className="text-xs text-muted-foreground">Longitude</p>
          <p className="text-sm font-mono font-medium text-foreground">
            {hasCoords ? longitude.toFixed(6) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
