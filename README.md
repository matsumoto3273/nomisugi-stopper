# 飲みすぎストッパー

飲み会での自分の飲酒量を管理するアプリ（Expo / React Native）。

- 最初に「本日の最大飲酒量」（1〜30杯）を申告
- 1杯注文するごとにジョッキをタップ
- 3杯ごとにお水タイム。お水のコップをタップするまで次のジョッキは埋められません
- 飲んだ量に応じて、画面の色（水色 → 薄緑 → 黄 → オレンジ → 赤）とメッセージが変化
- 途中でページを閉じても記録は残ります

## 開発

```bash
npm install
npm run web        # ブラウザで確認
npx tsc --noEmit   # 型チェック
```

## Web版の公開（GitHub Pages）

`main` に push すると `.github/workflows/deploy-web.yml` が自動でビルド・公開します。

初回のみ: GitHub のリポジトリ設定 → **Settings → Pages → Source** を **GitHub Actions** にしてください。

公開URL: https://matsumoto3273.github.io/nomisugi-stopper/

スマホのSafariで開き、共有ボタン →「ホーム画面に追加」でアプリのように使えます。

## iOS版（App Store）

```bash
npx eas-cli@latest build -p ios
npx eas-cli@latest submit -p ios
```

※ Apple Developer Program への登録が必要です。`app.json` の `ios.bundleIdentifier` も設定してください。
