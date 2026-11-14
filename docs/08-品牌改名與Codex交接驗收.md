# 08｜CoffeePath 品牌改名、交付與驗收清單

## 1. 改名範圍

本版從前一版 CoffeeLearn 規格更新為 CoffeePath。**不是直接執行 GitHub rename 或網站搬遷；目前只是規格定案**。Codex 開始撰寫程式時，須使用下列新名稱：

| 類別 | 規格 |
|---|---|
| 品牌 | `CoffeePath` |
| GitHub Repo | `coffee-path` |
| 本機專案資料夾 | `coffee-path` |
| Cloudflare Pages Project | `coffee-path`（若被佔用，Pages 專案可改其他可用名稱） |
| 自訂網域 | `coffeepath.cjhang.com` |
| 進度 Storage | `coffeepath.progress.v1` |
| GitHub 預設分支 | `main` |
| 靜態站發佈目錄 | `site/` |
| 技術 | HTML／CSS／Vanilla JS ESM／選擇性 Three.js，無建置與無後端 |

## 2. 檔案與畫面驗收清單

- [ ] `README.md` 與 `AGENTS.md` 均以 CoffeePath 作為品牌。
- [ ] `site/index.html` 的 `<title>`、meta description、基本字樣正確。
- [ ] `site/js/config/site-config.js` 產生並統一管理品牌／網域／storage key。
- [ ] 首頁、Journey、Lab、Atlas、404、錯誤訊息、分享訊息全部顯示 CoffeePath。
- [ ] GitHub 儲存庫名稱／clone 教學／部署文件寫 `coffee-path`。
- [ ] Cloudflare Docs 寫 `coffeepath.cjhang.com`，不誤把 repo slug 當子網域。
- [ ] 所有資源相對路徑可在 localhost、預覽站及正式網域運作。
- [ ] 讀取進度與保存進度使用 `coffeepath.progress.v1`，資料欄位維持契約。
- [ ] 若曾有舊測試資料，儲存層可一次性讀取舊 key 並轉換，不改寫已收集的飲品 ID。
- [ ] 測試及 docs 搜尋沒有意外殘留舊品牌；若遷移文件提到舊品牌，需明確標記為歷史兼容用途。
- [ ] 未經擁有者授權，不自動建立 repo、不 push、不部署、不變更 DNS。

## 3. 為什麼不應把 GitHub、網站網址硬綁在 UI？

GitHub 的 `coffee-path` 與網域的 `coffeepath` 為不同場景的刻意命名。應保持：
- JavaScript 中的 API 以相對路徑或 `new URL(..., import.meta.url)` 載入同源檔案；不因換 host 失效。
- 非必要不將 `coffeepath.cjhang.com` 寫進所有連結；正式 origin 僅作 canonical／分享等必要場景。
- `location.hash` 深連結為 `#/journey/...` 與 `#/lab`，不用 Pages Functions 或伺服器 rewrite。
- GitHub repo 可調整，不影響網站品牌與既有使用者進度。

## 4. 本機進度相容性

新程式只寫 `coffeepath.progress.v1`。若**同一 origin** 的早期測試版曾使用 `coffeelearn.progress.v1`，首次啟動可在新 key 不存在時讀取舊 key、驗證 schema 並一次性遷移；有新資料時不得覆蓋。**跨子網域不能直接遷移 localStorage**：例如舊 `cafelearn.cjhang.com` 與新 `coffeepath.cjhang.com` 互相不能讀取進度。若舊站真的存在，需在舊站匯出 JSON、於新站匯入（作為後續功能），或清楚告知使用者無法直接帶入。本規格不表示前版網站已部署。

## 5. 驗收實例

| 編號 | 測試 | 通過條件 |
|---|---|---|
| N01 | 品牌初始 HTML | `<title>` 出現 `CoffeePath`，未載 JS 時仍辨識品牌 |
| N02 | Repository／網站命名 | repo `coffee-path`，網站 `coffeepath.cjhang.com` |
| N03 | Brand config | JS UI 顯示與 site config 一致，修改設定時可控制主要文案 |
| N04 | 預覽站 | 專案可在非正式 hostname 正常載入 JSON、CSS、JS 和 hash route |
| N05 | 進度儲存 | 完成新關卡後寫新 key，重玩不累積重複點數 |
| N06 | 歷史資料相容 | 同一 origin 且新 key 不存在時可單次遷移舊 key；跨子網域必須說明需匯出／匯入，不能假裝自動遷移 |
| N07 | 移除品牌字串硬編碼 | 用文字搜尋驗證 domain／features 不散落多個 hard-coded 品牌名 |
| N08 | 未授權操作保護 | 不執行 GitHub push、Cloudflare 修改、DNS 變更 |

## 6. 給 Codex 的快速核對提示

> 在 M1 實作結束前，請依 docs/08 執行品牌／命名測試。專案品牌為 CoffeePath；Repo 使用 `coffee-path`；正式子網域為 `coffeepath.cjhang.com`。不要把 GitHub 名稱等同網域。輸出檔案清單、測試結果與未實際部署的註記。
