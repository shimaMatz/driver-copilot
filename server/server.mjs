/**
 * `docs/api.yaml` の POST /api/v1/navigation/recommend-rest を満たす最小スタブ。
 * 起動: cd server && npm install && npm start （既定ポート 8080）
 */
import cors from 'cors';
import express from 'express';

const app = express();
const PORT = Number(process.env.PORT ?? 8080);

app.use(cors());
app.use(express.json());

app.post('/api/v1/navigation/recommend-rest', (req, res) => {
  const b = req.body ?? {};
  const need = ['originLat', 'originLng', 'destLat', 'destLng', 'remainingDrivingSeconds'];
  for (const k of need) {
    if (b[k] === undefined || b[k] === null || Number.isNaN(Number(b[k]))) {
      return res.status(400).json({ error: `missing or invalid: ${k}` });
    }
  }

  const remainingDrivingSeconds = Math.max(0, Math.floor(Number(b.remainingDrivingSeconds)));

  res.json({
    remainingDrivingSeconds,
    candidates: [
      {
        id: 'sa-demo-001',
        name: '海老名SA（デモ）',
        lat: 35.4437,
        lng: 139.3811,
        etaMinutes: 45,
        congestionLevel: 'medium',
        predictedAvailableLots: 12,
        confidence: 'high',
        isRecommended: true,
        reason: 'スタブ応答: 混雑は中程度で休憩タイミングに適しています',
      },
      {
        id: 'sa-demo-002',
        name: '足柄SA（デモ）',
        lat: 35.321,
        lng: 139.12,
        etaMinutes: 62,
        congestionLevel: 'high',
        predictedAvailableLots: 2,
        confidence: 'medium',
        isRecommended: false,
        reason: '混雑予測が高めです',
      },
    ],
    avoidedReasons: ['足柄SA: 混雑予測が高く駐車困難（デモ文言）'],
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`driver-copilot-api listening on http://localhost:${PORT}`);
});
