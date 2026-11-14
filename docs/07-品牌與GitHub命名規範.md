# 07｜CoffeePath 品牌、GitHub 命名與網域規範

## 1. 已定案的識別

| 用途 | 應使用的名稱 | 備註 |
|---|---|---|
| 對外品牌／網站 H1／頁籤 title | **CoffeePath** | 品牌顯示採 PascalCase（雙字首大寫） |
| GitHub repository slug | **`coffee-path`** | 全小寫、單字以 `-` 分隔，符合常見 kebab-case 習慣 |
| 本機資料夾／clone 目錄 | **`coffee-path/`** | 與 repo 一致 |
| Cloudflare Pages project（建議） | **`coffee-path`** | `coffee-path.pages.dev` 若被占用可以另選專案名 |
| 正式網站子網域 | **`coffeepath.cjhang.com`** | 網址不用 `-`，與 repo slug 可以不同 |
| 正式網站 origin | `https://coffeepath.cjhang.com` | 僅供 canonical、分享等需要絕對網址的地方 |
| 本機進度儲存 key | `coffeepath.progress.v1` | 每次重大 schema 變更另設 migration |
| 網站使用語言 | 臺灣繁體中文（保留飲品英文名稱） | `lang=zh-Hant`，必要時可用 `zh-TW` |
| 網站標語（暫定） | 「從三種原料，看懂咖啡的世界。」 | 可在編輯審核後調整，非程式 ID |

## 2. 為什麼 Repository 叫 `coffee-path`，不是 `CoffeePath`？

- GitHub 官方建議儲存庫名稱簡短、好記；多個開源工程團隊的命名指南偏好**全小寫、連字號分隔**，方便閱讀、URL、CLI、跨平台和自動化。
- `coffee-path` 能直接看出 Coffee + Path，也可對應品牌 CoffeePath；不加多餘的 `-web`／`-site`／`-frontend`，因為目前只有一個靜態網站 repo，沒有多個同系列 repo 需要區分。
- `coffeepath` 沒有錯，GitHub 也允許大寫；但作為長期開源 repo，`coffee-path` 的分詞更清楚。
- 不使用 `coffee-path-v3`、`CoffeePath_Official`、`coffeepath-final` 或 `coffee-path-threejs`，避免版本、行銷形容與技術依賴綁死名稱。
- 這是**推薦的社群工程慣例**，不是 GitHub 強制規定。GitHub repo 名稱只要在該帳號或組織底下未被使用即可；不能保證全球唯一。

## 3. GitHub 儲存庫建議資料

- **Repository name**：`coffee-path`
- **Visibility**：Public（正式開源時）
- **Description（英文，建議）**：`CoffeePath is a frontend-only interactive journey into coffee, with a recipe lab and knowledge atlas.`
- **Description（中文備案）**：`CoffeePath：純前端咖啡探索旅程、配方實驗室與知識圖鑑。`
- **Website / Homepage**：`https://coffeepath.cjhang.com`（正式部署成功後再填入）
- **Topics**：`coffee`, `coffee-education`, `interactive-learning`, `vanilla-javascript`, `static-site`, `cloudflare-pages`；實際加入 Three.js 後才需增加 `threejs`
- **Default branch**：`main`
- **Branch examples**：`feat/journey-intro`, `feat/lab-controls`, `fix/storage-migration`, `docs/cloudflare-pages`
- **Commit examples**：`feat: add espresso lesson`, `fix: prevent duplicate bean point rewards`, `docs: explain static deployment`
- **Release tags**：`v0.1.0`, `v0.2.0` 等，不放在 repo 名稱中。
- **建議基礎檔案**：`README.md`、`AGENTS.md`、`.editorconfig`、`.gitignore`、授權檔（取得擁有者確認後）、`docs/`、`tests/`。

## 4. 專案內程式命名

| 對象 | 慣例 | 範例 |
|---|---|---|
| JS 檔案與資料夾 | `kebab-case` | `lesson-engine.js`, `content-loader.js` |
| JS 變數／函式 | `camelCase` | `matchDrinkStyle`, `completedLessonIds` |
| 類別／構造物件 | `PascalCase` | `CoffeeCupRenderer` |
| 常數 | `UPPER_SNAKE_CASE` | `MAX_CUP_CAPACITY_G` |
| CSS class | `kebab-case` | `.coffee-card`, `.lesson-progress` |
| JSON 欄位 | `camelCase` | `relatedDrinkIds`, `baseMethods` |
| JSON 穩定 ID | `kebab-case` | `water-01`, `flat-white` |
| GitHub repo | `kebab-case` | `coffee-path` |
| 對外品牌文案 | 固定大小寫 | `CoffeePath` |

## 5. 品牌單一設定來源

Codex 在 M1 建立 `site/js/config/site-config.js`，包含這些**概念性欄位**（正式名稱可明確一致後實作）：

```js
export const SITE_CONFIG = Object.freeze({
  brandName: 'CoffeePath',
  repositorySlug: 'coffee-path',
  productionOrigin: 'https://coffeepath.cjhang.com',
  storageKey: 'coffeepath.progress.v1',
  defaultLocale: 'zh-Hant',
  tagline: '從三種原料，看懂咖啡的世界。',
});
```

一般元件從此模組取得網站品牌，不到處寫字串。例外：`index.html` 的 `<title>`、`meta description` 和 canonical 必須在 JS 執行前仍可呈現，因此 Codex 須建立**品牌同步檢查**，確保初始 HTML、config 與 README 的識別一致。

資料載入使用相對路徑；預覽站和 localhost 不得強制轉址到正式網域。需要 SEO canonical、複製分享連結時才能視情況引用 `productionOrigin`，且分享功能可先使用目前的 origin 加 hash 路由。

## 6. 命名衝突與風險揭露

公開網路已有 `thecoffeepath.com`（CoffeePath 咖啡探索服務，亦含點數與等級概念），因此 **CoffeePath 不是目前已證實獨占、無撞名的品牌**。本文件是依擁有者要求採用 CoffeePath，**不保證商標可註冊或對外使用無風險**。公開推廣前，建議查詢經濟部智慧財產局的商標檢索與預定國際市場之註冊情形，再決定正式對外品牌；如有調整，需同步修改品牌 config／靜態 metadata／社群／網域，但保留所有穩定飲品 ID 和關卡 ID。

## 7. 參考（查核日期 2026-11-14）

- GitHub 官方建立儲存庫：https://docs.github.com/en/repositories/creating-and-managing-repositories/quickstart-for-repositories
- CRUK Repository Naming：https://crukorg.github.io/engineering-guidebook/docs/common/repository/github_repo_naming/
- GitHub 社群對 kebab-case 的建議：https://github.com/orgs/community/discussions/196726
- Cloudflare Pages Git 整合：https://developers.cloudflare.com/pages/get-started/git-integration/
- Cloudflare Pages Custom domains：https://developers.cloudflare.com/pages/configuration/custom-domains/
- CoffeePath 既有網站：https://www.thecoffeepath.com/
