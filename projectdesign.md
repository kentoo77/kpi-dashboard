# KPI Dashboard - 残作業メモ

## 完了済み（リポジトリ側）
- [x] `DASHBOARD.html` の fetch URL を `./data/xxx.json` に変更（7箇所）
- [x] `vercel.json` に Cache-Control ヘッダ追加
- [x] `data/` ディレクトリ作成
- [x] `gas/github-sync.gs` 作成（GAS貼り付け用の共通push関数）
- [x] GitHub push 済み、Vercel デプロイ済み

---

## 残作業（手動で実施）

### Step 1: GitHub Fine-grained PAT を発行
1. https://github.com/settings/tokens?type=beta を開く
2. 「Generate new token」をクリック
3. 設定内容:
   - **Token name**: `gas-kpi-dashboard`
   - **Expiration**: 任意（90日推奨）
   - **Repository access**: 「Only select repositories」→ `Masa-English/kpi-dashboard` を選択
   - **Permissions** → Repository permissions → **Contents**: Read and Write
4. 「Generate token」→ **トークンをコピーして控えておく**（再表示不可）

### Step 2: GAS Script Properties に GITHUB_TOKEN を保存
1. GAS エディタを開く（対象のスプレッドシート → 拡張機能 → Apps Script）
2. 左サイドバー「⚙ プロジェクトの設定」をクリック
3. 「スクリプトプロパティ」セクションで「スクリプトプロパティを追加」
   - **プロパティ**: `GITHUB_TOKEN`
   - **値**: Step 1 でコピーした PAT
4. 「スクリプトのプロパティを保存」

### Step 3: github-sync.gs をGASエディタに追加
1. GAS エディタで「＋」→「スクリプト」→ ファイル名を `github-sync` にする
2. リポジトリの `gas/github-sync.gs` の内容をすべてコピーして貼り付け
3. 保存（Ctrl+S）

### Step 4: 動作テスト
1. GAS エディタ上部のプルダウンで `testPushJsonToGitHub` を選択
2. 「実行」をクリック
3. 初回は Google アカウントの認可を求められるので許可
4. 実行ログで「GitHub push 成功: data/_test.json」と表示されることを確認
5. GitHub リポジトリ（https://github.com/Masa-English/kpi-dashboard）の `data/` フォルダに `_test.json` が作成されていることを確認

### Step 5: 各GASファイルに pushJsonToGitHub() を追加
各 export 関数の **末尾**（Drive への JSON 保存の直後）に1行追加する。
`jsonStr` は各関数内で JSON.stringify した変数名に合わせること。

| GASファイル | 関数名 | 追加するコード |
|------------|--------|---------------|
| kpi.gs | `exportKpiToJson()` | `pushJsonToGitHub("kpi.json", jsonStr);` |
| sales.gs | `exportSalesToJson()` | `pushJsonToGitHub("sales.json", jsonStr);` |
| appointments.gs | `exportAppointmentsToJson()` | `pushJsonToGitHub("appointments.json", jsonStr);` |
| threads.gs | `exportThreadsToJson()` | `pushJsonToGitHub("threads.json", jsonStr);` |
| ig-insight.gs | `IGI_saveInsight()` | `pushJsonToGitHub("insight.json", jsonStr);` |
| analysis-form.gs | `doPost()` | `pushJsonToGitHub("analysis.json", jsonStr);` |

> **注意**: `jsonStr` は各関数で実際に使われているJSON文字列の変数名に置き換えてください。
> 関数内で `var json = JSON.stringify(...)` のようになっている場合は `pushJsonToGitHub("xxx.json", json);` にする。

### Step 6: kpi.json で動作確認（最重要）
1. GAS エディタで `exportKpiToJson` を手動実行
2. GitHub の `data/kpi.json` にコミットされることを確認
3. 1〜2分待つと Vercel が自動デプロイ
4. https://kpi-dashboard-mu-coral.vercel.app を開いてダッシュボードにデータが表示されることを確認

### Step 7: 残り5ファイルも同様にテスト
- `exportSalesToJson()` → `data/sales.json` がpushされるか確認
- `exportAppointmentsToJson()` → `data/appointments.json`
- `exportThreadsToJson()` → `data/threads.json`
- `IGI_saveInsight()` → `data/insight.json`
- `doPost()` → `data/analysis.json`

### Step 8: クリーンアップ
- テスト用の `data/_test.json` を GitHub 上で削除（任意）

---

## アーキテクチャ概要

```
GAS (export関数)
  ↓ JSON.stringify
  ↓ pushJsonToGitHub()
GitHub API (PUT /repos/.../contents/data/xxx.json)
  ↓ commit → main branch
Vercel (auto deploy on push)
  ↓ static hosting
DASHBOARD.html → fetch("./data/xxx.json")
```

## トリガー一覧
| JSON | 生成元GAS関数 | トリガー |
|------|--------------|---------|
| kpi.json | `exportKpiToJson` | 手動 |
| sales.json | `exportSalesToJson` | 5分毎 |
| appointments.json | `exportAppointmentsToJson` | 5分毎 |
| threads.json | `exportThreadsToJson` | 日次12時 |
| insight.json | `IGI_saveInsight` | Web App |
| analysis.json | `doPost` | Web App |

## URL
- **Vercel**: https://kpi-dashboard-mu-coral.vercel.app
- **GitHub**: https://github.com/Masa-English/kpi-dashboard
