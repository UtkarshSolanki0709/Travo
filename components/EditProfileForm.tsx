import { View, Text } from 'react-native';
import { User } from '@/services/database';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <View className="w-full px-2.5 mb-6">
      <View className="mb-3">
        <Input
          label="Display Name"
          placeholder="Display Name"
          value={editingData.display_name || ''}
          onChangeText={(text) => onDataChange({ ...editingData, display_name: text })}
        />
      </View>

      <View className="mb-3">
        <Input
          label="Bio"
          placeholder="Tell travelers about yourself..."
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          value={editingData.bio || ''}
          onChangeText={(text) => onDataChange({ ...editingData, bio: text })}
          className="min-h-[80px]"
        />
      </View>

      <View className="flex-row gap-3 mb-4">
        <View className="flex-1">
          <Input
            label="City"
            placeholder="City"
            value={editingData.city || ''}
            onChangeText={(text) => onDataChange({ ...editingData, city: text })}
          />
        </View>
        <View className="flex-1">
          <Input
            label="Country"
            placeholder="Country"
            value={editingData.country || ''}
            onChangeText={(text) => onDataChange({ ...editingData, country: text })}
          />
        </View>
      </View>

      <View className="flex-row gap-3">
        <Button
          variant="secondary"
          size="default"
          className="flex-1"
          onPress={onCancel}
        >
          <Text className="text-primary font-semibold text-body-md font-body">Cancel</Text>
        </Button>

        <Button
          variant="default"
          size="default"
          className="flex-1"
          loading={saving}
          onPress={onSave}
        >
          <Text className="text-white font-semibold text-body-md font-body">Save</Text>
        </Button>
      </View>
    </View>
  );
}