import { PlusCircle, X } from "lucide-react-native";
import { Text, View, TouchableOpacity } from "react-native";
import ModeOfTransport from "./ModeOfTransport";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COLORS } from "@/lib/theme";

interface LocationInfoCardProps {
  name: string;
  address?: string;
  eta?: string;
  distance?: string;
  distanceKm?: number;
  driveDurationMin?: number;
  onCreateActivity: () => void;
  onClose?: () => void;
}

export default function LocationInfoCard({
  name,
  address,
  eta,
  distance,
  distanceKm,
  driveDurationMin,
  onCreateActivity,
  onClose,
}: LocationInfoCardProps) {
  return (
    <Card className="absolute bottom-6 left-4 right-4 p-5 shadow-elevation-3 z-50">
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 mr-3">
          <Text
            className="text-heading-lg font-heading text-foreground mb-1"
            numberOfLines={1}
          >
            {name}
          </Text>
          {address && (
            <Text className="text-muted-foreground text-body-sm font-body" numberOfLines={2}>
              {address}
            </Text>
          )}
        </View>

        <View className="flex-row items-center gap-3">
          {(eta || distance) && (
            <View className="items-end">
              {eta && (
                <Text className="text-primary font-bold text-heading-md font-body">{eta}</Text>
              )}
              {distance && (
                <Text className="text-muted-foreground text-body-sm font-semibold font-body">
                  {distance}
                </Text>
              )}
            </View>
          )}

          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              className="p-1.5 rounded-full bg-muted/60 active:bg-muted"
              accessibilityLabel="Close location card"
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {distanceKm !== undefined && driveDurationMin !== undefined && (
        <ModeOfTransport
          distanceKm={distanceKm}
          driveDurationMin={driveDurationMin}
        />
      )}

      <Button
        onPress={onCreateActivity}
        variant="default"
        size="lg"
        className="mt-4 w-full"
      >
        <PlusCircle size={20} color="white" />
        <Text className="text-white font-bold text-body-md font-body ml-2">
          Create a New Activity
        </Text>
      </Button>
    </Card>
  );
}
