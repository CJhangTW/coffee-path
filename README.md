# CoffeePath｜互動式咖啡學習網站 Codex 規格包 V0.3

版本：M1 開發中（本機靜態網站；未實際部署）　日期：2026-11-14

**命名定案**：網站品牌 `CoffeePath`；GitHub 儲存庫 `coffee-path`（全小寫 kebab-case）；Cloudflare Pages 專案建議 `coffee-path`；正式自訂子網域 `coffeepath.cjhang.com`。這些是規劃值，**尚未建立或部署**。

**產品一句話**：用咖啡豆、水與牛奶，從故事關卡學會辨別咖啡，再進入能自由控制參數的咖啡科學實驗室與可擴充的咖啡知識圖鑑。

## 如何使用本規格包

1. 先閱讀 `docs/07-品牌與GitHub命名規範.md`，確定 CoffeePath 品牌及 `coffee-path` Repository 命名。
2. 再閱讀 `docs/01-產品需求與教學流程.md`，確認產品和分期範圍。
3. 再閱讀 `docs/02-技術架構與程式規範.md`、`docs/03-資料契約與規則引擎.md`。
4. 用 `docs/04-驗收測試與部署.md` 作為完成定義。
5. 將 `AGENTS.md` 放在未來 GitHub 專案根目錄，提供 Codex 長期遵循。
6. 將 `docs/05-Codex分階段工作指令.md` 的各階段指令依序交給 Codex；**請勿第一輪就要求實作全部功能**。
7. `samples/` 提供格式範例，不代表已經校訂的完整咖啡資料庫。

## 已確定不可變更的產品限制

- 正式網站只部署靜態資產；**不允許後端、DB、Workers、Pages Functions、付費 API、遠端 AI**。
- 採原生 HTML + CSS + Vanilla ECMAScript Modules，不採 React、Vue、Vite、Webpack 或建置打包工具。
- Three.js 僅作按需載入、可降級的 3D 示意，禁止依賴圖片、影片、3D 模型外部檔案。
- 本機可用 Python 靜態檔案伺服器測試；這是開發工具，不是正式後端。
- 內容、規則、呈現、持久化須可分離測試；沒有 WebGL 也能完成整段學習。
- `coffeepath.cjhang.com` 是預定正式自訂子網域；正式託管使用 Cloudflare Pages + GitHub。
- GitHub repository 使用 `coffee-path`，不使用 `CoffeePath`、`coffeepath-v3`、`coffee-path-frontend` 或帶技術框架的名稱；命名規範見 `docs/07`。
- 新手採故事關卡；老手可直接進實驗室與知識庫，不強迫刷點數。

## 文件索引

- `docs/01-產品需求與教學流程.md` — PRD、使用者旅程、遊戲化、功能規格、內容策略。
- `docs/02-技術架構與程式規範.md` — 目錄、模組責任、單向資料流、開發與維護規範。
- `docs/03-資料契約與規則引擎.md` — 靜態 JSON 契約、進度版本、配方比對、名稱可信度。
- `docs/04-驗收測試與部署.md` — 功能測試、知識 QA、效能、無障礙、Cloudflare。
- `docs/05-Codex分階段工作指令.md` — 可直接複製交辦的階段指令與驗收規則。
- `docs/06-決策紀錄.md` — 已決策／留待實測事項、風險與替代方案。
- `docs/07-品牌與GitHub命名規範.md` — 品牌、repo slug、程式識別字、GitHub About、部署網址。
- `docs/08-品牌改名與Codex交接驗收.md` — 重命名清單、Codex 驗收、舊進度遷移、防硬編碼。
- `AGENTS.md` — Codex 持久指令（專案根目錄）。

> 注意：先前探索過的 164 個編號包含飲品、器具、技術與別名，不代表 164 種去重後、國際公認的咖啡飲品。正式內容必須審查與去重。

## GitHub 命名簡明結論

採 `coffee-path` 為 Repository slug，品牌顯示 `CoffeePath`，子網域採 `coffeepath.cjhang.com`。三者刻意採不同大小寫／連字號風格，以兼顧工程可讀性與網址輸入便利。詳 `docs/07`。

## 目前交付內容

目前 `site/` 包含 M1 前三關、基本 Lab、2D 示意與本機進度；`tests/` 為瀏覽器測試。六張核心咖啡卡均可閱讀，完成關卡可收藏 Espresso 和 Americano；教材已附參考來源，仍標記為待審核。本機實作不表示已建立 GitHub 儲存庫、Cloudflare Pages 專案或變更 DNS。

## 本機執行與測試

在專案根目錄執行：

```powershell
python -m http.server 8000
```

開啟 `http://localhost:8000/site/`；測試頁為 `http://localhost:8000/tests/`。請使用 HTTP 伺服器，不要直接以 `file://` 開啟。瀏覽器進度儲存在該來源的 localStorage；若儲存遭拒，頁面仍可使用，但關閉後進度可能遺失。

## 後續部署與內容維護

依 `docs/04` 設定 Cloudflare Pages：Framework 選 None、Build command `exit 0`、Build output directory `site`。正式品牌為 CoffeePath，GitHub slug 為 `coffee-path`，預定子網域為 `coffeepath.cjhang.com`；外部操作須先獲授權。GitHub About 可用 `CoffeePath is a frontend-only interactive journey into coffee, with a recipe lab and knowledge atlas.`，已部署後才填入網站網址。

新增課程與卡片前先確認 `docs/03` 的資料契約及穩定 ID，更新 `site/data/`、驗證與測試；資料來源不足時標記 provisional，正式公開前審核核心教材。程式與內容授權尚待確認。
