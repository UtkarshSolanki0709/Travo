import { Ionicons } from "@expo/vector-icons";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const INITIAL_INTERESTS = [
  "Clubbing",
  "Cafe Hopping",
  "Museums",
  "Hiking",
  "Beach",
  "Going to new places",
  "Shopping",
  "Dining",
  "Outdoor Sports",
  "Live Music",
  "Art Galleries",
];

interface InterestsSectionProps {
  selectedInterests: string[];
  customInterest: string;
  onCustomInterestChange: (text: string) => void;
  onAddCustomInterest: () => void;
  onToggleInterest: (interest: string) => void;
}

export default function InterestsSection({
  selectedInterests,
  customInterest,
  onCustomInterestChange,
  onAddCustomInterest,
  onToggleInterest,
}: InterestsSectionProps) {
  return (
    <View className="bg-background-surface rounded-3xl p-5 mb-5 shadow-custom border border-border-divider">
      <Text className="text-lg font-semibold text-text-primary mb-4">
        Interests
      </Text>

      <View className="flex-row gap-2.5 mb-4">
        <TextInput
          className="flex-1 bg-input-background border border-border-divider rounded-xl px-4 py-2.5 text-[15px] text-text-primary focus:border-input-focus"
          placeholder="Add your own interest..."
          placeholderTextColor="var(--color-text-disabled)"
          value={customInterest}
          onChangeText={onCustomInterestChange}
          onSubmitEditing={onAddCustomInterest}
        />
        <TouchableOpacity
          className="bg-brand-primary w-11 h-11 rounded-xl justify-center items-center"
          onPress={onAddCustomInterest}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-2.5">
        {selectedInterests.map((interest) => (
          <TouchableOpacity
            key={interest}
            className="px-3.5 py-2 rounded-full bg-brand-primary border border-brand-primary active:bg-brand-primary-pressed"
            onPress={() => onToggleInterest(interest)}
          >
            <Text className="text-sm text-text-on-primary font-medium">
              {interest}
            </Text>
          </TouchableOpacity>
        ))}

        {INITIAL_INTERESTS.filter((i) => !selectedInterests.includes(i)).map(
          (interest) => (
            <TouchableOpacity
              key={interest}
              className="px-3.5 py-2 rounded-full bg-background-elevated border border-border-divider active:bg-background-surface"
              onPress={() => onToggleInterest(interest)}
            >
              <Text className="text-sm text-text-secondary">{interest}</Text>
            </TouchableOpacity>
          ),
        )}
      </View>
    </View>
  );
}
