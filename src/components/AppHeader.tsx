import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { ConnectionStatus } from "../useGameState";

interface AppHeaderProps {
  computerName: string;
  host: string;
  status: ConnectionStatus;
  latencyMs?: number | null;
  muted?: boolean;
  onBack?: () => void;
  onMutePress?: () => void;
  onSettingsPress?: () => void;
}

function statusLabel(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "GSI SYNC";
    case "connecting":
      return "SYNCING";
    default:
      return "OFFLINE";
  }
}

export function AppHeader({
  computerName,
  host,
  status,
  latencyMs,
  muted = false,
  onBack,
  onMutePress,
  onSettingsPress,
}: AppHeaderProps) {
  const synced = status === "connected";
  const badgeBorder =
    synced
      ? "border-accent/60"
      : status === "connecting"
        ? "border-gold/50"
        : "border-dire/50";
  const badgeText =
    synced ? "text-accent" : status === "connecting" ? "text-gold" : "text-dire";

  return (
    <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        {onBack ? (
          <Pressable
            onPress={onBack}
            className="h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-surface-card"
            accessibilityRole="button"
            accessibilityLabel="Back to computers"
          >
            <Ionicons name="chevron-back" size={20} color="#3ddab4" />
          </Pressable>
        ) : (
          <View className="h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-surface-card">
            <Ionicons name="shield-half" size={20} color="#3ddab4" />
          </View>
        )}

        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[13px] font-bold tracking-[1.5px] text-white">
              DOTA COMPANION
            </Text>
            <View className={`rounded-full border px-2 py-0.5 ${badgeBorder}`}>
              <Text className={`text-[9px] font-bold tracking-widest ${badgeText}`}>
                {statusLabel(status)}
              </Text>
            </View>
          </View>

          <View className="mt-1 flex-row items-center gap-1.5">
            <View
              className={`h-1.5 w-1.5 rounded-full ${
                synced ? "bg-accent" : status === "connecting" ? "bg-gold" : "bg-dire"
              }`}
            />
            <Text className={`font-mono text-[11px] ${synced ? "text-accent" : "text-zinc-500"}`}>
              {latencyMs != null ? `${latencyMs}ms` : synced ? "live" : "—"}
            </Text>
            <Text className="text-[11px] text-zinc-600">·</Text>
            <Text className="flex-shrink font-mono text-[11px] text-zinc-400" numberOfLines={1}>
              {computerName} {host}
            </Text>
          </View>
        </View>
      </View>

      <View className="ml-2 flex-row items-center gap-2">
        <Pressable
          onPress={onMutePress}
          accessibilityRole="button"
          accessibilityLabel={muted ? "Unmute alert sounds" : "Mute alert sounds"}
          className={`h-10 w-10 items-center justify-center rounded-xl bg-surface-card ${
            muted ? "border border-dire/40" : ""
          }`}
        >
          <Ionicons
            name={muted ? "volume-mute-outline" : "volume-medium-outline"}
            size={18}
            color={muted ? "#f07178" : "#3ddab4"}
          />
        </Pressable>
        <Pressable
          onPress={onSettingsPress}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          className="h-10 w-10 items-center justify-center rounded-xl border border-accent/40 bg-surface-card"
        >
          <Ionicons name="settings-outline" size={18} color="#3ddab4" />
        </Pressable>
      </View>
    </View>
  );
}
