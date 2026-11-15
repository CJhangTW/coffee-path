# 05｜Codex Desktop 分階段工作指令

> 本文件保留最初分期指令。已依使用者決定提前試作 3D（見 `docs/06` ADR-012），主線因新增拿鐵入門目前規劃 19 關；以 `docs/01` 的最新順序為準。

> 對 Codex 的總規則：先讀根目錄 `AGENTS.md` 與 `docs/`，完成當期範圍後提交可運行成果、測試紀錄及文件，不要自作主張實作後續所有階段。不更換技術棧、不加入依賴、不導入後端。

## 首次交辦給 Codex：直接複製以下訊息

```text
你是 **CoffeePath** 專案的資深前端工程師、互動教學設計師與軟體架構師。
產品公開名稱為 CoffeePath；GitHub Repository 為 coffee-path；Cloudflare Pages Project 建議 coffee-path；正式子網域為 coffeepath.cjhang.com。
所有 UI 標題、README、metadata、route 分享文字與本機進度儲存 key 需符合 docs/07 與 docs/08。

請先完整閱讀 AGENTS.md、README.md 及 docs/01 至 docs/08，理解產品條件及資料契約。
產品採原生 HTML/CSS/Vanilla ES Modules、純靜態網站、Cloudflare Pages。
不允許 React/Vue/TypeScript 編譯/Vite/Webpack、後端、資料庫、Serverless、
遠端 API、外部圖片/影片/3D 模型，也不可因圖形需求讓低階手機無法使用。
Three.js 只能按需載入且必須存在完整 2D fallback。

現在先實作 M1，不要先做完整 3D，也不要一次實作 18 關：
(1) 建立 docs/02 指定的可維護目錄架構與靜態網站入口；品牌與字串集中在 site/js/config/site-config.js。
(2) 實作 hash router、單向 store、storage adapter、content loader。
(3) 完成首頁兩個入口、Journey 前三關、2D 咖啡杯與操作回饋。
(4) 實作首次完成 +10 BP、章節 +20 BP、不重複刷分、收藏卡片。
(5) Lab 頁先完成可操作的 Espresso + 加水基本示範與文字說明。
(6) 建立資料驗證與 browser-native 測試，通過 M1 驗收案例。
(7) 撰寫 README：本機以 Python HTTP server 啟動、測試方式、Cloudflare Pages 設定、GitHub About 設定與品牌名稱規範。

請先檢查現有檔案並提出最小施工清單，再開始修改。
完成時請列出：變更檔案、測試結果、已知限制、下一階段待辦。
禁止因為預想的未來需求而過度抽象化或建造萬用事件／外掛系統。
```

## 階段 M1 — 可玩最小循環（可立即交付）

- 前三關（序章、認識 Espresso、萃取後加水）。
- 首頁雙入口；Lab 基礎版；2D 杯型；豆點、收藏、持久化、重玩去重。
- 不做完整 18 關，不做 Three.js 3D，不做百項圖鑑。
- 驗收：`docs/04` M1 七項，通過後再進 M2。

## 階段 M2 — 完成完整新手旅程

**可給 Codex 的任務**：延續 M1，不更改技術基礎；依 `docs/01` 與 `docs/03` 補齊全部 18 個微關卡，做章節圖、正確回饋、結業回顧、進階說明解鎖、已收集飲品卡；補關卡 JSON 驗證與 BP 防重複測試。勿加入新後端或 3D。

- 驗收：18 關都能完成、跳關／重玩不灌分；答錯可重試；熟手可直接進 Lab；核心科學差異正確。

## 階段 M3 — 實驗室與配方分類引擎

**可給 Codex 的任務**：在現有 architecture 下完成自由 Lab 的參數（基底、水、奶、奶泡、溫度、混合次序）；讓規則引擎是可測試純函式；結果顯示相近風格＋理由＋不確定性，不能硬宣稱唯一名稱。實作對照與配方分享 hash。加入 `docs/04` R01–R10 測試。

- 先使用 2D 示意；3D 原型作為 M3 結束後的獨立 PR，只在驗證教學效益後保留。

## 階段 M3.5 — 受控 3D 原型（可以跳過）

**可給 Codex 的任務**：使用固定版本、自行託管的 Three.js ESM，做單一杯型加奶液面的簡單程序化幾何；使用 dynamic import，首頁不載入 Three.js；GPU／低階手機／減少動畫偏好時自動降為 2D；移除 3D 不得破壞教程或測試。附效能比較紀錄與授權檔。

- 若 3D 比 2D 變慢很多或造成誤解，預設不在正式版啟用。

## 階段 M4 — 圖鑑、知識關聯與公開部署

**可給 Codex 的任務**：完成中英文搜尋、分類篩選、相關卡片、別名／器具／技法區分；內容先以經查證 40–60 筆為上限目標，來源不足可少於目標，不能杜撰；完成 Cloudflare Pages + 自訂子網域文檔，保留 GitHub PR 預覽。完成手機、無障礙與部署驗收。

- 不要求 Codex 自動註冊網域、購買資源、存入秘密或直接推送正式分支；外部發佈動作須由使用者授權並確認。

## 變更與回歸測試要求

每一階段提交時，Codex 必須說明：
1. 本次改了什麼（對應 PRD 條款與檔案）。
2. 這次沒有做什麼（是否維持非目標）。
3. 哪些測試通過、哪些未跑、原因為何。
4. 手機／2D fallback 是否仍完整可用。
5. 需要人工審查的咖啡知識或來源。
6. 是否出現新依賴、部署設定或使用成本（原則上不允許）。

## 開發完成的驗證指令（靜態示例）

在專案根目錄執行：

```bash
python -m http.server 8000
```

再開啟 `http://localhost:8000/site/` 查看網站，並用 `http://localhost:8000/tests/` 執行瀏覽器原生測試；正式使用 Cloudflare Pages 時仍只發布 `site/`。若另選從 `site/` 目錄啟動伺服器，網址改為 `http://localhost:8000/`。
