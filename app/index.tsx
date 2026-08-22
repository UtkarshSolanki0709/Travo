import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LEGAL_ACCEPTED_KEY } from "@/lib/legal-content";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LEGAL_ACCEPTED_KEY)
      .then((value) => setAccepted(Boolean(value)))
      .catch(() => setAccepted(false))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;
  return <Redirect href={accepted ? "/(tabs)/map" : "/legal-consent"} />;
}
