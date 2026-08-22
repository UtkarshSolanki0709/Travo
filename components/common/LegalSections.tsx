import React from "react";
import { Text, View } from "react-native";
import type { LegalDoc } from "@/lib/legal-content";

export default function LegalSections({
  doc,
  icon,
}: {
  doc: LegalDoc;
  icon?: React.ReactNode;
}) {
  return (
    <View className="gap-4 pb-8">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-heading-md font-heading text-foreground flex-1">
          {doc.title}
        </Text>
      </View>
      {doc.lastUpdated ? (
        <Text className="text-body-sm text-muted-foreground font-body leading-relaxed">
          Last Updated: {doc.lastUpdated}
        </Text>
      ) : null}
      {doc.intro ? (
        <Text className="text-body-md text-foreground font-body leading-relaxed">
          {doc.intro}
        </Text>
      ) : null}
      {doc.callout ? (
        <View className="bg-destructive/10 p-3.5 rounded-radius-md border border-destructive/20 mb-2">
          <Text className="text-body-sm text-destructive font-bold font-body">
            {doc.callout.title}
          </Text>
          <Text className="text-body-sm text-foreground font-body mt-1">
            {doc.callout.body}
          </Text>
        </View>
      ) : null}
      {doc.sections.map((section) => (
        <View key={section.heading}>
          <Text className="text-heading-sm font-bold text-foreground font-body mt-2">
            {section.heading}
          </Text>
          <Text className="text-body-md text-foreground font-body leading-relaxed mt-1">
            {section.body}
          </Text>
        </View>
      ))}
    </View>
  );
}
