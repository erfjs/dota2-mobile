import { formatClock } from "./format";

export type WarnId = "powerRune" | "wisdomRune" | "lotus" | "tormentor" | "stack";

export type ObjectivePhase = "countdown" | "now" | "active" | "window";

export type MapSide = "radiant" | "dire";

export interface CycleStatus {
  remaining: number;
  nextAt: number;
  phase: ObjectivePhase;
  nextLabel: string;
}

export interface TormentorView extends CycleStatus {
  alive: boolean;
  side: MapSide;
  playerTeam: MapSide | null;
  enemySide: MapSide | null;
  /** Next clock time the pit is on the enemy half. NaN if team is unknown. */
  enemyNextAt: number;
}

export const DEFAULT_WARN_SECONDS: Record<WarnId, number> = {
  powerRune: 15,
  wisdomRune: 20,
  lotus: 10,
  tormentor: 30,
  stack: 5,
};

export const WARN_MIN = 0;
export const WARN_MAX = 90;
export const WARN_STEP = 5;

/** Power runes: 6:00, then every 2 minutes. */
export const POWER_RUNE_FIRST = 6 * 60;
export const POWER_RUNE_INTERVAL = 2 * 60;

/** Wisdom shrine: 7:00, then every 7 minutes. */
export const WISDOM_RUNE_FIRST = 7 * 60;
export const WISDOM_RUNE_INTERVAL = 7 * 60;

/** Lotus: 3:00, then every 3 minutes (pools keep fruit until taken). */
export const LOTUS_FIRST = 3 * 60;
export const LOTUS_INTERVAL = 3 * 60;

/** One Tormentor: first spawn 20:00, respawn 10 minutes after a claimed kill. */
export const TORMENTOR_FIRST = 20 * 60;
export const TORMENTOR_RESPAWN = 10 * 60;

/** Natural day/night is 5 minutes each and starts on day at 0:00. */
export const DAY_NIGHT_INTERVAL = 5 * 60;

/**
 * Neutral camps first spawn at 1:00, then every minute.
 * First stack window is 1:53 (nothing to pull at 0:53).
 */
export const CAMP_FIRST_SPAWN = 1 * 60;
export const STACK_WINDOW_START = 53;
export const STACK_WINDOW_END = 55;
export const STACK_FIRST_WINDOW = CAMP_FIRST_SPAWN + STACK_WINDOW_START;

/**
 * Seconds until the next occurrence of a first-spawn + interval cycle.
 * At the exact spawn second, remaining is 0 (NOW) for that tick.
 */
export function nextFixedCycle(
  clock: number,
  firstSpawn: number,
  interval: number,
): CycleStatus {
  if (!Number.isFinite(clock) || interval <= 0) {
    return { remaining: NaN, nextAt: firstSpawn, phase: "countdown", nextLabel: "—" };
  }

  if (clock < firstSpawn) {
    const remaining = firstSpawn - clock;
    return {
      remaining,
      nextAt: firstSpawn,
      phase: remaining < 1 ? "now" : "countdown",
      nextLabel: `at ${formatClock(firstSpawn)}`,
    };
  }

  const elapsed = clock - firstSpawn;
  const into = elapsed % interval;

  if (into < 1) {
    return {
      remaining: 0,
      nextAt: clock,
      phase: "now",
      nextLabel: "SPAWNING",
    };
  }

  const remaining = interval - into;
  const nextAt = clock + remaining;
  return {
    remaining,
    nextAt,
    phase: remaining < 1 ? "now" : "countdown",
    nextLabel: `at ${formatClock(nextAt)}`,
  };
}

export function parseMapSide(value?: string | null): MapSide | null {
  const team = value?.toLowerCase();
  if (team === "radiant" || team === "dire") return team;
  return null;
}

export function enemySideOf(team: MapSide): MapSide {
  return team === "radiant" ? "dire" : "radiant";
}

/** Clock-based day/night. Ignores Night Stalker darkness, matching Tormentor rules. */
export function isNaturalDaytime(clock: number): boolean {
  if (!Number.isFinite(clock) || clock < 0) return true;
  return Math.floor(clock / DAY_NIGHT_INTERVAL) % 2 === 0;
}

/** 7.41: day = Radiant (SE), night = Dire (NW). */
export function tormentorSideAt(clock: number): MapSide {
  return isNaturalDaytime(clock) ? "radiant" : "dire";
}

export function nextDayNightFlip(clock: number): number {
  if (!Number.isFinite(clock)) return DAY_NIGHT_INTERVAL;
  const into = ((clock % DAY_NIGHT_INTERVAL) + DAY_NIGHT_INTERVAL) % DAY_NIGHT_INTERVAL;
  if (into < 1) return clock + DAY_NIGHT_INTERVAL;
  return clock + (DAY_NIGHT_INTERVAL - into);
}

function nextTimeOnSide(fromClock: number, side: MapSide): number {
  const start = Math.max(fromClock, TORMENTOR_FIRST);
  if (tormentorSideAt(start) === side) return start;
  return nextDayNightFlip(start);
}

