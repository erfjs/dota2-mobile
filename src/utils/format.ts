/** Format clock seconds as M:SS (supports negative pre-game clocks). */
export function formatClock(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return "--:--";
  const neg = seconds < 0;
  const abs = Math.abs(Math.floor(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${neg ? "-" : ""}${m}:${s.toString().padStart(2, "0")}`;
}

/** Countdown as MM:SS (never negative). */
export function formatCountdown(seconds?: number): string {
  if (seconds == null || Number.isNaN(seconds)) return "--:--";
  const abs = Math.max(0, Math.floor(seconds));
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** npc_dota_hero_juggernaut → JUGGERNAUT */
export function formatHeroName(raw?: string): string {
  if (!raw) return "UNKNOWN HERO";
  return raw
    .replace(/^npc_dota_hero_/, "")
    .replace(/_/g, " ")
    .toUpperCase();
}

export function formatNumber(n?: number): string {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

/** npc_dota_hero_axe → axe */
export function heroKey(raw?: string): string | null {
  if (!raw) return null;
  const key = raw.replace(/^npc_dota_hero_/, "").trim();
  return key || null;
}

/** Steam CDN portrait used by dota_react. */
export function heroImageUrl(raw?: string): string | null {
  const key = heroKey(raw);
  if (!key) return null;
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${key}.png`;
}

/** item_manta → manta */
export function itemKey(raw?: string): string | null {
  if (!raw) return null;
  const key = raw.replace(/^item_/, "").trim();
  return key || null;
}

/** In-game style item icon (lg) from Steam CDN. */
export function itemImageUrl(raw?: string): string | null {
  const key = itemKey(raw);
  if (!key) return null;
  return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/items/${key}_lg.png`;
}

/** item_manta → Manta */
export function formatItemName(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/^item_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function kdaRatio(kills = 0, deaths = 0, assists = 0): number {
  return (kills + assists) / Math.max(deaths, 1);
}

/** Rough day/night from clock (5 min each after horn). */
export function dayNightFromClock(clockTime?: number): "day" | "night" {
  if (clockTime == null || clockTime < 0) return "day";
  return Math.floor(clockTime / 300) % 2 === 0 ? "day" : "night";
}

export function farmPerMinute(lastHits?: number, gameTime?: number): string {
  if (lastHits == null || !gameTime || gameTime <= 0) return "—";
  return (lastHits / (gameTime / 60)).toFixed(1);
}
