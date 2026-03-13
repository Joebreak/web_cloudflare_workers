# Cloudflare Workers 練習專案

## 安裝

1. 安裝依賴：

```bash
npm install
```

2. 開發模式啟動（本機）：

```bash
npx wrangler dev
```

開啟終端機輸出的網址，例如 `http://127.0.0.1:8787`。

## 可以試的路由

- `/`：基本 JSON，會顯示 `HELLO_MESSAGE`。
- `/echo?name=YourName`：回傳你給的 `name` 和 User-Agent。
- `/time`：回傳現在的 ISO 時間。

## 下一步可以練習的東西

- 在 `wrangler.toml` 打開 / 新增 KV binding，實作簡單 Key-Value 儲存 API。
- 新增一個 `/json` POST endpoint，解析 JSON body。
- 新增一個 middleware 做簡單的 log 或加 header。

