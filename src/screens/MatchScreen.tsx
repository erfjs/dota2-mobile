import { Ionicons } from "@expo/vector-icons";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  Vibration,
  View,
} from "react-native";
import { AlertBanner } from "../components/AlertBanner";
import { AppHeader } from "../components/AppHeader";
import { HeroPanel } from "../components/HeroPanel";
import { MatchScoreboard } from "../components/MatchScoreboard";
import { SettingsScreen } from "../components/SettingsScreen";
import { TabBar, MatchTab } from "../components/TabBar";
import { TimersPanel, collectTimerAlerts } from "../components/TimersPanel";
import { useAppSettings } from "../context/AppSettingsContext";
import { useLiveClock } from "../hooks/useLiveClock";
import { useWarningSettings } from "../hooks/useWarningSettings";
import { Computer } from "../types/computer";
import { playAlertTone } from "../utils/alertSound";
import { isEndedMatch, isIdleState, isLiveMatch, isPausedMatch, winnerLabel } from "../utils/matchPhase";
import { ConnectionStatus, useGameState } from "../useGameState";
import { buildRelayWsUrl } from "../config";

interface MatchScreenProps {
  computer: Computer;
  onBack: () => void;
}

export function MatchScreen({ computer, onBack }: MatchScreenProps) {
  const { status, state, latencyMs } = useGameState(buildRelayWsUrl(computer.host));
  const [tab, setTab] = useState<MatchTab>("match");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { warnSeconds, setWarn, resetWarn } = useWarningSettings();
  const { settings, toggleMuted } = useAppSettings();
  const [claimedAt, setClaimedAt] = useState<number | null>(null);
  const matchIdRef = useRef(state?.match.id);

  const live = isLiveMatch(state);
  const ended = isEndedMatch(state) && !isIdleState(state);
  const paused = isPausedMatch(state);
  const waiting = !state || isIdleState(state);

  const clockTime = useLiveClock({
    clockTime: state?.match.clockTime,
    updatedAt: state?.updatedAt,
    live: live && status === "connected" && !paused,
  });

  useEffect(() => {
    if (!state) return;
    if (state.match.id !== matchIdRef.current) {
      matchIdRef.current = state.match.id;
      setClaimedAt(null);
    }
  }, [state]);

  const alerts = useMemo(
    () => (live ? collectTimerAlerts(clockTime, warnSeconds, claimedAt, state?.player.team) : []),
    [live, clockTime, warnSeconds, claimedAt, state?.player.team],
  );

  const seenAlerts = useRef(new Set<string>());
  useEffect(() => {
    if (!live) {
      seenAlerts.current.clear();
      return;
    }

    const active = new Set<string>();
    let pulse: "none" | "warn" | "now" = "none";

    for (const item of alerts) {
      if (item.tone === "upcoming") continue;
      const key = `${item.id}:${item.tone}`;
      active.add(key);
      if (!seenAlerts.current.has(key)) {
        pulse = item.tone === "now" ? "now" : pulse === "now" ? "now" : "warn";
      }
    }

    if (pulse !== "none") {
      if (settings.vibration && Platform.OS !== "web") {
        Vibration.vibrate(pulse === "now" ? 180 : 70);
      }
      void playAlertTone(pulse, settings);
    }

    for (const key of [...seenAlerts.current]) {
      if (!active.has(key)) seenAlerts.current.delete(key);
    }
    for (const key of active) seenAlerts.current.add(key);
  }, [alerts, live, settings]);

  const alertCount = alerts.filter((item) => item.tone !== "upcoming").length;

  useEffect(() => {
    if (!settings.keepAwake) {
      void deactivateKeepAwake("dota-companion-match").catch(() => {});
      return;
    }
    void activateKeepAwakeAsync("dota-companion-match").catch(() => {});
    return () => {
      void deactivateKeepAwake("dota-companion-match").catch(() => {});
    };
  }, [settings.keepAwake]);

  return (
    <View className="flex-1 bg-surface">
      <AppHeader
        computerName={computer.name}
        host={computer.host}
        status={status}
        latencyMs={latencyMs}
        muted={settings.muted}
        onBack={onBack}
        onMutePress={toggleMuted}
        onSettingsPress={() => setSettingsOpen(true)}
      />

      {waiting || !state ? (
        <WaitingForLiveGsi host={computer.host} status={status} />
      ) : (
        <>
          {paused && !ended ? <PauseBanner /> : null}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {tab === "match" ? (
              <>
                {ended ? (
                  <MatchEndedBanner winTeam={state.match.winTeam} />
                ) : (
                  <AlertBanner items={alerts} />
                )}
                <MatchScoreboard
                  radiantScore={state.match.radiantScore}
                  direScore={state.match.direScore}
                  clockTime={clockTime ?? state.match.clockTime}
                  ended={ended}
                  paused={paused && !ended}
                />
                <HeroPanel state={state} ended={ended} />
              </>
            ) : (
              <TimersPanel
                clockTime={clockTime}
                warnSeconds={warnSeconds}
                onWarnChange={setWarn}
                claimedAt={claimedAt}
                playerTeam={state.player.team}
                onClaim={() => {
                  if (clockTime == null) return;
                  setClaimedAt(clockTime);
                }}
                onUndoClaim={() => {
                  setClaimedAt(null);
                }}
              />
            )}
          </ScrollView>

          <TabBar active={tab} onChange={setTab} timerAlertCount={alertCount} />
        </>
      )}
      {settingsOpen ? (
        <SettingsScreen
          onClose={() => setSettingsOpen(false)}
          onResetWarnings={resetWarn}
        />
      ) : null}
    </View>
  );
}

