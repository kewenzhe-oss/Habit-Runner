# 2026-10-21 實際瀏覽器性能驗證

固定構建的導航及戒除交互驗收通過：30 次熱導航、10 次正常保存、1 次延遲防重、1 次失敗回滾；12 次 reload 一致。最終 run 沒有拋出錯誤。冷載診斷有一個不完整樣本，單獨列為限制，不用於性能結論。

## 構建與範圍

- Build ID：`3J1xQq7sEZ1dc_5Xe6q8z`。起止 BUILD_ID 與 dashboard/insights/settings 生產頁面 bundle SHA-256 完全一致，`fixedBuild=true`。完整雜湊見原始 JSON。
- 開始：`2026-10-21T10:57:40.014Z`；結束：`2026-10-21T10:58:57.754Z`（UTC；紐約 06:57:40–06:58:57）。
- Headless `Chrome/155.0.8059.85`，獨立 CDP 9242；375×812 CSS px、DPR 2、mobile emulation。以 demo JWT 存取既有正式 Next `http://localhost:3000`。
- normal：無網路／CPU 節流；throttled：CDP latency 150ms、下載 200,000 B/s、上傳 93,750 B/s、CPU 4× slowdown。不是實體手機或真實電信網路。
- 啟動前留出 UI 矩陣預估時間；UI 全部結束的明確確認在 normal 採樣期間才收到，因此正常組可能仍有少量平行只讀負載，節流階段已獨占。這是本機觀察，不能據此宣稱優化百分比。
- 只測試；未修改產品、啟停 Next/PostgreSQL、build 或 push。此腳本只管理其專屬 Chrome。UI 排版驗收由另一代理負責。
- 下表只取本次 post-READY JSON，不混入舊 smoke、失敗輪或可能與 build 重疊的節流輪，也不混入主代理的 read-only HTTP 預熱樣本。

## 熱導航：點擊到反饋與頁面狀態更新

每個 profile 先瀏覽三頁暖身，再執行 5 個 dashboard→insights→settings→dashboard 循環。每格為 **median / max（ms）**，每條路徑 n=5；不把不同路徑合併計算分位數，沒有任何同質組達 20 樣本，因此不報 P95。

| 條件            | 導航                   |   n | 點擊→UI 反饋 | 點擊→頁面狀態更新 |
| --------------- | ---------------------- | --: | -----------: | ----------------: |
| normal          | /dashboard → /insights |   5 |   6.3 / 15.8 |     323.3 / 342.5 |
| normal          | /insights → /settings  |   5 |     9.4 / 15 |      28.1 / 325.1 |
| normal          | /settings → /dashboard |   5 |   9.1 / 10.1 |     325.4 / 326.4 |
| latency150_cpu4 | /dashboard → /insights |   5 |   5.8 / 10.7 |     513.8 / 520.3 |
| latency150_cpu4 | /insights → /settings  |   5 |  11.4 / 12.2 |     194.2 / 205.8 |
| latency150_cpu4 | /settings → /dashboard |   5 |   5.9 / 12.8 |     510.3 / 519.8 |

UI 反饋是 pending spinner 或目前導航標記更新後的下一個 requestAnimationFrame。頁面狀態更新是目的 pathname、底部目前導航標記與目的 h1 文字均已更新後的下一幀；不是完整圖表就緒、像素呈現時間或 INP。所有點擊均為 CDP Input 事件，頁面捕獲到的 `isTrusted=true`。

約 323ms 的導航耗時**不包含腳本固定等待**：起點是瀏覽器收到 click；hydration 檢查、scrollIntoView、點擊前 150ms 定位等待都在起點之前，完成後 180ms 等待也不入數。30ms 輪詢只讀取已由頁面 observer/rAF 記下的時間，不加到測量結果。數字仍包含路由資料傳輸、Next/React 更新、可能的 Suspense 排程與下一幀等待；沒有 trace 可把約 300ms 平台歸因於特定內部等待策略。

30 次量測各記錄到 1 個目的路徑的 Fetch、全部 200，沒有 Document 導航；不是以 HTTP 預熱耗時冒充瀏覽器導航。normal 每次 Fetch headers 約 6.39–13.84ms，throttled 約 153.73–164.12ms；這也說明反饋很快不代表頁面資料已完成。raw 中 rsc/prefetch 布林使用大小寫敏感的 header 名稱，不能拿 false 判定該 header 缺席。

## 戒除：UI、API、Server-Timing 與 reload

臨時專屬 QUIT_HABIT 首次 KEPT 保存，再做 LAPSED→KEPT→LAPSED→KEPT；每組正常保存 n=5。每次成功均檢查唯一當日日誌的資料庫狀態、當前 aria-pressed，並以 ignoreCache reload 驗證。延遲／故障樣本另列，不入正常保存統計。

| 條件            |   n | 點擊→樂觀 UI median / max | quit-status response median / max | reload 一致 |
| --------------- | --: | ------------------------: | --------------------------------: | ----------: |
| normal          |   5 |               14.5 / 16.9 |                     15.91 / 22.46 |         5/5 |
| latency150_cpu4 |   5 |               19.4 / 20.4 |                   166.32 / 168.21 |         5/5 |

`responseMs` 是 CDP requestWillBeSent → responseReceived 的時間差；成功全部 HTTP 200、`Cache-Control: private, no-store`，包含測試攔截 passthrough 的少量開銷。UI 回應與持久化確認為兩個不同階段。

