import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { AlertItem } from "./AlertBanner";
import { formatClock, formatCountdown } from "../utils/format";
import {
  CAMP_FIRST_SPAWN,
  LOTUS_FIRST,
  LOTUS_INTERVAL,
  POWER_RUNE_FIRST,
  POWER_RUNE_INTERVAL,
  STACK_FIRST_WINDOW,
  STACK_WINDOW_START,
  TORMENTOR_FIRST,
  WARN_MAX,
  WARN_MIN,
  WARN_STEP,
  WISDOM_RUNE_FIRST,
  WISDOM_RUNE_INTERVAL,
  WarnId,
  CycleStatus,
  isWarning,
  nextFixedCycle,
  sideLabel,
  stackStatus,
  tormentorAlertStatus,
  tormentorStatus,
} from "../utils/objectives";

type IconName = keyof typeof Ionicons.glyphMap;

interface TimersPanelProps {
  clockTime?: number;
  warnSeconds: Record<WarnId, number>;
  onWarnChange: (id: WarnId, value: number) => void;
  claimedAt: number | null;
  playerTeam?: string;
  onClaim: () => void;
  onUndoClaim: () => void;
}

interface CycleCardModel {
  id: WarnId;
  name: string;
  description: string;
  badge: string;
  icon: IconName;
  color: string;
  status: CycleStatus;
  extra?: string;
}

export function collectTimerAlerts(
  clockTime: number | undefined,
  warnSeconds: Record<WarnId, number>,
  claimedAt: number | null,
  playerTeam?: string,
): AlertItem[] {
  if (clockTime == null) return [];

  const cards = cycleCards(clockTime);
  const items: AlertItem[] = [];

  for (const card of cards) {
    pushCycleAlert(items, card, warnSeconds[card.id]);
  }

  if (warnSeconds.tormentor > 0) {
    const view = tormentorStatus(clockTime, claimedAt, playerTeam);
    const alert = tormentorAlertStatus(clockTime, view, claimedAt);
    const name = view.enemySide ? "Tormentor · Enemy" : "Tormentor";
    pushTormentorAlert(items, "tormentor", name, alert, warnSeconds.tormentor);
  }

  items.sort(compareAlertPriority);
  return items;
}

function pushCycleAlert(items: AlertItem[], card: CycleCardModel, warn: number) {
  if (warn <= 0) return;
  const item = alertFromStatus(card.id, card.name, card.status, warn, card.color);
  if (item) items.push(item);
}

function compareAlertPriority(a: AlertItem, b: AlertItem): number {
  if (a.remaining !== b.remaining) return a.remaining - b.remaining;
  if (a.tone !== b.tone) {
    if (a.tone === "now") return -1;
    if (b.tone === "now") return 1;
    if (a.tone === "warn") return -1;
    if (b.tone === "warn") return 1;
  }
  return a.name.localeCompare(b.name);
}

function pushTormentorAlert(
  items: AlertItem[],
  id: string,
  name: string,
  status: CycleStatus,
  warn: number,
) {
  const item = alertFromStatus(id, name, status, warn, "#e8c547");
  if (item) items.push(item);
}

function alertFromStatus(
  id: string,
  name: string,
  status: CycleStatus,
  warn: number,
  color: string,
): AlertItem | null {
  if (warn <= 0 || status.phase === "active") return null;

  if (status.phase === "now" || status.phase === "window") {
    return { id, name, remaining: 0, tone: "now", color };
  }

  return {
    id,
    name,
    remaining: status.remaining,
    tone: isWarning(status.remaining, warn, status.phase) ? "warn" : "upcoming",
    color,
  };
}

