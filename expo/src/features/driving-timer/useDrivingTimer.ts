import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DriverStatus, DrivingTimerState } from './types';

const MAX_CONTINUOUS_DRIVING_SECONDS = 4 * 60 * 60;
const MIN_REST_SECONDS = 30 * 60;
const DISPLAY_INTERVAL_MS = 5 * 60 * 1000;

function nowMs(): number {
  return Date.now();
}

function continuousDrivingSeconds(state: DrivingTimerState, at: number): number {
  if (state.status === 'idle') return 0;
  if (state.status === 'resting') return state.previousDrivingSeconds;
  const extra =
    state.drivingStartedAt !== null ? Math.max(0, (at - state.drivingStartedAt) / 1000) : 0;
  return state.previousDrivingSeconds + extra;
}

function cumulativeRestSeconds(state: DrivingTimerState, at: number): number {
  if (state.status !== 'resting' || state.restStartedAt === null) return 0;
  return Math.max(0, (at - state.restStartedAt) / 1000);
}

/** 表示用: 5分単位に丸める（秒） */
export function roundToFiveMinutes(seconds: number): number {
  return Math.floor(seconds / 300) * 300;
}

const initialState: DrivingTimerState = {
  status: 'idle',
  drivingStartedAt: null,
  restStartedAt: null,
  previousDrivingSeconds: 0,
};

export function useDrivingTimer() {
  const [state, setState] = useState<DrivingTimerState>(initialState);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTick(x => x + 1);
    }, DISPLAY_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, []);

  const at = nowMs();
  const rawContinuous = continuousDrivingSeconds(state, at);
  const rawRest = cumulativeRestSeconds(state, at);
  const remainingBeforeViolation = Math.max(0, MAX_CONTINUOUS_DRIVING_SECONDS - rawContinuous);

  const display = useMemo(() => {
    return {
      continuousDriving: roundToFiveMinutes(rawContinuous),
      cumulativeRest: roundToFiveMinutes(rawRest),
      remainingBeforeRest: roundToFiveMinutes(remainingBeforeViolation),
    };
  }, [rawContinuous, rawRest, remainingBeforeViolation, state.status, state.drivingStartedAt, state.restStartedAt]);

  const startDriving = useCallback(() => {
    setState(prev => {
      if (prev.status === 'resting' && prev.restStartedAt !== null) {
        const rested = (nowMs() - prev.restStartedAt) / 1000;
        if (rested >= MIN_REST_SECONDS) {
          return {
            status: 'driving' as const,
            drivingStartedAt: nowMs(),
            restStartedAt: null,
            previousDrivingSeconds: 0,
          };
        }
        return {
          status: 'driving' as const,
          drivingStartedAt: nowMs(),
          restStartedAt: null,
          previousDrivingSeconds: prev.previousDrivingSeconds,
        };
      }
      if (prev.status === 'idle') {
        return {
          status: 'driving',
          drivingStartedAt: nowMs(),
          restStartedAt: null,
          previousDrivingSeconds: 0,
        };
      }
      return prev;
    });
  }, []);

  const startRest = useCallback(() => {
    setState(prev => {
      if (prev.status !== 'driving') return prev;
      const atMs = nowMs();
      const cont = continuousDrivingSeconds(prev, atMs);
      return {
        status: 'resting',
        drivingStartedAt: null,
        restStartedAt: atMs,
        previousDrivingSeconds: cont,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const fmt = useCallback((sec: number) => {
    const m = Math.floor(sec / 60);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h <= 0) return `${mm}分`;
    return `${h}時間${mm}分`;
  }, []);

  return {
    status: state.status as DriverStatus,
    displayContinuousDrivingSeconds: display.continuousDriving,
    displayCumulativeRestSeconds: display.cumulativeRest,
    displayRemainingBeforeViolationSeconds: display.remainingBeforeRest,
    rawContinuousDrivingSeconds: rawContinuous,
    formatDuration: fmt,
    startDriving,
    startRest,
    reset,
  };
}
