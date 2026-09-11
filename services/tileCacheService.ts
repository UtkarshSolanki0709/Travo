import * as FileSystem from "expo-file-system/legacy";
import { config } from "@/lib/config";

const TILE_DIR = `${FileSystem.documentDirectory}map_tiles/`;

// Standard Web Mercator (Slippy Map) tile coordinate math
function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

export const tileCacheService = {
  /**
   * Ensures the local map tile storage directory exists
   */
  async ensureDirectory(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(TILE_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(TILE_DIR, { intermediates: true });
    }
  },

  /**
   * Constructs the remote URL for a given tile coordinate
   */
  getRemoteTileUrl(z: number, x: number, y: number): string {
    if (config.geoapifyKey) {
      return `https://maps.geoapify.com/v1/tile/osm-bright/${z}/${x}/${y}.png?apiKey=${config.geoapifyKey}`;
    }
    // High-performance OpenStreetMap / CartoDB fallback tile server
    return `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
  },

  /**
   * Local file URI for a given tile coordinate
   */
  getLocalTileUri(z: number, x: number, y: number): string {
    return `${TILE_DIR}${z}_${x}_${y}.png`;
  },

  /**
   * Path template compatible with react-native-maps LocalTile
   */
  getLocalPathTemplate(): string {
    return `${TILE_DIR}{z}_{x}_{y}.png`;
  },

  /**
   * Downloads and caches a single map tile
   */
  async cacheTile(z: number, x: number, y: number): Promise<string> {
    await this.ensureDirectory();
    const localUri = this.getLocalTileUri(z, x, y);
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (fileInfo.exists) {
      return localUri;
    }

    const remoteUrl = this.getRemoteTileUrl(z, x, y);
    try {
      const downloadRes = await FileSystem.downloadAsync(remoteUrl, localUri);
      return downloadRes.uri;
    } catch (err) {
      console.warn(`Failed to download tile ${z}/${x}/${y}:`, err);
      return remoteUrl;
    }
  },

  /**
   * Pre-caches all map tiles for a geographic area (e.g. current location or destination)
   * across multiple zoom levels (default 12 to 14) for 100% offline exploration.
   */
  async downloadRegionTiles(
    lat: number,
    lon: number,
    radiusKm: number = 3,
    zoomLevels: number[] = [12, 13, 14],
    onProgress?: (downloaded: number, total: number) => void
  ): Promise<{ success: boolean; tileCount: number }> {
    await this.ensureDirectory();

    const latDelta = radiusKm / 111;
    const lonDelta =
      radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    const minLat = lat - latDelta;
    const maxLat = lat + latDelta;
    const minLon = lon - lonDelta;
    const maxLon = lon + lonDelta;

    const tileList: { z: number; x: number; y: number }[] = [];

    for (const z of zoomLevels) {
      const minX = lon2tile(minLon, z);
      const maxX = lon2tile(maxLon, z);
      const minY = lat2tile(maxLat, z);
      const maxY = lat2tile(minLat, z);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          tileList.push({ z, x, y });
        }
      }
    }

    let completed = 0;
    const total = tileList.length;

    // Batch download with concurrency limit of 4 to prevent network saturation
    const CONCURRENCY = 4;
    for (let i = 0; i < total; i += CONCURRENCY) {
      const chunk = tileList.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map(async ({ z, x, y }) => {
          await this.cacheTile(z, x, y);
          completed++;
          onProgress?.(completed, total);
        })
      );
    }

    return { success: true, tileCount: completed };
  },

  /**
   * Retrieves tile cache statistics (number of tiles and size in megabytes)
   */
  async getCacheStats(): Promise<{ count: number; sizeMb: number }> {
    try {
      await this.ensureDirectory();
      const files = await FileSystem.readDirectoryAsync(TILE_DIR);
      let totalBytes = 0;

      for (const file of files) {
        const info = await FileSystem.getInfoAsync(`${TILE_DIR}${file}`);
        if (info.exists && "size" in info && typeof info.size === "number") {
          totalBytes += info.size;
        }
      }

      return {
        count: files.length,
        sizeMb: parseFloat((totalBytes / (1024 * 1024)).toFixed(2)),
      };
    } catch {
      return { count: 0, sizeMb: 0 };
    }
  },

  /**
   * Clears all cached offline map tiles
   */
  async clearCache(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(TILE_DIR);
    if (dirInfo.exists) {
      await FileSystem.deleteAsync(TILE_DIR, { idempotent: true });
    }
    await this.ensureDirectory();
  },
};
