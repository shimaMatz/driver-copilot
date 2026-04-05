import { useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';

const TTS_OPTIONS: Speech.SpeechOptions = {
  language: 'ja-JP',
  rate: 1.05,
  pitch: 1.0,
};

export function useTts() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      void Speech.stop();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (!isMountedRef.current) return;
    void Speech.stop();
    Speech.speak(text, TTS_OPTIONS);
  }, []);

  const stop = useCallback(() => {
    void Speech.stop();
  }, []);

  return { speak, stop };
}
