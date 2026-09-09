import { Platform } from "react-native";
import { DEFAULT_RELAY_HOST, RELAY_PORT } from "../config";
import { Computer } from "../types/computer";
import { loadJson, saveJson } from "../utils/storage";

const LAST_HOST_KEY = "dota-companion-last-relay-host";

/** Known relay hosts to probe — only reachable ones appear in the list. */
export const KNOWN_COMPUTERS: Omit<Computer, "online" | "lastSeenLabel">[] = [
  {
    id: "pc-main",
    name: "Gaming PC",
    host: DEFAULT_RELAY_HOST,
    subtitle: "Valve GSI Relay",
  },
];

function buildRelayHttpBase(host: string): string {
  const resolved = Platform.OS === "web" ? "localhost" : host;
  return `http://${resolved}:${RELAY_PORT}`;
}

function isIPv4(host: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

function subnetPrefix(host: string): string | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

async function probeRelay(host: string, timeoutMs = 2500): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const base = buildRelayHttpBase(host);
  try {
    const health = await fetch(`${base}/health`, { method: "GET", signal: controller.signal });
    if (health.ok) {
      try {
        const body = (await health.json()) as { service?: string; ok?: boolean };
        if (body.service === "dota2-gsi-relay" || body.ok === true) return true;
      } catch {
        return true;
      }
    }
    const state = await fetch(`${base}/state`, { method: "GET", signal: controller.signal });
    return state.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function scanSubnet(prefix: string, skip: Set<string>): Promise<string | null> {
  const hosts: string[] = [];
  for (let i = 1; i <= 254; i++) {
    const host = `${prefix}.${i}`;
    if (!skip.has(host)) hosts.push(host);
  }

  const concurrency = 32;
  for (let i = 0; i < hosts.length; i += concurrency) {
    const batch = hosts.slice(i, i + concurrency);
    const found = await Promise.all(
      batch.map(async (host) => ((await probeRelay(host, 700)) ? host : null)),
    );
    const hit = found.find((host): host is string => Boolean(host));
    if (hit) return hit;
  }
  return null;
}

/**
 * Prefer the last working Wi-Fi IP, then the compiled default, then the LAN /24.
 * Never uses VPN tunnel addresses — those are not on this subnet scan.
 */
async function findLanRelayHost(): Promise<string> {
  if (Platform.OS === "web") return "localhost";

  const last = await loadJson<string | null>(LAST_HOST_KEY, null);
  const seeds = [last, DEFAULT_RELAY_HOST].filter(
    (host): host is string => Boolean(host) && isIPv4(host),
  );

  const tried = new Set<string>();
  for (const host of seeds) {
    if (tried.has(host)) continue;
    tried.add(host);
    if (await probeRelay(host, 2000)) {
      await saveJson(LAST_HOST_KEY, host);
      return host;
    }
  }

  const prefixes = new Set<string>();
  for (const host of seeds) {
    const prefix = subnetPrefix(host);
    if (prefix) prefixes.add(prefix);
  }

  for (const prefix of prefixes) {
    const found = await scanSubnet(prefix, tried);
    if (found) {
      await saveJson(LAST_HOST_KEY, found);
      return found;
    }
  }

  return last && isIPv4(last) ? last : DEFAULT_RELAY_HOST;
}

/** Probe known hosts. Unreachable PCs still appear so you can open and retry. */
export async function discoverComputers(): Promise<Computer[]> {
  const host = await findLanRelayHost();
  const online = await probeRelay(host, 2000);
  return KNOWN_COMPUTERS.map((pc) => ({
    ...pc,
    host,
    online,
    lastSeenLabel: online ? "Just now" : "Unreachable",
  }));
}
