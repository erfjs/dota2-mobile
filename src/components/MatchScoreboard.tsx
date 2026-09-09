import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { dayNightFromClock, formatClock } from "../utils/format";

interface MatchScoreboardProps {
  radiantScore?: number;
  direScore?: number;
  clockTime?: number;
  ended?: boolean;
  paused?: boolean;
}

export function MatchScoreboard({
  radiantScore = 0,
  direScore = 0,
  clockTime,
  ended = false,
  paused = false,
}: MatchScoreboardProps) {
  const cycle = dayNightFromClock(clockTime);
  const isDay = cycle === "day";
  const clockLabel = ended ? "FINAL" : paused ? "PAUSE" : isDay ? "DAY CYCLE" : "NIGHT CYCLE";
  const clockIcon = ended ? "flag" : paused ? "pause" : isDay ? "sunny" : "moon";
  const clockColor = ended || paused ? "#e8c547" : isDay ? "#f0c94a" : "#9db4ff";
  const clockTextClass = ended || paused ? "text-gold" : isDay ? "text-day" : "text-indigo-300";

  return (
    <View className="mx-4 flex-row gap-2 rounded-2xl bg-surface-raised p-2">
      {/* Radiant */}
      <View className="flex-1 items-center justify-center rounded-xl border border-radiant-border/70 bg-radiant-dim px-2 py-3">
        <View className="mb-1 flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-full bg-radiant" />
          <Text className="font-mono text-[10px] font-bold tracking-[2px] text-radiant">
            RADIANT
          </Text>
        </View>
        <Text className="font-mono text-3xl font-bold text-radiant">{radiantScore}</Text>
      </View>

      {/* Clock / day-night */}
      <View className="min-w-[112px] flex-[1.15] items-center justify-center rounded-xl border border-white/10 bg-surface-card px-2 py-3">
        <View className="mb-1 flex-row items-center gap-1.5">
          <Ionicons name={clockIcon} size={12} color={clockColor} />
          <Text className={`font-mono text-[10px] font-bold tracking-[1.5px] ${clockTextClass}`}>
            {clockLabel}
          </Text>
        </View>
        <Text className="font-mono text-3xl font-bold tracking-tight text-white">
          {formatClock(clockTime)}
        </Text>
      </View>

      {/* Dire */}
      <View className="flex-1 items-center justify-center rounded-xl border border-dire-border/70 bg-dire-dim px-2 py-3">
        <View className="mb-1 flex-row items-center gap-1.5">
          <Text className="font-mono text-[10px] font-bold tracking-[2px] text-dire">DIRE</Text>
          <View className="h-1.5 w-1.5 rounded-full bg-dire" />
        </View>
        <Text className="font-mono text-3xl font-bold text-dire">{direScore}</Text>
      </View>
    </View>
  );
}
