import { Car, Bus, Bike, Footprints } from "lucide-react-native";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { COLORS } from "@/lib/theme";

interface ModeOfTransportProps {
  distanceKm: number; // in kilometers
  driveDurationMin: number; // in minutes
  timeOfDay?: Date; // Optional: for time-based adjustments
}

const formatDuration = (minutes: number) => {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hours} h ${mins > 0 ? `${mins} min` : ""}`.trim();
};

const isPeakHour = (date: Date = new Date()) => {
  const hour = date.getHours();
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  return (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
};

export default function ModeOfTransport({
  distanceKm,
  driveDurationMin,
  timeOfDay,
}: ModeOfTransportProps) {
  const modes = useMemo(() => {
    const currentTime = timeOfDay || new Date();
    const isRushHour = isPeakHour(currentTime);

    let carDuration = driveDurationMin;
    if (isRushHour) {
      carDuration *= 1.3;
    } else {
      carDuration *= 1.1;
    }
    if (distanceKm > 2) {
      carDuration += 5;
    }

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
        Icon: Car,
        label: "Drive",
        duration: carDuration,
        iconColor: "#3b82f6",
      },
      {
        id: "transit",
        Icon: Bus,
        label: "Transit",
        duration: transitDuration,
        iconColor: "#10b981",
      },
      {
        id: "bike",
        Icon: Bike,
        label: "Bike",
        duration: bikeDuration,
        iconColor: "#f97316",
      },
      {
        id: "walk",
        Icon: Footprints,
        label: "Walk",
        duration: walkDuration,
        iconColor: COLORS.textSecondary,
      },
    ];
  }, [distanceKm, driveDurationMin, timeOfDay]);

  if (
    !Number.isFinite(distanceKm) ||
    !Number.isFinite(driveDurationMin) ||
    distanceKm < 0 ||
    driveDurationMin < 0
  )
    return null;

  return (
    <View className="flex-row justify-between w-full mt-4 bg-surface-elevated p-3 rounded-radius-md border border-border">
      {modes.map(({ id, Icon, label, duration, iconColor }) => (
        <View key={id} className="items-center justify-center flex-1">
          <View className="bg-surface p-2 rounded-full shadow-elevation-1 mb-1 border border-border">
            <Icon size={18} color={iconColor} />
          </View>
          <Text className="text-body-sm font-bold text-foreground font-body">
            {formatDuration(duration)}
          </Text>
          <Text className="text-[10px] text-muted-foreground capitalize font-body">
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}
