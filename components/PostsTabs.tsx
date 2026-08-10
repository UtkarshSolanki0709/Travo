import { View, Text, TouchableOpacity } from 'react-native';
import { Grid, Users } from 'lucide-react-native';
import { COLORS } from '@/lib/theme';

interface PostsTabsProps {
  activeTab: 'posts' | 'tagged';
  onTabChange: (tab: 'posts' | 'tagged') => void;
}

export default function PostsTabs({ activeTab, onTabChange }: PostsTabsProps) {
  return (
    <View className="flex-row mb-4 bg-surface rounded-radius-md p-1.5 border border-border">
      <TouchableOpacity
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-radius-md gap-2 ${
          activeTab === 'posts' ? 'bg-primary/10' : ''
        }`}
        onPress={() => onTabChange('posts')}
      >
        <Grid
          size={18}
          color={activeTab === 'posts' ? COLORS.primary : COLORS.textSecondary}
        />
        <Text className={`text-body-sm font-semibold font-body ${
          activeTab === 'posts' ? 'text-primary' : 'text-muted-foreground'
        }`}>
          My Posts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 flex-row items-center justify-center py-2.5 rounded-radius-md gap-2 ${
          activeTab === 'tagged' ? 'bg-primary/10' : ''
        }`}
        onPress={() => onTabChange('tagged')}
      >
        <Users
          size={18}
          color={activeTab === 'tagged' ? COLORS.primary : COLORS.textSecondary}
        />
        <Text className={`text-body-sm font-semibold font-body ${
          activeTab === 'tagged' ? 'text-primary' : 'text-muted-foreground'
        }`}>
          Tagged
        </Text>
      </TouchableOpacity>
    </View>
  );
}