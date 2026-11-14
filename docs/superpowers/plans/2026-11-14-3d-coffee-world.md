# CoffeePath 3D Coffee World Implementation Plan

**Goal:** 在首頁提供 3D 咖啡探索桌面，在既有關卡和 Lab 提供可更新的立體杯。

**Architecture:** DOM 始終提供內容及 2D fallback；動態載入自託管 Three.js，由場景 controller 處理載入、更新、失敗降級及路由生命週期。場景不參與領域規則。

**Tech Stack:** HTML、CSS、Vanilla ES Modules、Three.js、瀏覽器原生測試。

**Spec:** `docs/superpowers/specs/2026-11-14-3d-coffee-world-design.md`

## 全域限制

固定版本及上游授權隨站託管；無外部模型、CDN、後端或 build；保留 localStorage 相容、2D 降級、語意化控制、減少動態與資源清理。

## 實作與驗收

1. 建立場景生命週期測試：載入失敗留在 2D、場景退出後遲到的載入不得掛載、路由清理僅一次；確認先失敗。
2. 建立場景 controller，以動態載入 renderer、可切換 2D、取消過期載入和釋放資源滿足測試。
3. 取得固定版本的官方 Three.js 同源模組及授權；建立程序化桌面、杯子與水量更新，不加入遠端資產。
4. 首頁及關卡／Lab 接上場景；保持內容和輸入先行、未實作內容有清楚標示；加入 3D/2D 可及操作。
5. 執行既有與新增測試，人工檢查桌面及 320 px、鍵盤、降級、進度與路由；記錄未測的實機和效能。更新 README 與分期決策。
