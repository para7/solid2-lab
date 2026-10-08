# room.nanaket.dev 移行の検証チェックリスト

room.nanaket.dev（SvelteKit 2 / Svelte 5 / Cloudflare Workers）を Solid 2 に移せるかを検証する。
本番が使っている機能を洗い出し、このリポジトリで確認できたものから埋めていく。

## 検証済み

Nitro（Node）上での確認。Cloudflare 上ではまだ確認していない。

- [x] ストリーミング SSR
- [x] `'use server'` + `query()` によるデータ取得、single-flight mutation
- [x] 署名付き Cookie のセッション（`src/server/session.ts`）
- [x] 型付き env（`env.ts`）
- [x] middleware、API ルート（`src/routes/api`）
- [x] 静的ルートのプリレンダ（`/about`、Nitro の `prerender.routes`）
- [x] `createOptimisticStore` + `action` による楽観的更新（`src/routes/action`）

## 優先度：高（移行の可否を左右する）

### 1. Cloudflare Workers での実行

- [ ] `@cloudflare/vite-plugin` と solid を組み合わせ、dev が workerd で動く
- [ ] server function / middleware から D1・R2・`send_email` のバインディングを取れる（`cloudflare:workers` の `env` か `nativeEvent` 経由か）
- [ ] `ctx.waitUntil` が使える（本番ではログイン通知メールの送信に使っている）
- [ ] Nitro を外したとき、プリレンダを Cloudflare プラグインと同居させられる

### 2. DB の内容から決まるプリレンダ

本番では `/blog/[slug]`、タグ別一覧、月別アーカイブを、ビルド時の DB の内容から列挙してプリレンダしている（SvelteKit の `entries()`）。

- [ ] ビルド時に sqlite（better-sqlite3）を読み、プリレンダするルートの一覧を作れる
- [ ] クロールを無効にし、列挙したルートだけを焼ける
- [ ] 列挙が 0 件のルートがあってもビルドを通せる
- [ ] better-sqlite3 など Node 専用のモジュールが Worker のバンドルに入らない
- [ ] プリレンダしたページを、Worker を通さずアセット層から配信できる

### 3. JS を出さない公開ページ

本番の公開ページは、`/timeline` を除いて JS を出していない（SvelteKit の `csr = false`）。

- [ ] ルート単位でハイドレーションを止められる、または islands 的な構成を取れる
- [ ] できない場合、JS の配信量・性能・CSP の前提がどう変わるかを見積もる

### 4. CSP

本番は SvelteKit の `csp.mode: "auto"` で、SSR には nonce、プリレンダには hash の meta を出している。

- [ ] SSR が出すインラインスクリプト（シリアライズされたデータ）に nonce を付けられる
- [ ] プリレンダしたページで、hash を使った CSP を出せる
- [ ] `script-src 'self'` だけの設定を保てる

## 優先度：中（書き方は変わるが、移行はできそうなもの）

### 5. JS 無しで動くフォーム

ログイン（`/gate/[token]`）と BBS の書き込みは、JS 無しでも動く必要がある。

- [ ] form の POST から 303 リダイレクトで戻せる
- [ ] バリデーションエラーのとき、メッセージと入力値を返して同じページを再表示できる（SvelteKit の `fail(400, { error, username })`）
- [ ] action の中で `Set-Cookie` を付けられる
- [ ] action の中で 404 を返せる

### 6. エラーと HTTP ステータス

- [ ] `error(404)` と `+error.svelte` に相当するもの（ErrorBoundary + ステータス指定）
- [ ] `/admin` を未認証のとき 404 で返す（管理画面の存在を隠すため）。ストリーミング SSR でステータスを後から変えられない問題と、レイアウト単位の認可をどう両立させるか

### 7. `hooks.server.ts` 相当の処理

- [ ] middleware で `locals` 相当（DB・ストレージ・認証状態）をリクエストに注入できる
- [ ] Hono アプリを `/api` にマウントできる。クライアントの `hc<AppType>` の型がそのまま使える
- [ ] レスポンスを後処理できる：セキュリティヘッダ、`X-Robots-Tag`、`Cache-Control` の強制上書き

### 8. ルーティング

- [ ] ルートグループ（`(public)`）とネストしたレイアウト
- [ ] パラメータの検証（`[year=year]`、`[month=month]`、`[page=page]`）を `matchFilters` などで置き換えられる
- [ ] rest パラメータ（`/r2/[...path]`）と、バイナリを返すレスポンス
- [ ] `$app/paths` の `resolve()` のような型付きリンクを、`file-routes.d.ts` の型で置き換えられる

### 9. クライアント側のナビゲーション

- [ ] 検索パラメータで絞り込む画面で、フォーカスとスクロール位置を保ったまま URL を変えられる（`goto(..., { keepFocus, noScroll })` 相当）
- [ ] 履歴を積まずに URL を書き換えられる（`replaceState` 相当）
- [ ] API を呼んだ後に、ページのデータを取り直せる（`invalidateAll` 相当。`refresh` や revalidate）

### 10. head の管理

- [ ] `@solidjs/meta` で title、description、OGP、canonical を SSR とプリレンダの両方に出せる

## 優先度：中〜低（作業量は多いが、技術的な不確実性は小さいもの）

### 11. スタイル

本番の Svelte ファイルは 61 個のうち 46 個が scoped style を持ち、`:global` が 10 箇所ある。

- [ ] CSS Modules に寄せたとき、VRT で差分が出ない

### 12. Svelte 固有の構文の書き換え

本番での使用数：`untrack` 19、`bind:value` 12、`{#snippet}` 7、`{@html}` 3、`{@attach}` 2、`bind:open`（dialog）2、`$bindable` 1。ほかに `toast.svelte.ts` のグローバル state。

- [ ] 双方向バインディングと dialog の開閉
- [ ] markdown を HTML として差し込む（`{@html}` 相当）
- [ ] 山場になりそうなコンポーネント：MarkdownEditor、ImagePickerModal、TimelineToolbar

### 13. ツールチェーン

- [ ] `svelte-check` を tsc に置き換える
- [ ] eslint（`eslint-plugin-import-access` を含む）を oxlint に置き換えるかどうか
- [ ] ドメイン層・DB のテストと、E2E・VRT をそのまま流用できる（E2E のシナリオを移行の受け入れ条件にする）

### 14. デプロイ

- [ ] Workers Builds での `build:remote` と、Deploy Hook による再ビルド
- [ ] ビルド時刻（`__BUILT_AT__`）の define
- [ ] `_headers` がプリレンダしたアセットに効く
- [ ] `wrangler.jsonc` の `main` と `assets.directory` の向け先

## 進め方

機能を一つずつ試すより、本番のルート 2 本を Cloudflare プラグイン上に移植する縦切りで、1〜6 の大半をまとめて確認する。

- `/blog/[slug]`：DB から決まるプリレンダ、head、JS ゼロ、CSP、D1
- `/gate/[token]`：JS 無しの form action、Cookie、`waitUntil`、404、レスポンスヘッダ

3（JS ゼロの公開ページ）と 4（CSP）は、結果によっては移行しないという結論もありうるので先に確認する。
