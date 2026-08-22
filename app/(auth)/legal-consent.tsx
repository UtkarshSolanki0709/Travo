import {
  ImageBackground,
  ScrollView,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Send } from "lucide-react-native";
import { Button } from "@/components/ui/button";
import LegalSections from "@/components/common/LegalSections";
import { COLORS } from "@/lib/theme";
import {
  LEGAL_ACCEPTED_KEY,
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  UGC_GUIDELINES,
} from "@/lib/legal-content";

export default function LegalConsentScreen() {
  const handleAgree = async () => {
    await AsyncStorage.setItem(LEGAL_ACCEPTED_KEY, new Date().toISOString());
    router.replace("/(tabs)/map");
  };

  return (
    <View className="flex-1 bg-background">
      <ImageBackground
        source={require("@/assets/textures/paper-texture.png")}
        imageStyle={{ opacity: 0.05 }}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 pt-14 pb-8"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-8">
            <View className="h-16 w-16 items-center justify-center rounded-radius-lg bg-primary/10 mb-4 border border-primary/20">
              <Send size={32} color={COLORS.primary} />
            </View>
            <Text className="text-display-xl font-display text-foreground text-center">
              Welcome to Travo
            </Text>
            <Text className="mt-2 text-center text-body-md text-muted-foreground font-body">
              Before you begin, please review our policies. They explain what
              data Travo uses and the rules that keep the community safe.
            </Text>
          </View>

          <LegalSections doc={PRIVACY_POLICY} />
          <LegalSections doc={TERMS_OF_SERVICE} />
          <LegalSections doc={UGC_GUIDELINES} />

          <Button
            onPress={handleAgree}
            variant="default"
            size="lg"
            className="w-full mt-4"
          >
            <Text className="text-body-md font-semibold text-white font-body">
              Agree &amp; Continue
            </Text>
          </Button>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}
