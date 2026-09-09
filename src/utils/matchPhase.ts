import { RelayState } from "../types";

/** Live GSI goes quiet while paused; treat that as pause, not "no match". */
const SILENCE_PAUSE_MS = 2_000;
const KEEP_PAUSED_HUD_MS = 45_000;

export function isEndedMatch(state: RelayState | null): boolean {
  if (!state) return false;
  if (state.status === "ended") return true;
  if (state.status === "idle") return false;
  const gs = state.match?.state ?? "";
  const win = (state.match?.winTeam ?? "none").toLowerCase();
  return gs.includes("POST_GAME") || (win !== "none" && win !== "");
}

/** Menu / disconnect payloads look like a frozen map, not an in-game pause. */
export function isMenuOrHollowMatch(state: RelayState | null): boolean {
  if (!state || state.status === "ended") return false;
  const gs = state.match?.state ?? "";
  if (
    gs.includes("INIT") ||
    gs.includes("DISCONNECT") ||
    gs.includes("CUSTOM_GAME_SETUP")
  ) {
    return true;
  }
  const hasHero = Boolean(state.hero?.name);
  const inMatch =
    gs.includes("HERO_SELECTION") ||
    gs.includes("STRATEGY_TIME") ||
    gs.includes("TEAM_SHOWCASE") ||
    gs.includes("WAIT_FOR") ||
    gs.includes("PRE_GAME") ||
    gs.includes("GAME_IN_PROGRESS") ||
    gs.includes("POST_GAME");
  if (inMatch || hasHero) return false;
  return true;
}

export function isPausedMatch(state: RelayState | null, now = Date.now()): boolean {
  if (!state || state.status === "idle" || isEndedMatch(state)) return false;
  if (isMenuOrHollowMatch(state)) return false;
  if (state.match?.paused) return true;
  return now - state.updatedAt >= SILENCE_PAUSE_MS;
}

export function isIdleState(state: RelayState | null, now = Date.now()): boolean {
  if (!state) return true;
  if (state.status === "idle") return true;
  if (isEndedMatch(state)) return false;
  if (isMenuOrHollowMatch(state)) return true;
  if (isPausedMatch(state, now)) return false;
  // A live snapshot is still a match, even if the next GSI packet is delayed.
  if (state.status === "live") return false;

  const hasMatch = Boolean(
    state.match?.id || state.match?.state || state.match?.clockTime != null,
  );
  return !hasMatch;
}

export function isLiveMatch(state: RelayState | null, now = Date.now()): boolean {
  return Boolean(state) && !isIdleState(state, now) && !isEndedMatch(state);
}

export function mergeRelayState(
  prev: RelayState | null,
  next: RelayState,
  now = Date.now(),
): RelayState {
  if (isMenuOrHollowMatch(next)) {
    return { ...next, status: "idle", idleCause: "gsi" };
  }
  if (next.status !== "idle") return next;
  if (!prev || prev.status !== "live") return next;
  if (next.idleCause === "gsi") return next;

  const silentFor = now - prev.updatedAt;
  const timedOut = next.idleCause === "timeout" || silentFor >= SILENCE_PAUSE_MS;
  if (timedOut && silentFor <= KEEP_PAUSED_HUD_MS) {
    return { ...prev, match: { ...prev.match, paused: true } };
  }
  return next;
}

export function winnerLabel(winTeam?: string): string | null {
  const win = (winTeam ?? "").toLowerCase();
  if (win === "radiant") return "Radiant victory";
  if (win === "dire") return "Dire victory";
  return null;
}
