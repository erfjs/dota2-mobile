import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { ComputerCard } from "../components/ComputerCard";
import { discoverComputers } from "../data/computers";
import { Computer } from "../types/computer";

interface ComputerListScreenProps {
  onSelect: (computer: Computer) => void;
}

export function ComputerListScreen({ onSelect }: ComputerListScreenProps) {
  const [computers, setComputers] = useState<Computer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const scan = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const found = await discoverComputers();
      setComputers(found);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void scan();
  }, [scan]);

  return (
    <View className="flex-1 bg-surface">
      <View className="px-5 pb-4 pt-2">
        <View className="flex-row items-center gap-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl border border-accent/35 bg-surface-card">
            <Ionicons name="shield-half" size={22} color="#3ddab4" />
          </View>
          <View className="flex-1">
            <Text className="text-[13px] font-bold tracking-[2px] text-white">
              DOTA COMPANION
            </Text>
            <Text className="mt-0.5 text-[12px] text-zinc-400">
              Select a PC running the GSI relay
            </Text>
          </View>
          <Pressable
            onPress={() => void scan(true)}
            accessibilityLabel="Refresh computers"
            className="h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-surface-raised active:opacity-80"
          >
            <Ionicons name="refresh" size={18} color="#3ddab4" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void scan(true)}
            tintColor="#3ddab4"
            colors={["#3ddab4"]}
          />
        }
      >
        <Text className="mb-3 text-[10px] font-bold tracking-[2px] text-zinc-500">
          AVAILABLE COMPUTERS
        </Text>

        {loading ? (
          <View className="items-center justify-center py-16">
            <ActivityIndicator color="#3ddab4" size="large" />
            <Text className="mt-4 text-[13px] text-zinc-400">
              Looking for relays on Wi-Fi (not VPN)…
            </Text>
          </View>
        ) : computers.length === 0 ? (
          <View className="items-center rounded-2xl border border-white/10 bg-surface-raised px-6 py-12">
            <Ionicons name="desktop-outline" size={36} color="#52525b" />
            <Text className="mt-4 text-center text-base font-bold text-white">
              No computers found
            </Text>
            <Text className="mt-2 text-center text-[13px] leading-5 text-zinc-400">
              Start the GSI relay on your PC, then pull to refresh.
            </Text>
            <Pressable
              onPress={() => void scan(true)}
              className="mt-6 rounded-xl border border-accent/40 bg-accent-soft px-5 py-2.5 active:opacity-80"
            >
              <Text className="text-[12px] font-bold tracking-widest text-accent">
                SCAN AGAIN
              </Text>
            </Pressable>
          </View>
        ) : (
          computers.map((computer) => (
            <ComputerCard key={computer.id} computer={computer} onPress={onSelect} />
          ))
        )}
      </ScrollView>
    </View>
  );
}
