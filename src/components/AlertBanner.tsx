import { Text, View } from "react-native";
import { formatCountdown } from "../utils/format";

export interface AlertItem {
  id: string;
  name: string;
  remaining: number;
  tone: "upcoming" | "warn" | "now";
  color: string;
}

export function AlertBanner({ items }: { items: AlertItem[] }) {
  if (items.length === 0) return null;

  return (
    <View className="mx-4 mb-2 gap-1.5">
      {items.map((item) => (
        <View
          key={item.id}
          className={`flex-row items-center justify-between rounded-xl border px-3 py-2 ${bannerClass(item.tone)}`}
        >
          <View className="flex-row items-center gap-2">
            <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <Text className="text-[12px] font-bold tracking-wide text-white">{item.name}</Text>
          </View>
          <Text className={`font-mono text-[12px] font-bold ${countdownClass(item.tone)}`}>
            {item.tone === "now" ? "NOW" : `${formatCountdown(item.remaining)}`}
          </Text>
        </View>
      ))}
    </View>
  );
}

function bannerClass(tone: AlertItem["tone"]): string {
  if (tone === "now") return "border-gold/50 bg-gold-dim";
  if (tone === "warn") return "border-accent/35 bg-accent-soft";
  return "border-white/10 bg-surface-raised";
}

function countdownClass(tone: AlertItem["tone"]): string {
  if (tone === "now") return "text-gold";
  if (tone === "warn") return "text-accent";
  return "text-zinc-400";
}