function WaitingForLiveGsi({
  host,
  status,
}: {
  host: string;
  status: ConnectionStatus;
}) {
  const connecting = status === "connecting";
  const connected = status === "connected";

  const title = connected
    ? "Waiting for match data"
    : connecting
      ? "Connecting to relay"
      : "Relay unreachable";

  const detail = connected
    ? `Connected to ${host}, but there is no live match. Join a game and keep Dota 2 in focus.`
    : connecting
      ? `Reaching ${host} on port 3500…`
      : `Could not reach ${host}. Use the same Wi‑Fi as the PC, confirm the relay is running, and allow inbound port 3500.`;

  return (
    <View className="flex-1 items-center justify-center px-8">
      {connecting ? (
        <ActivityIndicator color="#3ddab4" size="large" />
      ) : (
        <View
          className={`h-16 w-16 items-center justify-center rounded-2xl border ${
            connected ? "border-accent/35 bg-accent-soft" : "border-dire/40 bg-surface-card"
          }`}
        >
          <Ionicons
            name={connected ? "game-controller-outline" : "cloud-offline-outline"}
            size={28}
            color={connected ? "#3ddab4" : "#ef4444"}
          />
        </View>
      )}
      <Text className="mt-5 text-center text-base font-bold text-white">{title}</Text>
      <Text className="mt-2 text-center text-[13px] leading-5 text-zinc-400">{detail}</Text>
    </View>
  );
}

function PauseBanner() {
  return (
    <View className="mx-4 mt-3 mb-1 flex-row items-center justify-center gap-2 rounded-xl border border-gold/50 bg-gold-dim px-3 py-3">
      <Ionicons name="pause" size={16} color="#e8c547" />
      <Text className="text-center text-base font-bold tracking-[6px] text-gold">PAUSE</Text>
    </View>
  );
}

function MatchEndedBanner({ winTeam }: { winTeam?: string }) {
  const winner = winnerLabel(winTeam);
  return (
    <View className="mx-4 mb-2 rounded-xl border border-gold/50 bg-gold-dim px-3 py-2.5">
      <Text className="text-center text-[11px] font-bold tracking-widest text-gold">
        MATCH ENDED
      </Text>
      {winner ? (
        <Text className="mt-0.5 text-center text-[13px] font-bold text-white">{winner}</Text>
      ) : null}
    </View>
  );
}
