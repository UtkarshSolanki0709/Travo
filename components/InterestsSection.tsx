import { View, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const INITIAL_INTERESTS = [
  'Clubbing', 'Cafe Hopping', 'Museums', 'Hiking', 
  'Beach', 'Going to new places', 'Shopping', 'Dining',
  'Outdoor Sports', 'Live Music', 'Art Galleries'
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
    <Card className="p-5 mb-5">
      <Text className="text-heading-md font-heading text-foreground mb-4">Interests</Text>
      
      <View className="flex-row gap-2 mb-4 items-center">
        <View className="flex-1">
          <Input
            placeholder="Add your own interest..."
            value={customInterest}
            onChangeText={onCustomInterestChange}
            onSubmitEditing={onAddCustomInterest}
          />
        </View>
        <Button
          variant="default"
          size="icon"
          onPress={onAddCustomInterest}
        >
          <Plus size={20} color="#fff" />
        </Button>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {selectedInterests.map((interest) => (
          <TouchableOpacity 
            key={interest}
            onPress={() => onToggleInterest(interest)}
          >
            <Badge variant="default" className="px-3.5 py-1.5">
              <Text className="text-body-sm text-white font-medium font-body">
                {interest}
              </Text>
            </Badge>
          </TouchableOpacity>
        ))}
        
        {INITIAL_INTERESTS.filter((i) => !selectedInterests.includes(i)).map((interest) => (
          <TouchableOpacity 
            key={interest}
            onPress={() => onToggleInterest(interest)}
          >
            <Badge variant="outline" className="px-3.5 py-1.5 bg-surface-elevated">
              <Text className="text-body-sm text-muted-foreground font-body">
                {interest}
              </Text>
            </Badge>
          </TouchableOpacity>
        ))}
      </View>
    </Card>
  );
}