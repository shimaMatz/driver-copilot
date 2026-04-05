import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = '@truck_copilot/truck_profile_v1';

export type TruckProfile = {
  /** 車両全長（m） */
  lengthM: number;
  /** 車幅（m） */
  widthM: number;
  /** 車高（m） */
  heightM: number;
};

export const DEFAULT_TRUCK_PROFILE: TruckProfile = {
  lengthM: 12,
  widthM: 2.5,
  heightM: 3.8,
};

function parseProfile(raw: string | null): TruckProfile {
  if (!raw) return { ...DEFAULT_TRUCK_PROFILE };
  try {
    const p = JSON.parse(raw) as Partial<TruckProfile>;
    return {
      lengthM: clampNum(p.lengthM, DEFAULT_TRUCK_PROFILE.lengthM, 2, 25),
      widthM: clampNum(p.widthM, DEFAULT_TRUCK_PROFILE.widthM, 1.5, 4),
      heightM: clampNum(p.heightM, DEFAULT_TRUCK_PROFILE.heightM, 2, 5),
    };
  } catch {
    return { ...DEFAULT_TRUCK_PROFILE };
  }
}

function clampNum(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n * 10) / 10));
}

export function useTruckProfile(): {
  profile: TruckProfile;
  loaded: boolean;
  setProfile: (next: TruckProfile) => Promise<void>;
} {
  const [profile, setProfileState] = useState<TruckProfile>(DEFAULT_TRUCK_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setProfileState(parseProfile(raw));
      setLoaded(true);
    })();
  }, []);

  const setProfile = useCallback(async (next: TruckProfile) => {
    const normalized: TruckProfile = {
      lengthM: clampNum(next.lengthM, DEFAULT_TRUCK_PROFILE.lengthM, 2, 25),
      widthM: clampNum(next.widthM, DEFAULT_TRUCK_PROFILE.widthM, 1.5, 4),
      heightM: clampNum(next.heightM, DEFAULT_TRUCK_PROFILE.heightM, 2, 5),
    };
    setProfileState(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }, []);

  return { profile, loaded, setProfile };
}
