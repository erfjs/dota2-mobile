import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Computer } from "../types/computer";

interface ComputerCardProps {
  computer: Computer;
  onPress: (computer: Computer) => void;
}

export function ComputerCard({ computer, onPress }: ComputerCardProps) {
  const online = computer.online;

  return (
    <Pressable
      onPress={() => onPress(computer)}
      className="mb-3 overflow-hidden rounded-2xl border border-white/10 bg-surface-raised active:opacity-90"
    >
      <View className="flex-row items-center gap-3 p-4">
        <View
          className={`h-12 w-12 items-center justify-center rounded-2xl border ${
            online ? "border-accent/40 bg-accent-soft" : "border-zinc-700 bg-surface-card"
          }`}
        >
          <Ionicons
            name="desktop-outline"
            size={22}
            color={online ? "#3ddab4" : "#71717a"}
          />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-bold text-white" numberOfLines={1}>
              {computer.name}
            </Text>
            <View
              className={`rounded-full px-2 py-0.5 ${
                online ? "bg-accent-soft" : "bg-zinc-800"
              }`}
            >
              <Text
                className={`text-[9px] font-bold tracking-widest ${
                  online ? "text-accent" : "text-zinc-500"
                }`}
              >
                {online ? "ONLINE" : "OFFLINE"}
              </Text>
            </View>
          </View>
          <Text className="mt-0.5 text-[12px] text-zinc-400" numberOfLines={1}>
            {computer.subtitle}
          </Text>
          <Text className="mt-1 font-mono text-[11px] text-zinc-500">
            {computer.host} · {computer.lastSeenLabel}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#3ddab4" />
      </View>
    </Pressable>
  );
}
