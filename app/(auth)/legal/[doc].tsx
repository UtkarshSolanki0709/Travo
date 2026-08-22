import type { ReactNode } from "react";
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { AlertTriangle, ArrowLeft, FileText, Lock } from "lucide-react-native";
import { COLORS } from "@/lib/theme";
import { LEGAL_DOCS } from "@/lib/legal-content";
import LegalSections from "@/components/common/LegalSections";

const DOC_ICONS: Record<string, ReactNode> = {
  privacy: <Lock size={20} color={COLORS.primary} />,
  terms: <FileText size={20} color={COLORS.primary} />,
  guidelines: <AlertTriangle size={20} color={COLORS.destructive} />,
};

export default function LegalDocScreen() {
  const { doc } = useLocalSearchParams<{ doc: string }>();
  const legal = LEGAL_DOCS[doc ?? ""] ?? LEGAL_DOCS.privacy;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/sign-in");
    }
  };

  return (
    <View className="flex-1 bg-background">
      <ImageBackground
        source={require("@/assets/textures/paper-texture.png")}
        imageStyle={{ opacity: 0.05 }}
        className="flex-1"
      >
        <View className="bg-surface border-b border-border pt-12 pb-3 px-4 flex-row items-center shadow-elevation-1">
          <TouchableOpacity onPress={handleBack} className="mr-3 p-1" accessibilityLabel="Go back" accessibilityRole="button">
            <ArrowLeft size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text className="text-heading-lg font-display text-foreground">
            {legal.shortTitle}
          </Text>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          <LegalSections doc={legal} icon={DOC_ICONS[legal.id]} />
        </ScrollView>
      </ImageBackground>
    </View>
  );
}
