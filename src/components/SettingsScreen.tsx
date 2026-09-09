import { Ionicons } from "@expo/vector-icons";
import { type ReactNode, useEffect } from "react";
import { BackHandler, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  VOLUME_MAX,
  VOLUME_MIN,
  VOLUME_STEP,
  useAppSettings,
} from "../context/AppSettingsContext";
import { playPreviewTone } from "../utils/alertSound";

interface SettingsScreenProps {
  onClose: () => void;
  onResetWarnings: () => void;
}

export function SettingsScreen({ onClose, onResetWarnings }: SettingsScreenProps) {
  const insets = useSafeAreaInsets();
  const {
    settings,
    setMuted,
    setVolume,
    setVibration,
    setSoundOnWarn,
    setSoundOnSpawn,
    setKeepAwake,
  } = useAppSettings();

  const volumePct = Math.round(settings.volume * 100);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  return (
    <View className="absolute inset-0 z-20 bg-surface">
        <View className="flex-row items-center gap-3 px-4 pb-3 pt-4">
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close settings"
            className="h-10 w-10 items-center justify-center rounded-xl border border-accent/25 bg-surface-card"
          >
            <Ionicons name="chevron-back" size={20} color="#3ddab4" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-[13px] font-bold tracking-[1.5px] text-white">SETTINGS</Text>
            <Text className="mt-0.5 text-[12px] text-zinc-400">Sound, haptics, and display</Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 24) }}
          showsVerticalScrollIndicator={false}
        >
          <Section title="SOUND">
            <ToggleRow
              icon={settings.muted ? "volume-mute-outline" : "volume-high-outline"}
              label="Mute all sounds"
              hint="Same as the speaker button in the header"
              value={settings.muted}
              onChange={setMuted}
            />
            <View className="mt-2 rounded-2xl border border-white/10 bg-surface-raised px-4 py-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="musical-notes-outline" size={16} color="#3ddab4" />
                  <Text className="text-[13px] font-bold text-white">Volume</Text>
                </View>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setVolume(settings.volume - VOLUME_STEP)}
                    disabled={settings.volume <= VOLUME_MIN}
                    accessibilityLabel="Decrease volume"
                    className="h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-surface-muted active:opacity-70"
                  >
                    <Ionicons
                      name="remove"
                      size={14}
                      color={settings.volume <= VOLUME_MIN ? "#3f3f46" : "#e4e4e7"}
                    />
                  </Pressable>
                  <Text className="min-w-[44px] text-center font-mono text-[13px] font-bold text-white">
                    {volumePct}%
                  </Text>
                  <Pressable
                    onPress={() => setVolume(settings.volume + VOLUME_STEP)}
                    disabled={settings.volume >= VOLUME_MAX}
                    accessibilityLabel="Increase volume"
                    className="h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-surface-muted active:opacity-70"
                  >
                    <Ionicons
                      name="add"
                      size={14}
                      color={settings.volume >= VOLUME_MAX ? "#3f3f46" : "#e4e4e7"}
                    />
                  </Pressable>
                </View>
              </View>
              <Text className="mt-2 text-[11px] leading-4 text-zinc-500">
                Changing volume unmutes alert sounds.
              </Text>
            </View>
            <ToggleRow
              icon="notifications-outline"
              label="Warning chime"
              hint="Play a tone when a timer enters the alert window"
              value={settings.soundOnWarn}
              onChange={setSoundOnWarn}
            />
            <ToggleRow
              icon="flash-outline"
              label="Spawn chime"
              hint="Play a stronger tone when an objective is due"
              value={settings.soundOnSpawn}
              onChange={setSoundOnSpawn}
            />
            <Pressable
              onPress={() => {
                void playPreviewTone(settings.volume);
              }}
              disabled={settings.muted}
              accessibilityRole="button"
              accessibilityLabel="Play a test alert sound"
              className={`mt-2 flex-row items-center justify-center gap-2 rounded-2xl border px-4 py-3 ${
                settings.muted
                  ? "border-white/5 bg-surface-card"
                  : "border-accent/40 bg-accent-soft active:opacity-80"
              }`}
            >
              <Ionicons
                name="play-outline"
                size={16}
                color={settings.muted ? "#52525b" : "#3ddab4"}
              />
              <Text
                className={`text-[12px] font-bold tracking-widest ${
                  settings.muted ? "text-zinc-600" : "text-accent"
                }`}
              >
                {settings.muted ? "UNMUTE TO TEST" : "TEST SOUND"}
              </Text>
            </Pressable>
          </Section>

          <Section title="HAPTICS">
            <ToggleRow
              icon="phone-portrait-outline"
              label="Vibration"
              hint="Short pulse with each warn and spawn alert"
              value={settings.vibration}
              onChange={setVibration}
            />
          </Section>

          <Section title="DISPLAY">
            <ToggleRow
              icon="sunny-outline"
              label="Keep screen on"
              hint="Stop the phone from sleeping while a match is open"
              value={settings.keepAwake}
              onChange={setKeepAwake}
            />
          </Section>

          <Section title="TIMERS">
            <Pressable
              onPress={onResetWarnings}
              accessibilityRole="button"
              accessibilityLabel="Reset timer warning lead times"
              className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-surface-raised px-4 py-3.5 active:opacity-80"
            >
              <View className="min-w-0 flex-1 pr-3">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="refresh" size={16} color="#e8c547" />
                  <Text className="text-[13px] font-bold text-white">Reset alert times</Text>
                </View>
                <Text className="mt-1 text-[11px] leading-4 text-zinc-500">
                  Restore default lead times for runes, lotus, tormentor, and stacks.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#52525b" />
            </Pressable>
          </Section>
        </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="mb-2 px-1 text-[10px] font-bold tracking-[2px] text-zinc-500">{title}</Text>
      {children}
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      className="mb-2 flex-row items-center justify-between rounded-2xl border border-white/10 bg-surface-raised px-4 py-3.5 active:opacity-90"
    >
      <View className="min-w-0 flex-1 pr-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name={icon} size={16} color={value ? "#3ddab4" : "#71717a"} />
          <Text className="text-[13px] font-bold text-white">{label}</Text>
        </View>
        <Text className="mt-1 text-[11px] leading-4 text-zinc-500">{hint}</Text>
      </View>
      <View
        className={`h-7 w-12 justify-center rounded-full px-0.5 ${value ? "bg-accent" : "bg-zinc-700"}`}
      >
        <View className={`h-6 w-6 rounded-full bg-white ${value ? "self-end" : "self-start"}`} />
      </View>
    </Pressable>
  );
}
