# ohtani-complete-database

大谷翔平の成績をリアルタイムで可視化するWebアプリ

## 機能

- **ダッシュボード** — 最新シーズンの打撃・投球成績カード + グラフ
- **通算成績** — NPB・MLB全シーズンの打撃・投球テーブル
- **ニュース** — MLB.comからの最新記事まとめ

## 技術スタック

- Next.js 16 / TypeScript / Tailwind CSS
- MLB Stats API（公開API、キー不要）
- Recharts（グラフ）

## ローカル開発

```bash
cd app
npm install
npm run dev
# → http://localhost:3000
```

## デプロイ

Vercelで自動デプロイ。`vercel.json` 設定済み。

[![Deploy with Vercel](https://vercel.com/button/)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAlumNET-dshigami%2Fohtani-complete-database)
