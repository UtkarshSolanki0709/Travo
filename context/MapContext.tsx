import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SelectedLocation extends Location {
  name?: string;
  formattedAddress?: string;
}

interface MapContextType {
  userLocation: Location | null;
  selectedLocation: SelectedLocation | null;
  radiusKm: number;
  setUserLocation: (location: Location | null) => void;
  setSelectedLocation: (location: SelectedLocation | null) => void;
  setRadiusKm: (radius: number) => void;
}

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocationState] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocationState] = useState<SelectedLocation | null>(null);
  const [radiusKm, setRadiusKmState] = useState<number>(5);

  const setUserLocation = useCallback((location: Location | null) => {
    setUserLocationState((prev) => {
      if (prev?.latitude === location?.latitude && prev?.longitude === location?.longitude) {
        return prev;
      }
      return location;
    });
  }, []);

  const setSelectedLocation = useCallback((location: SelectedLocation | null) => {
    setSelectedLocationState(location);
  }, []);

  const setRadiusKm = useCallback((radius: number) => {
    setRadiusKmState(radius);
  }, []);

  const value = useMemo(
    () => ({
      userLocation,
      selectedLocation,
      radiusKm,
      setUserLocation,
      setSelectedLocation,
      setRadiusKm,
    }),
    [userLocation, selectedLocation, radiusKm, setUserLocation, setSelectedLocation, setRadiusKm]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
