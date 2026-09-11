import { config } from "@/lib/config";
import { fetchGeoapify } from "./geoFetch";
import { getDb } from "./localDb";

export type LatLng = { latitude: number; longitude: number };
export type TravelMode = "drive" | "walk" | "bicycle" | "transit";

export interface RouteResult {
  points: LatLng[];
  distanceKm: number;
  durationMin: number;
  mode?: TravelMode;
}

const GEOAPIFY_API_KEY = config.geoapifyKey;

function getCacheKey(origin: LatLng, destination: LatLng, mode: TravelMode): string {
  return `${mode}_${origin.latitude.toFixed(4)},${origin.longitude.toFixed(4)}_${destination.latitude.toFixed(4)},${destination.longitude.toFixed(4)}`;
}

export async function getRoute(
  origin: LatLng,
  destination: LatLng,
  mode: TravelMode = "drive",
): Promise<RouteResult | null> {
  const cacheKey = getCacheKey(origin, destination, mode);

  // 1. Try to read from local SQLite cache first for offline speed
  try {
    const db = await getDb();
    const cached = await db.getFirstAsync<{
      points_json: string;
      distance_km: number;
      duration_min: number;
      created_at: string;
    }>("SELECT * FROM routes_cache WHERE id = ?", [cacheKey]);

    if (cached) {
      const ageHours =
        (Date.now() - new Date(cached.created_at).getTime()) / (1000 * 60 * 60);
      if (ageHours < 24) {
        return {
          points: JSON.parse(cached.points_json),
          distanceKm: cached.distance_km,
          durationMin: cached.duration_min,
          mode,
        };
      }
    }
  } catch (_dbErr) {
    // Non-fatal, proceed with network fetch
  }

  if (!GEOAPIFY_API_KEY) {
    console.error("Geoapify API key is missing");
    return null;
  }

  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    const queryParams: Record<string, string | number> = {
      waypoints: `${originStr}|${destStr}`,
      mode,
      apiKey: GEOAPIFY_API_KEY,
    };
    if (mode === "drive") {
      queryParams.traffic = "approximated";
    }

    const res = await fetchGeoapify("v1/routing", queryParams);

    if (!res.ok) {
      console.error("Failed to fetch route from Geoapify", res.status);
      // Offline fallback: try to return stale cache if available
      try {
        const db = await getDb();
        const fallback = await db.getFirstAsync<{
          points_json: string;
          distance_km: number;
          duration_min: number;
        }>("SELECT * FROM routes_cache WHERE id = ?", [cacheKey]);
        if (fallback) {
          return {
            points: JSON.parse(fallback.points_json),
            distanceKm: fallback.distance_km,
            durationMin: fallback.duration_min,
            mode,
          };
        }
      } catch {}
      return null;
    }

    const data = await res.json();
    const feature = data.features?.[0];

    if (!feature) {
      return null;
    }

    const { properties, geometry } = feature;
    const distanceKm = properties.distance / 1000;
    const durationMin = properties.time / 60;

    let rawPoints: number[][] = [];
    if (geometry.type === "LineString") {
      rawPoints = geometry.coordinates;
    } else if (geometry.type === "MultiLineString") {
      geometry.coordinates.forEach((segment: number[][]) => {
        rawPoints.push(...segment);
      });
    }

    const points: LatLng[] = rawPoints.map((p) => ({
      latitude: p[1],
      longitude: p[0],
    }));

    const result: RouteResult = { points, distanceKm, durationMin, mode };

    // Persist to local SQLite cache for offline availability
    try {
      const db = await getDb();
      await db.runAsync(
        `INSERT OR REPLACE INTO routes_cache (id, points_json, distance_km, duration_min, created_at)
         VALUES (?, ?, ?, ?, ?)`,
        [
          cacheKey,
          JSON.stringify(points),
          distanceKm,
          durationMin,
          new Date().toISOString(),
        ]
      );
    } catch (saveErr) {
      console.warn("Failed to cache route locally:", saveErr);
    }

    return result;
  } catch (error) {
    console.error("getRoute error:", error);
    // Offline fallback from local cache
    try {
      const db = await getDb();
      const fallback = await db.getFirstAsync<{
        points_json: string;
        distance_km: number;
        duration_min: number;
      }>("SELECT * FROM routes_cache WHERE id = ?", [cacheKey]);
      if (fallback) {
        return {
          points: JSON.parse(fallback.points_json),
          distanceKm: fallback.distance_km,
          durationMin: fallback.duration_min,
          mode,
        };
      }
    } catch {}
    return null;
  }
}
