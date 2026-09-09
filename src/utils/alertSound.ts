import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";

const warnSource = require("../../assets/sounds/warn.wav");
const spawnSource = require("../../assets/sounds/spawn.wav");

export type AlertTone = "warn" | "now";

export interface AlertSoundOptions {
  muted: boolean;
  volume: number;
  soundOnWarn: boolean;
  soundOnSpawn: boolean;
}

let loadPromise: Promise<void> | null = null;
let warnSound: Audio.Sound | null = null;
let spawnSound: Audio.Sound | null = null;

async function ensureSounds(): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        interruptionModeIOS: InterruptionModeIOS.DuckOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      });
      warnSound = (await Audio.Sound.createAsync(warnSource)).sound;
      spawnSound = (await Audio.Sound.createAsync(spawnSource)).sound;
    })().catch((error) => {
      loadPromise = null;
      throw error;
    });
  }
  await loadPromise;
}

async function replay(sound: Audio.Sound | null, volume: number): Promise<void> {
  if (!sound) return;
  await sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
  await sound.setPositionAsync(0);
  await sound.playAsync();
}

export async function prepareAlertSounds(): Promise<void> {
  try {
    await ensureSounds();
  } catch {
    // Web / missing native module — alerts stay visual.
  }
}

export async function playAlertTone(
  tone: AlertTone,
  options: AlertSoundOptions,
): Promise<void> {
  if (options.muted) return;
  if (tone === "warn" && !options.soundOnWarn) return;
  if (tone === "now" && !options.soundOnSpawn) return;

  try {
    await ensureSounds();
    await replay(tone === "now" ? spawnSound : warnSound, options.volume);
  } catch {
    // Ignore playback failures so the match UI never stalls.
  }
}

export async function playPreviewTone(volume: number): Promise<void> {
  try {
    await ensureSounds();
    await replay(spawnSound, volume);
  } catch {
    // Same as live alerts — fail silently if audio is unavailable.
  }
}
