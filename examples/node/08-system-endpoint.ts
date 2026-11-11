// Adım 8: sistem bağlama. ClickFix sizin sisteminizi çağırır; siz yalnız
// müşterinin dış kimliğiyle cevap veren bir uç yazarsınız. Panelde
// Entegrasyonlar > Sistemini bağla > Kaynak: /customers/{external_id}/invoices
import { createServer } from "node:http";

const token = process.env.SYSTEM_TOKEN ?? "example-system-token"; // bağlantıda Bearer

createServer((req, res) => {
  if (req.headers.authorization !== `Bearer ${token}`) {
    res.writeHead(401).end();
    return;
  }
  const m = /^\/customers\/([^/]+)\/invoices$/.exec(req.url ?? "");
  if (!m) {
    res.writeHead(404).end();
    return;
  }
  const externalId = decodeURIComponent(m[1]);
  // Gerçek sisteminizde: veritabanından externalId'nin faturaları
  const items = [
    {
      number: "F-2026-0042",
      total: 1250.5,
      currency: "TRY",
      status: "paid",
      customer_id: externalId,
    },
  ];
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ items })); // Kayıt yolu: items
}).listen(Number(process.env.PORT ?? 3000), () => console.log("listening"));
