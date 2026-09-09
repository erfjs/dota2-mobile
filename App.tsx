import "./global.css";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { AppSettingsProvider } from "./src/context/AppSettingsContext";
import { ComputerListScreen } from "./src/screens/ComputerListScreen";
import { MatchScreen } from "./src/screens/MatchScreen";
import { Computer } from "./src/types/computer";
import { prepareAlertSounds } from "./src/utils/alertSound";

function AppContent() {
  const [selected, setSelected] = useState<Computer | null>(null);

  useEffect(() => {
    void prepareAlertSounds();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={["top", "left", "right"]}>
      <StatusBar style="light" />
      {selected ? (
        <MatchScreen computer={selected} onBack={() => setSelected(null)} />
      ) : (
        <ComputerListScreen onSelect={setSelected} />
      )}
    </SafeAreaView>
  );
}

export default function App() {
  const content = (
    <SafeAreaProvider>
      <AppSettingsProvider>
        <AppContent />
      </AppSettingsProvider>
    </SafeAreaProvider>
  );

  if (Platform.OS !== "web") {
    return content;
  }

  return (
    <View style={styles.webShell}>
      <View style={styles.phoneFrame}>{content}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  webShell: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    ...(Platform.OS === "web" ? { minHeight: "100vh" as never } : null),
  },
  phoneFrame: {
    width: 390,
    height: 844,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#333",
    backgroundColor: "#070b10",
    ...(Platform.OS === "web"
      ? {
          maxHeight: "95vh" as never,
          boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        }
      : null),
  },
});
