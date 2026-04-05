import { useCallback, useEffect, useRef, useState } from 'react';

export type VoiceCommandType =
  | 'depart'          // 「出発」
  | 'stop'            // 「停止」「ナビ終了」
  | 'rest'            // 「休憩」
  | 'drive'           // 「運転」「走行」
  | 'reset'           // 「リセット」
  | 'show_map'        // 「地図を表示」→ パネル折り畳み
  | 'remaining_time'  // 「残り時間は？」→ パネル展開 + 時間読み上げ
  | 'destination';    // その他の発話 → 目的地クエリとして扱う

export interface VoiceCommand {
  type: VoiceCommandType;
  raw: string;
}

function parseCommand(text: string): VoiceCommand {
  const t = text.replace(/\s/g, '');
  if (/出発|しゅっぱつ|スタート/.test(t))              return { type: 'depart',         raw: text };
  if (/停止|ていし|終了|止めて|とめて/.test(t))         return { type: 'stop',           raw: text };
  if (/休憩|きゅうけい|休む|やすむ/.test(t))            return { type: 'rest',           raw: text };
  if (/運転|うんてん|走行|そうこう|再開/.test(t))        return { type: 'drive',          raw: text };
  if (/リセット|初期化/.test(t))                        return { type: 'reset',          raw: text };
  if (/地図.*表示|地図.*見|マップ.*表示|地図で/.test(t)) return { type: 'show_map',       raw: text };
  if (/残り.*時間|あと.*何分|残り.*何分|残り.*どのくらい|タイマー/.test(t))
                                                         return { type: 'remaining_time', raw: text };
  return { type: 'destination', raw: text };
}

// @react-native-voice/voice はネイティブモジュールが必要。
// Expo Go 環境では存在しないためフォールバックを用意する。
let Voice: typeof import('@react-native-voice/voice').default | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Voice = require('@react-native-voice/voice').default;
} catch {
  // Expo Go など、ネイティブモジュール未ビルド環境ではスキップ
}

interface UseVoiceCommandOptions {
  onCommand: (cmd: VoiceCommand) => void;
}

export function useVoiceCommand({ onCommand }: UseVoiceCommandOptions) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const unavailable = Voice === null;

  useEffect(() => {
    if (!Voice) return;
    Voice.onSpeechStart   = () => setIsListening(true);
    Voice.onSpeechEnd     = () => setIsListening(false);
    Voice.onSpeechError   = (e) => {
      setIsListening(false);
      setError(e.error?.message ?? '音声認識エラー');
    };
    Voice.onSpeechResults = (e) => {
      const text = e.value?.[0];
      if (text) onCommandRef.current(parseCommand(text));
    };
    return () => {
      void Voice!.destroy().then(() => Voice!.removeAllListeners());
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!Voice) {
      setError('音声認識は開発ビルドで利用可能です');
      return;
    }
    setError(null);
    try {
      await Voice.start('ja-JP');
    } catch {
      setError('マイクを起動できませんでした');
    }
  }, []);

  const stopListening = useCallback(async () => {
    if (!Voice) return;
    try {
      await Voice.stop();
    } catch {
      // ignore
    }
  }, []);

  return { isListening, error, startListening, stopListening, unavailable };
}
