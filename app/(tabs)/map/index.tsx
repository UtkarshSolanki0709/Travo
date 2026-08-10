import ActivityDetailsModal from "@/components/ActivityDetailsModal";
import CreateActivityModal from "@/components/CreateActivityModal";
import LocationInfoCard from "@/components/LocationInfoCard";
import { SignOutButton } from "@/components/SignOutButton";
import { useMapContext } from "@/context/MapContext";
import { database, type Activity } from "@/services/database";
import { reverseGeocode, searchAll } from "@/services/geoapify";
import { getRoute, LatLng } from "@/services/routes";
import { useUser } from "@clerk/clerk-expo";
import { Crosshair, Menu, X, MapPin, User, ChevronRight, Search } from "lucide-react-native";
import { COLORS } from "@/lib/theme";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import debounce from "lodash.debounce";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

const MapScreen = () => {
  const {
    userLocation,
    selectedLocation,
    setSelectedLocation,
    setUserLocation: updateLocation,
  } = useMapContext();
  const mapRef = useRef<MapView>(null);
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // Local UI States
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [route, setRoute] = useState<{
    points: LatLng[];
    distanceKm: number;
    durationMin: number;
  } | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null,
  );
  const hasInitialized = useRef(false);
  const hasCentered = useRef(false);
  const trackingSubscription = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (trackingSubscription.current) {
        trackingSubscription.current.remove();
        trackingSubscription.current = null;
      }
    };
  }, []);

  const interestsRef = useRef<string[]>([]);
  const lastRoutePosition = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const lastRouteTimestamp = useRef<number>(0);
  const lastSelectedLocationId = useRef<string | null>(null);
  const ROUTE_DISTANCE_THRESHOLD = 0.05; // 50m
  const ROUTE_TIME_THRESHOLD = 15000; // 15s

  const fallbackRegion = {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  const startForegroundWatch = useCallback(
    async (userId: string) => {
      if (trackingSubscription.current) return;
      try {
        trackingSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000,
            distanceInterval: 50,
          },
          async (location) => {
            updateLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            try {
              await database.updateLiveLocation(
                userId,
                location.coords.latitude,
                location.coords.longitude,
                interestsRef.current,
              );
            } catch (err) {
              console.error("Foreground DB update failed", err);
            }
          },
        );
      } catch (e) {
        console.error("Failed to start foreground watch", e);
      }
    },
    [updateLocation],
  );

  const handleToggleLocation = useCallback(
    async (value: boolean) => {
      setIsLocationEnabled(value);

      if (!clerkUser) {
        if (value) setIsLocationEnabled(false);
        return;
      }

      try {
        if (value) {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") throw new Error("Permission denied");
          await startForegroundWatch(clerkUser.id);
          await database.updateProfile(clerkUser.id, {
            is_live_tracking: true,
            interests: interestsRef.current || [],
          });
        } else {
          if (trackingSubscription.current) {
            trackingSubscription.current.remove();
            trackingSubscription.current = null;
          }
          await database.updateProfile(clerkUser.id, {
            is_live_tracking: false,
            interests: interestsRef.current || [],
          });
          await SecureStore.deleteItemAsync("current_user_id");
        }
      } catch (error) {
        console.error("Toggle location failed", error);
        setIsLocationEnabled(false);
      }
    },
    [clerkUser, startForegroundWatch],
  );

  const debouncedSearch = useRef(
    debounce(async (text: string) => {
      if (text.trim().length >= 3) {
        const data = await searchAll(text, userLocation || undefined);
        setResults(data);
      } else {
        setResults([]);
      }
    }, 500),
  ).current;

  const handleSearch = (text: string) => {
    setQuery(text);
    if (text.trim().length === 0) {
      setResults([]);
      debouncedSearch.cancel();
      setSelectedLocation(null);

      const target = userLocation || fallbackRegion;
      mapRef.current?.animateToRegion(
        {
          ...target,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000,
      );
    } else {
      debouncedSearch(text);
    }
  };

  const handleSelectPlace = (place: any) => {
    const [lon, lat] = place.center;
    const newLocation = {
      latitude: lat,
      longitude: lon,
      name: place.place_name,
      formattedAddress: place.place_name,
    };
    setSelectedLocation(newLocation);
    setResults([]);
    setQuery(place.place_name);
    Keyboard.dismiss();

    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      800,
    );
  };

  const handlePoiClick = (event: any) => {
    const { coordinate, name } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      name: name,
      formattedAddress: name,
    });
    setQuery(name);
  };

  const handleLongPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const data = await reverseGeocode(latitude, longitude);
    const name =
      data?.place_name ||
      `Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;

    setSelectedLocation({
      latitude,
      longitude,
      name,
      formattedAddress: data?.place_name,
    });
    setQuery(name);
    setResults([]);
  };

  // Initialization Effect
  useEffect(() => {
    if (!clerkUser || hasInitialized.current) return;

    const init = async () => {
      hasInitialized.current = true;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          updateLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }

        const profile = await database.getProfile(clerkUser.id);
        if (profile) {
          interestsRef.current = profile.interests || [];
          if (profile.is_live_tracking) {
            handleToggleLocation(true);
          }
        }
      } catch (e) {
        console.error("App init failed", e);
      }
    };

    init();
  }, [clerkUser, handleToggleLocation, updateLocation]);

  // Centering effect
  useEffect(() => {
    const target = selectedLocation || userLocation;
    if (target && !hasCentered.current) {
      hasCentered.current = true;
      mapRef.current?.animateToRegion(
        {
          latitude: target.latitude,
          longitude: target.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000,
      );
    }
  }, [selectedLocation, userLocation]);

  const recenter = () => {
    const target = userLocation || fallbackRegion;
    mapRef.current?.animateToRegion(
      {
        latitude: target.latitude,
        longitude: target.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      },
      800,
    );
  };

  const lastActivityFetchPosition = useRef<{ latitude: number; longitude: number } | null>(null);
  const ACTIVITY_FETCH_DISTANCE_THRESHOLD = 0.5; // 500m

  const fetchActivities = useCallback(async () => {
    if (!userLocation) return;
    if (lastActivityFetchPosition.current) {
      const dist = database.calculateDistance(
        lastActivityFetchPosition.current.latitude,
        lastActivityFetchPosition.current.longitude,
        userLocation.latitude,
        userLocation.longitude,
      );
      if (dist < ACTIVITY_FETCH_DISTANCE_THRESHOLD) return;
    }

    try {
      const fetchedActivities = await database.getActivities({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radiusKm: 50,
        status: "upcoming",
      });
      setActivities(fetchedActivities);
      lastActivityFetchPosition.current = { ...userLocation };
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    }
  }, [userLocation]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useFocusEffect(
    useCallback(() => {
      fetchActivities();
      if (clerkUser) {
        database.getProfile(clerkUser.id).then(async (profile) => {
          if (profile) {
            interestsRef.current = profile.interests || [];
            setIsLocationEnabled(!!profile.is_live_tracking);

            if (profile.is_live_tracking) {
              try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                  const loc = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                  });
                  const coords = {
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                  };
                  updateLocation(coords);
                  await startForegroundWatch(clerkUser.id);
                  database.updateLiveLocation(
                    clerkUser.id,
                    coords.latitude,
                    coords.longitude,
                    interestsRef.current,
                  ).catch((err) => console.error("DB update failed on focus", err));
                }
              } catch (err) {
                console.error("Focus location update failed", err);
              }
            }
          }
        });
      }
    }, [fetchActivities, clerkUser, updateLocation, startForegroundWatch]),
  );

  const handleActivityCreated = () => {
    fetchActivities();
  };

  // Route fetching logic
  useEffect(() => {
    if (!userLocation || !selectedLocation) {
      setRoute(null);
      lastRoutePosition.current = null;
      lastRouteTimestamp.current = 0;
      lastSelectedLocationId.current = null;
      return;
    }

    const run = async () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastRouteTimestamp.current;
      const selectedId =
        selectedLocation.formattedAddress ||
        `${selectedLocation.latitude}-${selectedLocation.longitude}`;
      const destinationChanged = selectedId !== lastSelectedLocationId.current;

      if (!destinationChanged && lastRoutePosition.current) {
        const distanceMoved = database.calculateDistance(
          lastRoutePosition.current.latitude,
          lastRoutePosition.current.longitude,
          userLocation.latitude,
          userLocation.longitude,
        );

        if (
          distanceMoved < ROUTE_DISTANCE_THRESHOLD &&
          timeSinceLastFetch < ROUTE_TIME_THRESHOLD
        ) {
          return;
        }
      }

      const result = await getRoute(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        },
      );
      setRoute(result);
      lastRoutePosition.current = {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
      lastRouteTimestamp.current = now;
      lastSelectedLocationId.current = selectedId;
    };

    run();
  }, [userLocation, selectedLocation]);

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={{ flex: 1 }}
        onLongPress={handleLongPress}
        onPoiClick={handlePoiClick}
        onPress={(event) => {
          Keyboard.dismiss();
          setResults([]);
          if (event.nativeEvent.action === "marker-press") return;
        }}
        initialRegion={fallbackRegion}
        showsTraffic={true}
        showsUserLocation={true}
        showsMyLocationButton={false}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        showsCompass={true}
        showsPointsOfInterest={true}
        showsBuildings={true}
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title={selectedLocation.name || "Selected Location"}
            pinColor="red"
          />
        )}
        {route && (
          <>
            <Polyline
              coordinates={route.points}
              strokeWidth={10}
              strokeColor="rgba(79, 70, 229, 0.2)"
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={route.points}
              strokeWidth={7}
              strokeColor="#ffffff"
              lineCap="round"
              lineJoin="round"
            />
            <Polyline
              coordinates={route.points}
              strokeWidth={5}
              strokeColor="#4f46e5"
              lineCap="round"
              lineJoin="round"
            />
          </>
        )}
        {activities.map((activity) => (
          <Marker
            key={activity.id}
            coordinate={{
              latitude: activity.latitude,
              longitude: activity.longitude,
            }}
            title={activity.title}
            description={activity.activity_type || activity.interests?.[0]}
            pinColor="green"
            onPress={() => {
              setSelectedActivity(activity);
              setSelectedLocation({
                latitude: activity.latitude,
                longitude: activity.longitude,
                name: activity.title,
                formattedAddress: activity.city || activity.activity_type || "",
              });
              setQuery(activity.title);
            }}
          />
        ))}
      </MapView>

      <ActivityDetailsModal
        activity={selectedActivity}
        visible={!!selectedActivity}
        onClose={() => setSelectedActivity(null)}
      />

      {/* Recenter Button */}
      <View pointerEvents="box-none" className="absolute right-4 bottom-32 z-30">
        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full bg-surface border border-border shadow-elevation-2"
          onPress={recenter}
        >
          <Crosshair size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Unified Top Controls Bar: Search Input + Floating Menu Button */}
      <View pointerEvents="box-none" className="absolute left-4 right-4 top-12 z-30 flex-row items-start gap-2">
        <View className="flex-1 rounded-radius-lg bg-surface/95 p-2 shadow-elevation-2 border border-border">
          <View className="flex-row items-center h-10 px-3 rounded-radius-md bg-surface-elevated border border-border">
            <Search size={18} color={COLORS.textSecondary} className="mr-2" />
            <TextInput
              placeholder="Search for a place, cafe, etc..."
              placeholderTextColor={COLORS.textSecondary}
              value={query}
              onChangeText={handleSearch}
              multiline={false}
              numberOfLines={1}
              className="flex-1 text-body-md text-foreground font-body p-0 h-full"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")} className="p-1">
                <X size={16} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {results.length > 0 && (
            <FlatList
              data={results}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              keyboardShouldPersistTaps="handled"
              className="mt-2 max-h-56 border-t border-border"
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="border-b border-border/50 py-2.5 px-1"
                  onPress={() => handleSelectPlace(item)}
                >
                  <Text className="text-body-sm text-foreground font-body" numberOfLines={2}>
                    {item.place_name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>

        <TouchableOpacity
          className="h-12 w-12 items-center justify-center rounded-full bg-surface border border-border shadow-elevation-2"
          onPress={() => setIsMenuOpen(true)}
        >
          <Menu size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      {selectedLocation && (
        <LocationInfoCard
          name={selectedLocation.name || "Selected Location"}
          address={selectedLocation.formattedAddress}
          eta={route ? `${Math.round(route.durationMin)} min` : undefined}
          distance={route ? `${route.distanceKm.toFixed(1)} km` : undefined}
          distanceKm={route?.distanceKm}
          driveDurationMin={route?.durationMin}
          onCreateActivity={() => setIsCreateModalVisible(true)}
          onClose={() => {
            setSelectedLocation(null);
            setRoute(null);
            setQuery("");
          }}
        />
      )}

      {/* Menu Modal */}
      <Modal transparent visible={isMenuOpen} animationType="fade">
        <Pressable
          className="flex-1 bg-black/30"
          onPress={() => setIsMenuOpen(false)}
        />
        <View className="absolute right-4 top-24 w-72 rounded-radius-lg bg-surface p-4 shadow-elevation-4 border border-border">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-heading-md font-heading text-foreground">
              Map Menu
            </Text>
            <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
              <X size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>
          <View className="mb-3 rounded-radius-md bg-surface-elevated px-3 py-3 border border-border">
            <Text className="mb-2 text-body-sm font-semibold uppercase tracking-wide text-muted-foreground font-body">
              Quick Settings
            </Text>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MapPin size={18} color={COLORS.primary} />
                <Text className="ml-2 text-body-md font-semibold text-foreground font-body">
                  Live Tracking
                </Text>
              </View>
              <Switch
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={isLocationEnabled ? COLORS.surface : COLORS.border}
                onValueChange={handleToggleLocation}
                value={isLocationEnabled}
                disabled={!clerkUser}
              />
            </View>
          </View>
          <TouchableOpacity
            className="flex-row items-center justify-between py-3"
            onPress={() => {
              setIsMenuOpen(false);
              router.push("/profile");
            }}
          >
            <View className="flex-row items-center">
              <User size={18} color={COLORS.primary} />
              <Text className="ml-2 text-body-md font-semibold text-foreground font-body">
                Account Settings
              </Text>
            </View>
            <ChevronRight size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
          {clerkUser ? (
            <View className="mt-2 rounded-xl bg-slate-50">
              <SignOutButton />
            </View>
          ) : (
            <TouchableOpacity
              className="mt-2 rounded-xl bg-indigo-50 px-4 py-3"
              onPress={() => {
                setIsMenuOpen(false);
                router.push("/sign-in");
              }}
            >
              <Text className="text-sm font-semibold text-indigo-600">
                Sign in for more
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>

      {/* Create Activity Modal */}
      <CreateActivityModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        initialLocation={
          selectedLocation
            ? {
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
                city: selectedLocation.formattedAddress,
              }
            : userLocation
              ? {
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  city: undefined,
                }
              : undefined
        }
        onActivityCreated={handleActivityCreated}
      />
    </View>
  );
};

export default MapScreen;
