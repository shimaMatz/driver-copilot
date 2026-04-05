// 共有APIクライアント基盤
// バックエンドベースURLの設定と共通HTTPエラーハンドリングを提供する。

import axios from 'axios';

// ローカル開発時のバックエンドURL（Docker Composeのサービス名に合わせる）
const BASE_URL = __DEV__
  ? 'http://localhost:8080'
  : process.env.API_BASE_URL ?? 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000, // 10秒
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスインターセプター: エラーを統一型に変換
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    // ネットワークエラーかHTTPエラーを統一して再スロー
    return Promise.reject(error);
  },
);
