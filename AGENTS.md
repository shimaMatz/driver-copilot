# エージェント向けメモ

- **UI の見た目・トーンの正**はリポジトリ直下の [`DESIGN.md`](./DESIGN.md) とする。実装・モック・ドキュメント内の画面説明は、可能な範囲でここに整合させる。
- **URL から `DESIGN.md` を作る・更新する**ときはサブエージェント **`design-md-author`**（`.claude/agents/design-md-author.md`）を使う。チャットに公開 URL を貼るかリンクを添付し、続けて `/project:design-from-url` を実行するか、「この URL を `DESIGN.md` に反映して」と指示する。PDF・動画など複合入力は引き続き **`taste-extractor`** と `/project:extract-taste`。
- ベースは [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) のコレクション由来。別サイトの `DESIGN.md` に差し替える・複数テイストを併用する場合は、配置パスを変えたうえで本ファイル（または Cursor のプロジェクトルール）で「どの画面がどの DESIGN を参照するか」を明示する。
