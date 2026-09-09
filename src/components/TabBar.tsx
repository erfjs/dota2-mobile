import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type MatchTab = "match" | "timers";

interface TabBarProps {
  active: MatchTab;
  onChange: (tab: MatchTab) => void;
  timerAlertCount?: number;
}

export function TabBar({ active, onChange, timerAlertCount = 0 }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="border-t border-white/10 bg-surface-raised px-3 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}
    >
      <View className="flex-row gap-2">
        <TabButton
          label="MATCH"
          icon="game-controller-outline"
          selected={active === "match"}
          onPress={() => onChange("match")}
        />
        <TabButton
          label="TIMERS"
          icon="timer-outline"
          selected={active === "timers"}
          badge={timerAlertCount}
          onPress={() => onChange("timers")}
        />
      </View>
    </View>
  );
}

function TabButton({
  label,
  icon,
  selected,
  badge = 0,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-3 ${
        selected ? "border border-accent/40 bg-accent-soft" : "border border-transparent bg-surface-card"
      }`}
    >
      <View>
        <Ionicons name={icon} size={18} color={selected ? "#3ddab4" : "#71717a"} />
        {badge > 0 ? (
          <View className="absolute -right-1.5 -top-1.5 min-w-[16px] items-center rounded-full bg-gold px-1">
            <Text className="text-[9px] font-bold text-black">{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text
        className={`text-[11px] font-bold tracking-widest ${
          selected ? "text-accent" : "text-zinc-500"
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
