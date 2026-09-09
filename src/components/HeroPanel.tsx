import { Ionicons } from "@expo/vector-icons";
import { Image, Text, View } from "react-native";
import { RelayState } from "../types";
import {
  farmPerMinute,
  formatHeroName,
  formatItemName,
  formatNumber,
  heroImageUrl,
  itemImageUrl,
  kdaRatio,
} from "../utils/format";

interface HeroPanelProps {
  state: RelayState;
  ended?: boolean;
}

function ResourceBar({
  label,
  current,
  max,
  percent,
  tone,
  segmented,
}: {
  label: string;
  current?: number;
  max?: number;
  percent?: number;
  tone: "hp" | "mana";
  segmented?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, percent ?? 0));
  const fillClass = tone === "hp" ? "bg-accent" : "bg-mana";
  const textClass = tone === "hp" ? "text-accent" : "text-mana";
  const trackClass = tone === "hp" ? "bg-radiant-dim" : "bg-mana-dim";
  const borderClass = tone === "hp" ? "border-accent/25" : "border-mana/25";

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Text className={`text-[11px] font-bold tracking-wide ${textClass}`}>
            {label}: {formatNumber(current)} / {formatNumber(max)}
          </Text>
        </View>
        <Text className={`font-mono text-[11px] font-bold ${textClass}`}>{pct}%</Text>
      </View>

      <View className={`h-2.5 overflow-hidden rounded-full border ${borderClass} ${trackClass}`}>
        {segmented ? (
          <View className="h-full flex-row gap-0.5 px-0.5">
            {Array.from({ length: 12 }).map((_, i) => {
              const filled = (i + 1) / 12 <= pct / 100;
              return (
                <View
                  key={i}
                  className={`h-full flex-1 rounded-sm ${filled ? fillClass : "bg-transparent"}`}
                />
              );
            })}
          </View>
        ) : (
          <View className={`h-full rounded-full ${fillClass}`} style={{ width: `${pct}%` }} />
        )}
      </View>
    </View>
  );
}

function ItemSlot({
  name,
  size = "md",
  fill = "row",
}: {
  name?: string;
  size?: "md" | "sm";
  /** `row` = share width in a horizontal row; `col` = full width of a fixed side column */
  fill?: "row" | "col";
}) {
  const uri = name ? itemImageUrl(name) : null;
  const label = name ? formatItemName(name) : "Empty";
  const height = size === "sm" ? 36 : 44;

  return (
    <View
      className={`overflow-hidden rounded-md border border-white/10 bg-black/50 ${
        fill === "row" ? "flex-1" : "w-full"
      }`}
      style={{ height }}
      accessibilityLabel={label}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" }}
          resizeMode="cover"
        />
      ) : null}
    </View>
  );
}

