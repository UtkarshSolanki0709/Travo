import { User } from "@/services/database";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface EditProfileFormProps {
  editingData: Partial<User>;
  saving: boolean;
  onDataChange: (data: Partial<User>) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function EditProfileForm({
  editingData,
  saving,
  onDataChange,
  onSave,
  onCancel,
}: EditProfileFormProps) {
  return (
    <View className="w-full px-2.5">
      <TextInput
        className="bg-input-background border border-border-divider rounded-xl p-3 mb-3 text-base text-text-primary focus:border-input-focus"
        placeholder="Display Name"
        placeholderTextColor="var(--color-text-disabled)"
        value={editingData.display_name || ""}
        onChangeText={(text) =>
          onDataChange({ ...editingData, display_name: text })
        }
      />
      <TextInput
        className="bg-input-background border border-border-divider rounded-xl p-3 mb-3 text-base text-text-primary h-20 focus:border-input-focus"
        placeholder="Bio"
        placeholderTextColor="var(--color-text-disabled)"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
        value={editingData.bio || ""}
        onChangeText={(text) => onDataChange({ ...editingData, bio: text })}
      />
      <View className="flex-row mb-3">
        <TextInput
          className="flex-1 bg-input-background border border-border-divider rounded-xl p-3 text-base text-text-primary mr-2 focus:border-input-focus"
          placeholder="City"
          placeholderTextColor="var(--color-text-disabled)"
          value={editingData.city || ""}
          onChangeText={(text) => onDataChange({ ...editingData, city: text })}
        />
        <TextInput
          className="flex-1 bg-input-background border border-border-divider rounded-xl p-3 text-base text-text-primary focus:border-input-focus"
          placeholder="Country"
          placeholderTextColor="var(--color-text-disabled)"
          value={editingData.country || ""}
          onChangeText={(text) =>
            onDataChange({ ...editingData, country: text })
          }
        />
      </View>
      <View className="flex-row gap-3 mt-2">
        <TouchableOpacity
          className="flex-1 p-3.5 rounded-xl items-center bg-background-elevated active:bg-background-elevated/80"
          onPress={onCancel}
        >
          <Text className="text-text-secondary font-semibold">Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 p-3.5 rounded-xl items-center bg-brand-primary active:bg-brand-primary-pressed"
          onPress={onSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="var(--color-text-on-primary)" />
          ) : (
            <Text className="text-text-on-primary font-bold">Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
