export type LatLng = { latitude: number; longitude: number };

const GEOAPIFY_API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_API_KEY;

const fetchWithTimeout = async (url: string, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export async function getRoute(
  origin: LatLng,
  destination: LatLng,
): Promise<{
  points: LatLng[];
  distanceKm: number;
  durationMin: number;
} | null> {
  if (!GEOAPIFY_API_KEY) {
    console.error("Geoapify API key is missing");
    return null;
  }

  try {
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destStr = `${destination.latitude},${destination.longitude}`;

    const url = `https://api.geoapify.com/v1/routing?waypoints=${originStr}|${destStr}&mode=drive&traffic=approximated&apiKey=${GEOAPIFY_API_KEY}`;

    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      console.error("Failed to fetch route from Geoapify", res.status);
      return null;
    }

    const data = await res.json();
    const feature = data.features?.[0];

    if (!feature) {
      return null;
    }

    const {properties} = feature;

    const distanceKm = properties.distance / 1000;
    const durationMin = properties.time / 60;

    

     const {geometry} = feature;
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

    return { points, distanceKm, durationMin };
  } catch (error) {
    console.error("getRoute error:", error);
    return null;
  }
}