function InventoryGrid({ items }: { items: RelayState["items"] }) {
  const bySlot = new Map((items ?? []).map((item) => [item.slot, item.name]));
  const mainTop = ["slot0", "slot1", "slot2"] as const;
  const mainBottom = ["slot3", "slot4", "slot5"] as const;
  const backpack = ["slot6", "slot7", "slot8"] as const;
  const hasBackpack = backpack.some((slot) => bySlot.has(slot));

  return (
    <View className="mt-4 gap-2">
      <Text className="text-[10px] font-bold tracking-widest text-zinc-500">ITEMS</Text>

      <View className="flex-row gap-2">
        {/* Main inventory — 2×3 like in-game HUD */}
        <View className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row gap-1.5">
            {mainTop.map((slot) => (
              <ItemSlot key={slot} name={bySlot.get(slot)} />
            ))}
          </View>
          <View className="flex-row gap-1.5">
            {mainBottom.map((slot) => (
              <ItemSlot key={slot} name={bySlot.get(slot)} />
            ))}
          </View>
        </View>

        {/* TP + Neutral column */}
        <View className="w-[52px] gap-1.5">
          <ItemSlot name={bySlot.get("teleport0")} fill="col" />
          <ItemSlot name={bySlot.get("neutral0")} fill="col" />
        </View>
      </View>

      {hasBackpack ? (
        <View className="flex-row gap-1.5 opacity-80">
          {backpack.map((slot) => (
            <ItemSlot key={slot} name={bySlot.get(slot)} size="sm" />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function HeroPanel({ state, ended = false }: HeroPanelProps) {
  const { hero, player, match, items } = state;
  const kills = player.kills ?? 0;
  const deaths = player.deaths ?? 0;
  const assists = player.assists ?? 0;
  const ratio = kdaRatio(kills, deaths, assists);
  const impact = ratio >= 4 ? "HIGH" : ratio >= 2 ? "SOLID" : "LOW";
  const team = (player.team ?? "radiant").toUpperCase();
  const teamColor = player.team === "dire" ? "text-dire" : "text-radiant";
  const farmRate = farmPerMinute(player.lastHits, match.gameTime ?? match.clockTime);
  const portrait = heroImageUrl(hero.name);

  return (
    <View className="mx-4 mt-3 overflow-hidden rounded-2xl border border-white/5 bg-surface-raised p-4">
      {/* Identity */}
      <View className="flex-row gap-3">
        <View className="relative h-[72px] w-[72px] overflow-hidden rounded-2xl border border-accent/35 bg-surface-card">
          {portrait ? (
            <Image
              source={{ uri: portrait }}
              className="h-full w-full"
              resizeMode="cover"
              accessibilityLabel={formatHeroName(hero.name)}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Ionicons name="flash" size={28} color="#3ddab4" />
            </View>
          )}
          <View className="absolute bottom-0 left-0 right-0 bg-black/70 py-1">
            <Text className="text-center font-mono text-[10px] font-bold tracking-wider text-white">
              LVL {hero.level ?? "—"}
            </Text>
          </View>
        </View>

        <View className="min-w-0 flex-1 justify-center">
          <Text className="text-lg font-bold tracking-wide text-white" numberOfLines={1}>
            {formatHeroName(hero.name)}
          </Text>

          <View className="mt-1.5 flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center gap-1.5 rounded-full border border-mana/40 bg-mana-dim px-2.5 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-mana" />
              <Text className="text-[10px] font-bold tracking-widest text-mana">CORE</Text>
            </View>
            <Text className={`text-[10px] font-bold tracking-widest ${teamColor}`}>{team}</Text>
            <Text className={`text-[10px] font-bold tracking-widest ${ended ? "text-gold" : "text-zinc-500"}`}>
              {ended ? "ENDED" : "LIVE"}
            </Text>
          </View>

          {(player.gpm != null || player.xpm != null) && (
            <View className="mt-2 flex-row items-center gap-3">
              {player.gpm != null ? (
                <Text className="font-mono text-[11px] font-bold text-gold">
                  {formatNumber(player.gpm)}{" "}
                  <Text className="text-[9px] tracking-widest text-gold/70">GPM</Text>
                </Text>
              ) : null}
              {player.xpm != null ? (
                <Text className="font-mono text-[11px] font-bold text-mana">
                  {formatNumber(player.xpm)}{" "}
                  <Text className="text-[9px] tracking-widest text-mana/70">XPM</Text>
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <View className="items-end gap-2">
          <View className="items-center rounded-xl border border-gold-border/80 bg-gold-dim px-2.5 py-1.5">
            <View className="flex-row items-center gap-1">
              <Ionicons name="logo-bitcoin" size={12} color="#e8c547" />
              <Text className="font-mono text-[12px] font-bold text-gold">
                {formatNumber(player.gold)}g
              </Text>
            </View>
            <Text className="mt-0.5 text-[8px] font-bold tracking-widest text-gold/70">
              NET WORTH
            </Text>
          </View>

          <View
            className={`flex-row items-center gap-1 rounded-full border px-2 py-1 ${
              hero.alive !== false
                ? "border-accent/50 bg-accent-soft"
                : "border-dire/50 bg-dire-dim"
            }`}
          >
            <Ionicons
              name={hero.alive !== false ? "checkmark-circle" : "time-outline"}
              size={12}
              color={hero.alive !== false ? "#3ddab4" : "#f07178"}
            />
            <Text
              className={`text-[9px] font-bold tracking-wide ${
                hero.alive !== false ? "text-accent" : "text-dire"
              }`}
            >
              {hero.alive !== false
                ? "ALIVE"
                : `RESPAWN ${hero.respawnSeconds ?? 0}s`}
            </Text>
          </View>
        </View>
      </View>

      {/* Stat cards */}
      <View className="mt-4 flex-row gap-2.5">
        <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-white/5 bg-surface-card px-3 py-3">
          <View>
            <Text className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500">
              K / D / A
            </Text>
            <View className="flex-row items-end gap-1">
              <Text className="font-mono text-xl font-bold text-accent">{kills}</Text>
              <Text className="pb-0.5 font-mono text-sm text-zinc-600">/</Text>
              <Text className="font-mono text-xl font-bold text-dire">{deaths}</Text>
              <Text className="pb-0.5 font-mono text-sm text-zinc-600">/</Text>
              <Text className="font-mono text-xl font-bold text-mana">{assists}</Text>
            </View>
          </View>
          <View className="items-center rounded-xl bg-radiant-dim px-2.5 py-2">
            <Text className="font-mono text-base font-bold text-accent">{ratio.toFixed(1)}</Text>
            <Text className="text-[8px] font-bold tracking-widest text-accent/80">{impact}</Text>
            <Text className="text-[8px] font-bold tracking-widest text-zinc-500">IMPACT</Text>
          </View>
        </View>

        <View className="flex-1 flex-row items-center justify-between rounded-2xl border border-white/5 bg-surface-card px-3 py-3">
          <View>
            <Text className="mb-1 text-[10px] font-bold tracking-widest text-zinc-500">
              CREEP STATS
            </Text>
            <View className="flex-row items-end gap-1">
              <Text className="font-mono text-xl font-bold text-white">
                {formatNumber(player.lastHits)}
              </Text>
              <Text className="pb-0.5 text-[10px] font-bold text-zinc-500">LH</Text>
              <Text className="pb-0.5 font-mono text-sm text-zinc-600">/</Text>
              <Text className="font-mono text-xl font-bold text-gold">
                {formatNumber(player.denies)}
              </Text>
              <Text className="pb-0.5 text-[10px] font-bold text-zinc-500">DN</Text>
            </View>
          </View>
          <View className="items-center rounded-xl bg-surface-muted px-2.5 py-2">
            <Text className="font-mono text-base font-bold text-white">{farmRate}/m</Text>
            <Text className="text-[8px] font-bold tracking-widest text-zinc-400">FARM</Text>
            <Text className="text-[8px] font-bold tracking-widest text-zinc-600">RATE</Text>
          </View>
        </View>
      </View>

      {/* Resources */}
      <View className="mt-4 gap-3">
        <ResourceBar
          label="HP"
          current={hero.health}
          max={hero.maxHealth}
          percent={hero.healthPercent}
          tone="hp"
          segmented
        />
        <ResourceBar
          label="MANA"
          current={hero.mana}
          max={hero.maxMana}
          percent={hero.manaPercent}
          tone="mana"
        />
      </View>

      <InventoryGrid items={items} />
    </View>
  );
}
