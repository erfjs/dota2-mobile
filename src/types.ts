export type MatchStatus = "idle" | "live" | "ended";
export type IdleCause = "gsi" | "timeout";

export interface RelayState {
  updatedAt: number;
  status?: MatchStatus;
  idleCause?: IdleCause;
  match: {
    id?: string;
    gameTime?: number;
    clockTime?: number;
    state?: string;
    paused?: boolean;
    winTeam?: string;
    radiantScore?: number;
    direScore?: number;
  };
  player: {
    name?: string;
    team?: string;
    gold?: number;
    gpm?: number;
    xpm?: number;
    kills?: number;
    deaths?: number;
    assists?: number;
    lastHits?: number;
    denies?: number;
  };
  hero: {
    name?: string;
    level?: number;
    health?: number;
    maxHealth?: number;
    healthPercent?: number;
    mana?: number;
    maxMana?: number;
    manaPercent?: number;
    alive?: boolean;
    respawnSeconds?: number;
  };
  items: { slot: string; name: string }[];
}