export function tormentorStatus(
  clock: number,
  claimedAt: number | null,
  playerTeam?: string | null,
): TormentorView {
  const team = parseMapSide(playerTeam);
  const enemySide = team ? enemySideOf(team) : null;

  if (!Number.isFinite(clock)) {
    return emptyTormentorView(team, enemySide);
  }

  const spawnAt =
    clock < TORMENTOR_FIRST
      ? TORMENTOR_FIRST
      : claimedAt != null && clock < claimedAt + TORMENTOR_RESPAWN
        ? claimedAt + TORMENTOR_RESPAWN
        : null;

  const alive = spawnAt == null;
  const side = tormentorSideAt(alive ? clock : spawnAt);
  const enemyNextAt = enemySide == null ? NaN : nextTimeOnSide(alive ? clock : spawnAt, enemySide);

  if (!alive) {
    const remaining = spawnAt - clock;
    return {
      remaining,
      nextAt: spawnAt,
      phase: remaining < 1 ? "now" : "countdown",
      nextLabel: `at ${formatClock(spawnAt)} · ${sideLabel(side)}`,
      alive: false,
      side,
      playerTeam: team,
      enemySide,
      enemyNextAt,
    };
  }

  const onEnemy = enemySide != null && side === enemySide;
  return {
    remaining: 0,
    nextAt: clock,
    phase: "active",
    nextLabel: onEnemy ? "ENEMY SIDE" : `${sideLabel(side)} SIDE`,
    alive: true,
    side,
    playerTeam: team,
    enemySide,
    enemyNextAt,
  };
}

function emptyTormentorView(team: MapSide | null, enemySide: MapSide | null): TormentorView {
  return {
    remaining: NaN,
    nextAt: TORMENTOR_FIRST,
    phase: "countdown",
    nextLabel: "—",
    alive: false,
    side: tormentorSideAt(TORMENTOR_FIRST),
    playerTeam: team,
    enemySide,
    enemyNextAt: NaN,
  };
}

export function tormentorAlertStatus(
  clock: number,
  view: TormentorView,
  claimedAt: number | null = null,
): CycleStatus {
  if (view.enemySide == null || !Number.isFinite(view.enemyNextAt)) {
    if (view.alive) {
      return { remaining: 0, nextAt: view.nextAt, phase: "active", nextLabel: view.nextLabel };
    }
    return view;
  }

  if (view.alive && view.side === view.enemySide) {
    const lastAppear =
      claimedAt != null && claimedAt + TORMENTOR_RESPAWN <= clock
        ? claimedAt + TORMENTOR_RESPAWN
        : TORMENTOR_FIRST;
    const intoPeriod = ((clock % DAY_NIGHT_INTERVAL) + DAY_NIGHT_INTERVAL) % DAY_NIGHT_INTERVAL;
    const justArrived = clock - lastAppear < 1 || intoPeriod < 1;
    if (justArrived) {
      return { remaining: 0, nextAt: view.enemyNextAt, phase: "now", nextLabel: "ENEMY SIDE" };
    }
    return { remaining: 0, nextAt: view.enemyNextAt, phase: "active", nextLabel: "ENEMY SIDE" };
  }

  const remaining = view.enemyNextAt - clock;
  return {
    remaining,
    nextAt: view.enemyNextAt,
    phase: remaining < 1 ? "now" : "countdown",
    nextLabel: `enemy at ${formatClock(view.enemyNextAt)}`,
  };
}

export function stackStatus(clock: number): CycleStatus {
  if (!Number.isFinite(clock)) {
    return { remaining: NaN, nextAt: STACK_FIRST_WINDOW, phase: "countdown", nextLabel: "—" };
  }

  if (clock < STACK_FIRST_WINDOW) {
    const remaining = STACK_FIRST_WINDOW - clock;
    return {
      remaining,
      nextAt: STACK_FIRST_WINDOW,
      phase: remaining < 1 ? "window" : "countdown",
      nextLabel: `at ${formatClock(STACK_FIRST_WINDOW)}`,
    };
  }

  const sec = ((clock % 60) + 60) % 60;

  if (sec >= STACK_WINDOW_START && sec <= STACK_WINDOW_END) {
    return {
      remaining: 0,
      nextAt: clock,
      phase: "window",
      nextLabel: "STACK NOW",
    };
  }

  const remaining =
    sec < STACK_WINDOW_START
      ? STACK_WINDOW_START - sec
      : 60 - sec + STACK_WINDOW_START;

  const nextAt = clock + remaining;
  return {
    remaining,
    nextAt,
    phase: remaining < 1 ? "window" : "countdown",
    nextLabel: `at ${formatClock(nextAt)}`,
  };
}

export function isWarning(remaining: number, warnSeconds: number, phase: ObjectivePhase): boolean {
  if (warnSeconds <= 0) return false;
  if (phase === "active" || phase === "now" || phase === "window") return false;
  return remaining > 0 && remaining <= warnSeconds;
}

export function clampWarn(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const stepped = Math.round(value / WARN_STEP) * WARN_STEP;
  return Math.min(WARN_MAX, Math.max(WARN_MIN, stepped));
}

export function sideLabel(side: MapSide): string {
  return side === "radiant" ? "Radiant" : "Dire";
}
