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
import {
  PRIVACY_POLICY,
  TERMS_OF_SERVICE,
  UGC_GUIDELINES,
  type LegalDoc,
} from "@/lib/legal-content";
import LegalSections from "./LegalSections";

interface LegalPrivacyModalProps {
  visible: boolean;
  onClose: () => void;
}

const TABS: { id: LegalDoc["id"]; label: string; icon: React.ReactNode }[] = [
  { id: "privacy", label: PRIVACY_POLICY.shortTitle, icon: <Lock size={20} color={COLORS.primary} /> },
  { id: "terms", label: TERMS_OF_SERVICE.shortTitle, icon: <FileText size={20} color={COLORS.primary} /> },
  { id: "guidelines", label: UGC_GUIDELINES.shortTitle, icon: <AlertTriangle size={20} color={COLORS.destructive} /> },
];

const DOCS: Record<LegalDoc["id"], LegalDoc> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
  guidelines: UGC_GUIDELINES,
};

export default function LegalPrivacyModal({
  visible,
  onClose,
}: LegalPrivacyModalProps) {
  const [activeTab, setActiveTab] = useState<LegalDoc["id"]>("privacy");

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
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-1 py-2 rounded-radius-sm items-center ${
                  activeTab === tab.id ? "bg-primary" : "bg-transparent"
                }`}
              >
                <Text
                  className={`text-body-sm font-semibold font-body ${
                    activeTab === tab.id ? "text-white" : "text-muted-foreground"
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content Area */}
          <ScrollView className="flex-1 px-1" showsVerticalScrollIndicator={false}>
            <LegalSections
              doc={DOCS[activeTab]}
              icon={TABS.find((t) => t.id === activeTab)?.icon}
            />
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
