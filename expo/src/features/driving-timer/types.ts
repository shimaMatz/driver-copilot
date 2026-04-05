export type DriverStatus = 'idle' | 'driving' | 'resting';

export interface DrivingTimerState {
  status: DriverStatus;
  /** 現在の運転ブロック開始時刻（ms） */
  drivingStartedAt: number | null;
  /** 休憩開始時刻（ms） */
  restStartedAt: number | null;
  /** 現在の運転セッションに入る前までに積み上がった連続運転秒 */
  previousDrivingSeconds: number;
}