function cycleCards(clock: number): CycleCardModel[] {
  return [
    {
      id: "powerRune",
      name: "Power Rune",
      description: `First ${formatClock(POWER_RUNE_FIRST)}, then every 2 min`,
      badge: "6:00",
      icon: "water-outline",
      color: "#5eb0f0",
      status: nextFixedCycle(clock, POWER_RUNE_FIRST, POWER_RUNE_INTERVAL),
    },
    {
      id: "wisdomRune",
      name: "Wisdom Rune",
      description: `First ${formatClock(WISDOM_RUNE_FIRST)}, then every 7 min`,
      badge: "7:00",
      icon: "book-outline",
      color: "#c4b5fd",
      status: nextFixedCycle(clock, WISDOM_RUNE_FIRST, WISDOM_RUNE_INTERVAL),
    },
    {
      id: "lotus",
      name: "Lotus Pool",
      description: `First ${formatClock(LOTUS_FIRST)}, then every 3 min`,
      badge: "3:00",
      icon: "leaf-outline",
      color: "#3ddab4",
      status: nextFixedCycle(clock, LOTUS_FIRST, LOTUS_INTERVAL),
      extra: clock >= LOTUS_FIRST ? "FRUIT UP" : undefined,
    },
    {
      id: "stack",
      name: "Camp Stack",
      description: `Camps from ${formatClock(CAMP_FIRST_SPAWN)} · first pull ${formatClock(STACK_FIRST_WINDOW)}`,
      badge: `:${STACK_WINDOW_START}`,
      icon: "layers-outline",
      color: "#a1a1aa",
      status: stackStatus(clock),
    },
  ];
}

export function TimersPanel({
  clockTime,
  warnSeconds,
  onWarnChange,
  claimedAt,
  playerTeam,
  onClaim,
  onUndoClaim,
}: TimersPanelProps) {
  const clockReady = clockTime != null && Number.isFinite(clockTime);
  const cards = clockReady ? cycleCards(clockTime) : [];

  return (
    <View className="px-4 pb-6">
      <View className="mb-4 flex-row items-end justify-between">
        <View>
          <Text className="text-[10px] font-bold tracking-[2px] text-zinc-500">
            OBJECTIVE CYCLES
          </Text>
          <Text className="mt-1 text-base font-bold text-white">Spawn timers</Text>
        </View>
        <View className="items-end">
          <Text className="text-[10px] font-bold tracking-widest text-zinc-500">GAME CLOCK</Text>
          <Text className="font-mono text-xl font-bold text-white">{formatClock(clockTime)}</Text>
        </View>
      </View>

      <Text className="mb-3 text-[12px] leading-5 text-zinc-400">
        Set how many seconds before each spawn you want a warning. 0 turns that alert off.
      </Text>

      {!clockReady ? (
        <View className="items-center rounded-2xl border border-white/10 bg-surface-raised px-6 py-12">
          <Ionicons name="time-outline" size={32} color="#52525b" />
          <Text className="mt-3 text-center text-[13px] text-zinc-400">
            Waiting for match clock from GSI.
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {cards.map((card) => (
            <CycleCard
              key={card.id}
              card={card}
              warnSeconds={warnSeconds[card.id]}
              onWarnChange={(value) => onWarnChange(card.id, value)}
            />
          ))}
          <TormentorCard
            clock={clockTime}
            claimedAt={claimedAt}
            playerTeam={playerTeam}
            warnSeconds={warnSeconds.tormentor}
            onWarnChange={(value) => onWarnChange("tormentor", value)}
            onClaim={onClaim}
            onUndoClaim={onUndoClaim}
          />
        </View>
      )}
    </View>
  );
}

