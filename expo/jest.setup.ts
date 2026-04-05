// AsyncStorage のデフォルトモック（個別テストで jest.mock() を使う場合は上書き可能）
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
