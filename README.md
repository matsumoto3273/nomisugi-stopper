# 飲みすぎストッパー

飲み会での自分の飲酒量を管理するアプリ（Expo / React Native）。

- 最初に「本日の最大飲酒量」（1〜30杯）を申告
- 1杯飲み干すごとにジョッキをタップ（枠は今飲んでいる1杯＝次にタップする空白）
- 3杯ごとにお水をはさむ。お水を飲んでコップをタップするまで次のジョッキには進めない（上限を超えた後はお水なし）
- 飲み干した杯数に応じて、メッセージと色（杯数の数字・文言の枠・終了ボタン）が 水色 → 緑 → 黄 → オレンジ → 赤 と変化
  - 上限8杯以上は上限の20%ごと（区切りは四捨五入）、上限2〜7杯は杯数ごとに固定（`src/logic.ts` の `FIXED_LEVELS`）
- 上限に達したあとも「追加する」で記録できる（赤いジョッキで枠の外に表示、背景が暗くなる）
- 終了画面は上限以内なら「約束を守れましたね」、超えたら「〇杯オーバー」
- 途中でページを閉じても記録は残る

## ファイル構成

- `App.tsx` … 画面（冒頭・飲み会中・終了）
- `src/logic.ts` … 並び順・段階・文言・色
- `src/Icons.tsx` … ジョッキとお水のイラスト
- `src/TitleLogo.tsx` … 冒頭画面のタイトルと終了画面の見出し（どちらも M PLUS Rounded 1c の極太）
- `src/WoodBackground.tsx` … 木目の背景
- `src/soundSpec.json` … 効果音の設計図（Web版はこれをその場で鳴らす）
- `src/sound.web.ts` / `src/sound.ts` … 効果音の再生（Web版／iOS版）。どちらもマナーモード中は鳴らない
- `assets/sounds/` … iOS版用の効果音（`node scripts/render-sounds.js` で設計図から作る）
- `assets/icon.png` … アプリのアイコン（黄色の背景に、ジョッキと中心に重ねた半透明の「止まれ」、1024×1024）
- `public/manifest.json` … ホーム画面から開いたときに全画面（URL欄なし）で表示する設定
- `public/index.html` … Web版のHTMLの雛形（iPhoneのホーム画面用アイコン `public/apple-touch-icon-v3.png`（作り直したらファイル名の番号を上げる：iPhoneが古い画像を使い回すため） を指定）

## 開発

```bash
npm install
npm run web        # ブラウザで確認
npx tsc --noEmit   # 型チェック
```

## Web版の公開（GitHub Pages）

iOS版を公開するまでの、自分のスマホで試すための版です。

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
