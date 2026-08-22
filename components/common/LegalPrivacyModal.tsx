import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { X, ShieldCheck, FileText, Lock, AlertTriangle } from "lucide-react-native";
import { COLORS } from "@/lib/theme";

interface LegalPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function LegalPrivacyModal({
  visible,
  onClose,
}: LegalPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy" | "guidelines">(
    "privacy",
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black/60 justify-end">
        <View className="bg-surface rounded-t-3xl h-[88%] p-6 flex-1 shadow-elevation-2">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-border">
            <View className="flex-row items-center gap-2">
              <ShieldCheck size={24} color={COLORS.primary} />
              <Text className="text-heading-xl font-display text-foreground">
                Legal & Safety Policy
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <X size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View className="flex-row my-4 bg-surface-elevated p-1 rounded-radius-md border border-border">
            <TouchableOpacity
              onPress={() => setActiveTab("privacy")}
              className={`flex-1 py-2 rounded-radius-sm items-center ${
                activeTab === "privacy" ? "bg-primary" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-body-sm font-semibold font-body ${
                  activeTab === "privacy" ? "text-white" : "text-muted-foreground"
                }`}
              >
                Privacy Policy
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("terms")}
              className={`flex-1 py-2 rounded-radius-sm items-center ${
                activeTab === "terms" ? "bg-primary" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-body-sm font-semibold font-body ${
                  activeTab === "terms" ? "text-white" : "text-muted-foreground"
                }`}
              >
                Terms of Service
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("guidelines")}
              className={`flex-1 py-2 rounded-radius-sm items-center ${
                activeTab === "guidelines" ? "bg-primary" : "bg-transparent"
              }`}
            >
              <Text
                className={`text-body-sm font-semibold font-body ${
                  activeTab === "guidelines" ? "text-white" : "text-muted-foreground"
                }`}
              >
                UGC Safety
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <ScrollView className="flex-1 px-1" showsVerticalScrollIndicator={false}>
            {activeTab === "privacy" && (
              <View className="gap-4 pb-8">
                <View className="flex-row items-center gap-2">
                  <Lock size={20} color={COLORS.primary} />
                  <Text className="text-heading-md font-heading text-foreground">
                    Privacy & Data Protection Policy
                  </Text>
                </View>
                <Text className="text-body-sm text-muted-foreground font-body leading-relaxed">
                  Last Updated: August 2026
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  1. Information We Collect
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  Travo collects location data (latitude/longitude), user profile information (email, display name, username, avatar photo), user-generated posts, photos, videos, activity markers, and direct chat messages to provide interactive location-based social networking features.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  2. Use of Location Data
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  Location data is accessed when you explicitly grant location permissions. Live location updates are rendered on interactive map views to show nearby activities and help friends connect. Location updates in the background are only used when live journey sharing is activated. You can disable location access at any time in your device settings.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  3. Third-Party Services
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  We use trusted third-party providers: Clerk (Identity & Authentication), Supabase (Encrypted Database & Realtime Messaging), Geoapify (Mapping & Location Search), and Cloudinary (Secure Media Storage). We do not sell your personal data to third-party advertisers.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  4. Data Security & Retention
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  Your data is transmitted using encrypted TLS/HTTPS protocols. Row Level Security (RLS) policies restrict unauthorized database access. You may request account deletion or content removal at any time within your profile settings.
                </Text>
              </View>
            )}

            {activeTab === "terms" && (
              <View className="gap-4 pb-8">
                <View className="flex-row items-center gap-2">
                  <FileText size={20} color={COLORS.primary} />
                  <Text className="text-heading-md font-heading text-foreground">
                    Terms of Service Agreement
                  </Text>
                </View>
                <Text className="text-body-sm text-muted-foreground font-body leading-relaxed">
                  By using Travo, you agree to these Terms of Service.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  1. User Account & Eligibility
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  You must be at least 13 years of age to register and use Travo. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  2. User Conduct & Prohibited Content
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  You agree not to post, share, or transmit content that is illegal, defamatory, threatening, abusive, harassing, obscene, hateful, or invasive of another person&apos;s privacy. Impersonation of other individuals is strictly prohibited.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  3. Account Termination & Suspension
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  Travo reserves the right to suspend or terminate user accounts that violate our Terms of Service or Community Guidelines without prior notice.
                </Text>
              </View>
            )}

            {activeTab === "guidelines" && (
              <View className="gap-4 pb-8">
                <View className="flex-row items-center gap-2">
                  <AlertTriangle size={20} color={COLORS.destructive} />
                  <Text className="text-heading-md font-heading text-foreground">
                    User-Generated Content (UGC) Guidelines
                  </Text>
                </View>

                <View className="bg-destructive/10 p-3.5 rounded-radius-md border border-destructive/20 mb-2">
                  <Text className="text-body-sm text-destructive font-bold font-body">
                    Zero Tolerance Policy for Objectionable Content
                  </Text>
                  <Text className="text-body-sm text-foreground font-body mt-1">
                    Travo enforces zero tolerance for harassment, hate speech, explicit content, or dangerous behaviors.
                  </Text>
                </View>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  1. Reporting Inappropriate Content
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  Every user post, activity, and message includes a Report button. Flagged content is reviewed by moderation algorithms and administrators within 24 hours.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  2. Blocking Abusive Users
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  You can block any user directly from their profile or chat options. Blocking a user immediately prevents them from viewing your location, posts, or sending you messages.
                </Text>

                <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
                  3. Content Moderation & Action
                </Text>
                <Text className="text-body-md text-foreground font-body leading-relaxed">
                  Violating posts will be removed permanently, and repeat offenders will be banned from the platform.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer Action */}
          <View className="pt-3 border-t border-border">
            <TouchableOpacity
              onPress={onClose}
              className="bg-primary p-3.5 rounded-radius-md items-center"
            >
              <Text className="text-white font-bold text-body-md font-body">
                I Understand & Agree
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