function CycleCard({
  card,
  warnSeconds,
  onWarnChange,
}: {
  card: CycleCardModel;
  warnSeconds: number;
  onWarnChange: (value: number) => void;
}) {
  const { status } = card;
  const warn = isWarning(status.remaining, warnSeconds, status.phase);
  const hot = warn || status.phase === "now" || status.phase === "window";
  const timerColor =
    status.phase === "now" || status.phase === "window" ? "#e8c547" : card.color;

  return (
    <View
      className={`rounded-2xl border bg-surface-raised p-4 ${
        hot ? "border-gold/45" : "border-white/10"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${card.color}22` }}
        >
          <Ionicons name={card.icon} size={20} color={card.color} />
        </View>

        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[15px] font-bold text-white">{card.name}</Text>
            <View className="rounded-full border border-white/10 bg-surface-card px-2 py-0.5">
              <Text className="text-[9px] font-bold tracking-widest text-zinc-400">{card.badge}</Text>
            </View>
            {card.extra ? (
              <View className="rounded-full bg-accent-soft px-2 py-0.5">
                <Text className="text-[9px] font-bold tracking-widest text-accent">{card.extra}</Text>
              </View>
            ) : null}
            {hot ? (
              <View className="rounded-full bg-gold-dim px-2 py-0.5">
                <Text className="text-[9px] font-bold tracking-widest text-gold">
                  {status.phase === "now" || status.phase === "window" ? "NOW" : "WARN"}
                </Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-[12px] text-zinc-400">{card.description}</Text>
        </View>

        <View className="items-end">
          <Text className="font-mono text-2xl font-bold" style={{ color: timerColor }}>
            {status.phase === "now" || status.phase === "window"
              ? "00:00"
              : formatCountdown(status.remaining)}
          </Text>
          <Text className="mt-0.5 text-[10px] font-bold tracking-wide" style={{ color: card.color }}>
            {status.nextLabel}
          </Text>
        </View>
      </View>

      <WarnControl value={warnSeconds} color={card.color} onChange={onWarnChange} />
    </View>
  );
}

function TormentorCard({
  clock,
  claimedAt,
  playerTeam,
  warnSeconds,
  onWarnChange,
  onClaim,
  onUndoClaim,
}: {
  clock: number;
  claimedAt: number | null;
  playerTeam?: string;
  warnSeconds: number;
  onWarnChange: (value: number) => void;
  onClaim: () => void;
  onUndoClaim: () => void;
}) {
  const view = tormentorStatus(clock, claimedAt, playerTeam);
  const enemyAlert = tormentorAlertStatus(clock, view, claimedAt);
  const hot =
    isWarning(enemyAlert.remaining, warnSeconds, enemyAlert.phase) ||
    enemyAlert.phase === "now" ||
    view.phase === "now";
  const canUndo = claimedAt != null && !view.alive;
  const canClaim = view.alive;
  const enemyReady = view.alive && view.enemySide != null && view.side === view.enemySide;
  const sideColor = view.side === "radiant" ? "text-radiant" : "text-dire";
  const relation =
    view.enemySide == null ? null : view.side === view.enemySide ? "ENEMY" : "ALLY";

  return (
    <View
      className={`rounded-2xl border bg-surface-raised p-4 ${
        hot ? "border-gold/45" : "border-white/10"
      }`}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-gold-dim">
          <Ionicons name="shield-outline" size={20} color="#e8c547" />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[15px] font-bold text-white">Tormentor</Text>
            <View className="rounded-full border border-gold/30 bg-gold-dim px-2 py-0.5">
              <Text className="text-[9px] font-bold tracking-widest text-gold">
                {clock < TORMENTOR_FIRST ? "20:00" : "10 MIN"}
              </Text>
            </View>
            {relation ? (
              <View className="rounded-full bg-gold-dim px-2 py-0.5">
                <Text className="text-[9px] font-bold tracking-widest text-gold">{relation}</Text>
              </View>
            ) : null}
          </View>
          <Text className="mt-0.5 text-[12px] text-zinc-400">
            First {formatClock(TORMENTOR_FIRST)} · day Radiant, night Dire
          </Text>
        </View>
      </View>

      <View className="mt-3 gap-2">
        <View className="flex-row items-center gap-2 rounded-xl border border-white/5 bg-surface-card px-3 py-2.5">
          <Text className={`w-[72px] text-[11px] font-bold tracking-widest ${sideColor}`}>
            {sideLabel(view.side).toUpperCase()}
          </Text>
          <View className="flex-1">
            {view.alive ? (
              <Text className="text-[12px] font-bold tracking-wide text-gold">
                {enemyReady ? "ON ENEMY SIDE" : "SHARD READY"}
              </Text>
            ) : (
              <View className="flex-row items-baseline gap-2">
                <Text className="font-mono text-[16px] font-bold text-white">
                  {formatCountdown(view.remaining)}
                </Text>
                <Text className="text-[10px] font-bold text-zinc-500">{view.nextLabel}</Text>
              </View>
            )}
          </View>
          <Pressable
            onPress={canUndo ? onUndoClaim : onClaim}
            disabled={!canClaim && !canUndo}
            accessibilityRole="button"
            accessibilityLabel={canUndo ? "Undo tormentor claim" : "Claim tormentor"}
            className={`rounded-xl px-3 py-2 ${
              canClaim || canUndo
                ? "border border-gold/50 bg-gold-dim active:opacity-80"
                : "border border-white/10 bg-surface-muted"
            }`}
          >
            <Text
              className={`text-[10px] font-bold tracking-widest ${
                canClaim || canUndo ? "text-gold" : "text-zinc-600"
              }`}
            >
              {canUndo ? "UNDO" : "CLAIM"}
            </Text>
          </Pressable>
        </View>

        {view.enemySide != null ? (
          <View className="flex-row items-baseline justify-between rounded-xl border border-white/5 bg-surface-card px-3 py-2">
            <Text className="text-[11px] font-bold tracking-wide text-zinc-400">Enemy pit</Text>
            {enemyReady ? (
              <Text className="text-[12px] font-bold tracking-wide text-gold">NOW</Text>
            ) : (
              <View className="flex-row items-baseline gap-2">
                <Text className="font-mono text-[13px] font-bold text-white">
                  {formatCountdown(enemyAlert.remaining)}
                </Text>
                <Text className="text-[10px] font-bold text-zinc-500">
                  {sideLabel(view.enemySide)} · {formatClock(view.enemyNextAt)}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <Text className="px-1 text-[11px] text-zinc-500">
            Enemy spawn needs your team from GSI. First pit is Radiant at 20:00.
          </Text>
        )}
      </View>

      <WarnControl value={warnSeconds} color="#e8c547" onChange={onWarnChange} />
    </View>
  );
}

function WarnControl({
  value,
  color,
  onChange,
}: {
  value: number;
  color: string;
  onChange: (value: number) => void;
}) {
  const off = value <= 0;

  return (
    <View className="mt-3 flex-row items-center justify-between rounded-xl border border-white/5 bg-surface-card px-3 py-2">
      <View className="flex-row items-center gap-2">
        <Ionicons
          name={off ? "notifications-off-outline" : "notifications-outline"}
          size={14}
          color={off ? "#71717a" : color}
        />
        <Text className="text-[11px] font-bold tracking-wide text-zinc-400">
          {off ? "Alert off" : "Alert before"}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={() => onChange(value - WARN_STEP)}
          disabled={value <= WARN_MIN}
          accessibilityLabel="Decrease warning seconds"
          className="h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-surface-muted active:opacity-70"
        >
          <Ionicons name="remove" size={14} color={value <= WARN_MIN ? "#3f3f46" : "#e4e4e7"} />
        </Pressable>

        <Text className="min-w-[52px] text-center font-mono text-[13px] font-bold text-white">
          {off ? "off" : `${value}s`}
        </Text>

        <Pressable
          onPress={() => onChange(value + WARN_STEP)}
          disabled={value >= WARN_MAX}
          accessibilityLabel="Increase warning seconds"
          className="h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-surface-muted active:opacity-70"
        >
          <Ionicons name="add" size={14} color={value >= WARN_MAX ? "#3f3f46" : "#e4e4e7"} />
        </Pressable>
      </View>
    </View>
  );
}
