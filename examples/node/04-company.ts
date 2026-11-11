// Adım 4: şirket. Şirket widget identify (company.id) ile oluşur; API ile
// bulunur ve müşteri sağlığı sinyalleri (kullanım, gelir, olay) gönderilir.
import { createClient } from "@getclickfix/node";

const client = createClient({
  baseURL: process.env.CLICKFIX_BASE_URL!,
  apiKey: process.env.CLICKFIX_API_KEY!, // companies:read, health:write
});

const found = await client.request(
  "/v1/public-api/companies",
  "get",
  undefined,
  {
    query: { external_id: "F-77" },
  },
);

// 0-100 arası kullanım sinyali; 30 gün boyunca sağlık puanına katılır.
const usage = await client.request(
  "/v1/public-api/company-usage",
  "put",
  { external_id: "F-77", score: 82 },
  // İşlemi tanımlayan sabit değer: kendi ölçüm kaydınızın kimliği (örnekte zaman damgası)
  { idempotencyKey: `usage-F-77-${Date.now()}` },
);

console.log(JSON.stringify({ found: found.data, usage: usage.data }));
