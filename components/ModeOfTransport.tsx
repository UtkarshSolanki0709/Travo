import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";

interface ModeOfTransportProps {
  distanceKm: number; // in kilometers
  driveDurationMin: number; // in minutes
  timeOfDay?: Date; // Optional: for time-based adjustments
  variant?: "light" | "dark";
}

const formatDuration = (minutes: number) => {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours} h ${mins > 0 ? `${mins} min` : ""}`.trim();
};

// Helper to determine if it's peak traffic time
const isPeakHour = (date: Date = new Date()) => {
  const hour = date.getHours();
  const day = date.getDay();

  // Weekend (0 = Sunday, 6 = Saturday)
  if (day === 0 || day === 6) return false;

  // Weekday peak hours: 7-9 AM and 5-7 PM
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
};

export default function ModeOfTransport({
  distanceKm,
  driveDurationMin,
  timeOfDay,
  variant = "light",
}: ModeOfTransportProps) {
  const isDarkCard = variant === "dark";

  const modes = useMemo(() => {
    const currentTime = timeOfDay || new Date();
    const isRushHour = isPeakHour(currentTime);

    // ==================
    // CAR/DRIVE
    // ==================
    let carDuration = driveDurationMin;
    if (isRushHour) {
      carDuration *= 1.3;
    } else {
      carDuration *= 1.1;
    }
    if (distanceKm > 2) {
      carDuration += 5;
    }

    // ==================
    // TRANSIT
    // ==================
    let transitDuration;
    if (distanceKm < 1.5) {
      transitDuration = driveDurationMin * 2.5;
    } else if (distanceKm < 5) {
      transitDuration = driveDurationMin * 1.8 + 12;
    } else if (distanceKm < 15) {
      transitDuration = driveDurationMin * 1.6 + 15;
    } else {
      transitDuration = driveDurationMin * 1.4 + 18;
    }
    if (isRushHour) {
      transitDuration *= 0.95;
    }

    // ==================
    // BIKE
    // ==================
    let bikeSpeed;
    if (distanceKm < 2) {
      bikeSpeed = 12;
    } else if (distanceKm < 8) {
      bikeSpeed = 16;
    } else if (distanceKm < 15) {
      bikeSpeed = 18;
    } else {
      bikeSpeed = 17;
    }
    let bikeDuration = (distanceKm / bikeSpeed) * 60 + 2;
    if (isRushHour && distanceKm < 10) {
      bikeDuration *= 1.1;
    }

    // ==================
    // WALK
    // ==================
    let walkSpeed;
    if (distanceKm < 0.5) {
      walkSpeed = 4.0;
    } else if (distanceKm < 2) {
      walkSpeed = 4.5;
    } else if (distanceKm < 5) {
      walkSpeed = 5.0;
    } else {
      walkSpeed = 4.8;
    }
    let walkDuration = (distanceKm / walkSpeed) * 60;
    const numberOfCrossings = Math.floor(distanceKm * 4);
    walkDuration += numberOfCrossings * 0.5;

    return [
      {
        id: "car",
        icon: "car-outline" as const,
        label: "Drive",
        duration: carDuration,
        iconColor: isDarkCard ? "#93c5fd" : "var(--color-info)",
      },
      {
        id: "transit",
        icon: "bus-outline" as const,
        label: "Transit",
        duration: transitDuration,
        iconColor: isDarkCard ? "#6ee7b7" : "var(--color-success)",
      },
      {
        id: "bike",
        icon: "bicycle-outline" as const,
        label: "Bike",
        duration: bikeDuration,
        iconColor: isDarkCard ? "#fdba74" : "var(--color-warning)",
      },
      {
        id: "walk",
        icon: "walk-outline" as const,
        label: "Walk",
        duration: walkDuration,
        iconColor: isDarkCard ? "#cbd5e1" : "var(--color-text-secondary)",
      },
    ];
  }, [distanceKm, driveDurationMin, timeOfDay, isDarkCard]);

  if (
    !Number.isFinite(distanceKm) ||
    !Number.isFinite(driveDurationMin) ||
    distanceKm < 0 ||
    driveDurationMin < 0
  )
    return null;

  return (
    <View
      className={`flex-row justify-between w-full mt-4 ${isDarkCard ? "bg-white/10" : "bg-background-elevated/50"} p-3 rounded-2xl border ${isDarkCard ? "border-white/10" : "border-border-divider/30"}`}
    >
      {modes.map((mode) => (
        <View key={mode.id} className="items-center justify-center flex-1">
          <View
            className={`${isDarkCard ? "bg-white/20" : "bg-background-surface"} p-2 rounded-full shadow-sm mb-1 border ${isDarkCard ? "border-white/10" : "border-border-divider/20"}`}
          >
            <Ionicons name={mode.icon} size={20} color={mode.iconColor} />
          </View>
          <Text
            className={`text-xs font-bold ${isDarkCard ? "text-white" : "text-text-primary"}`}
          >
            {formatDuration(mode.duration)}
          </Text>
          <Text
            className={`text-[10px] ${isDarkCard ? "text-white/60" : "text-text-secondary"} capitalize`}
          >
            {mode.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
