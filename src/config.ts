import { Platform } from "react-native";

export const RELAY_PORT = 3500;

// Fallback Wi-Fi IP if LAN scan has not found the relay yet.
// VPN tunnel IPs (10.5.x / 10.100.x) must never go here.
export const DEFAULT_RELAY_HOST = "192.168.100.131";

export function buildRelayWsUrl(host: string): string {
  const resolved = Platform.OS === "web" ? "localhost" : host;
  return `ws://${resolved}:${RELAY_PORT}`;
}

export const RELAY_WS_URL = buildRelayWsUrl(DEFAULT_RELAY_HOST);