`bodyCompleteMs` 原值保留在 JSON，但僅為診斷，不列成可直接比較的 waterfall。responseReceived 與 loadingFinished 是不同的 CDP 採集終點，本次攔截／通知時間不保證單調：normal 的 response median 15.91ms 與 bodyComplete median 11.2ms **不能用來推論實際「headers 晚於 body」**，也不做相減。`clickToResponseMs` 另有 wallTime→performance.timeOrigin 的跨時鐘映射，屬近似值，不作核心結論。

成功 API 的 Server-Timing 每個原字串均保留在 JSON。分段如下，單位 ms：

| 條件            |   n | auth median / max | save_and_streaks median / max |
| --------------- | --: | ----------------: | ----------------------------: |
| normal          |   5 |         0.8 / 1.4 |                     3.7 / 6.8 |
| latency150_cpu4 |   5 |         0.6 / 0.7 |                     3.2 / 3.9 |

`save_and_streaks` 包含保存與 streak 計算，不是純 SQL 寫入耗時。請求已帶 date，因此無 user_date 分段屬預期。

| 額外驗證（normal）     | 結果                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 請求先攔截延遲 1,200ms | 樂觀反饋 11ms、response 1209.39ms；pending 兩鍵皆 disabled，3 次真實指標嘗試加上 disabled DOM click 嘗試後仍只有 1 個 POST；實際保存 LAPSED，reload 一致。      |
| 延遲 600ms 後注入 503  | 樂觀反饋 14.4ms、response 602ms；只有 1 個 POST，恢復先前 LAPSED，資料庫未被失敗請求改寫，reload 一致。503 是測試注入，未到產品 API，因此不應有 Server-Timing。 |
| 重複點擊目前已選項     | 10 次正常保存加 1 次延遲成功後均再次點選目前選項；每次新增 POST 為 0。                                                                                          |

## 冷載診斷（不併入導航）

每條件僅 1 次 cache-disabled dashboard 文件導航；伺服器／OS／連線狀態未重置，不能稱完整冷啟動。normal 的 NavigationTiming：responseStart 85.6ms、responseEnd 161.6ms、DOMContentLoaded 225.3ms、load 269.1ms，只作單次診斷。

節流文件樣本的 `loadMs=0` 代表採集時 load 尚未完成，**不是 0ms 載入**。原採集還未明確等待新文件 timeOrigin 改變，所以整個節流冷載時間樣本排除結論，保留原值與品質註記，不補報冷載改善或 median。這不改變後續完成暖身後 30 次 SPA／12 次戒除檢查的結果。腳本報告階段補上未來冷載的新文件與 load 完成等待；依指示不再加跑。

## 資料安全與 finally 清理

- 任何 Prisma 操作之前，DATABASE_URL 必須為 localhost 或 127.0.0.1，且 pathname 精確等於 `/habit_runner_perf`；明確使用 `--env-file=.env.local`，不回退到指向其他庫的 `.env`。
- JWT 只放在獨立 Chrome 記憶體／專屬暫存 profile；輸出不包含 JWT、cookie、secret、完整連線字串或完整日誌快照。
- 僅為 demo 建立 `qa_perf_20261021_9db2c0f1-bba9-4831-85ba-9fea534d776b` 並寫它的當日日誌。finally 刪除此確切 ID（同時限定 demo userId），其 checkIns cascade 刪除；回查 item=0、其 checkIns=0。沒有修改現有 demo 日誌。
- 基線為 998 筆既有 checkIns、1 筆 dailyEnergyState、20 筆既有 items；完整 scalar 快照在記憶體保留，清理後四類 SHA-256 全相同：checkIns、energy、items、user。比較包括全部原始欄位與 createdAt／updatedAt；沒有以現在時間重寫舊 updatedAt。
- `fixtureDeleted=true`、`fixtureCheckInsDeleted=true`；`unchanged.checkIns/energy/items/user` 全為 true。專屬 Chrome 已退出、暫存 profile 已刪除；Next/PostgreSQL 保持由主代理管理。

## 重跑與證據

在主代理確認 READY 且沒有 build/restart 時執行：

```sh
node --env-file=.env.local scripts/test-performance-2026-10-21.mjs
```

- 腳本：`scripts/test-performance-2026-10-21.mjs`。可用 `--smoke` 或 `--throttled-only` 診斷；最終本次使用完整兩組。
- 最終唯一統計來源：`docs/testing-performance-2026-10-21.json`，`status=passed`、`fixedBuild=true`、`validForFinalResults=true`，有效範圍與冷載限制見 validityScope／analysisNotes。
- `testing-performance-2026-10-21-attempt-1.json`：保存定位失敗證據（Click target missing/disabled/outside）。
- `testing-performance-2026-10-21-attempt-2.json`：保存節流 reload 後 hydration 尚未就緒造成 navigation measurement 消失的失敗證據。腳本已等候 React Link/button onClick hydration 並修正 undefined 不能當完成的條件。
- 舊 `-smoke.json`、`-throttled.json`、兩個 `-attempt-*.json` 均標記 `validForFinalResults=false`；其中舊節流可能與 build 重疊，絕不併入本次統計。`-paused.json` 記錄等待 READY 時無殘留 fixture 及資料一致。
- 另保留定位／hydration 除錯的 `testing-performance-2026-10-21-failure.png`。沒有額外產品修正或效能歸因 trace。
