// Adım 6: API kanalı. Kendi uygulamanızdaki müşteri mesajını ClickFix'e
// gönderin; imza API anahtarıyla değil kanalın imza anahtarıyla atılır.
import { createHmac } from "node:crypto";

const base = process.env.CLICKFIX_BASE_URL!;
const instance = process.env.CLICKFIX_CHANNEL_INSTANCE!; // Kanallar > API kanalı
const secret = process.env.CLICKFIX_CHANNEL_SECRET!;

const body = JSON.stringify({
  id: `msg-${Date.now()}`, // kanal içinde tekil; aynı id bir kez kaydedilir
  sender_id: "1001", // müşterinin sizin sisteminizdeki kimliği
  sender_name: "Ayşe Yılmaz",
  text: "Siparişim ne zaman gelir?",
});
const timestamp = String(Math.floor(Date.now() / 1000));
const signature =
  "sha256=" +
  createHmac("sha256", secret)
    .update(`${timestamp}.`)
    .update(body)
    .digest("hex");

const res = await fetch(`${base}/v1/webhooks/channels/api/${instance}`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-ClickFix-Timestamp": timestamp,
    "X-ClickFix-Signature": signature,
  },
  body,
});
if (!res.ok) throw new Error(`ClickFix ${res.status}`);
console.log(JSON.stringify(await res.json()));
