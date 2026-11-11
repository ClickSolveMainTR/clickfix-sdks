// Adım 7: webhook aboneliği aç ve teslimatları ham gövde üzerinde doğrula.
import { createServer } from "node:http";
import { createClient, verifyWebhook } from "@getclickfix/node";

const client = createClient({
  baseURL: process.env.CLICKFIX_BASE_URL!,
  apiKey: process.env.CLICKFIX_API_KEY!, // webhooks:write
});

const created = await client.request(
  "/v1/public-api/webhooks",
  "post",
  {
    name: "CRM senkronizasyonu",
    url: "https://example.com/clickfix/webhook",
    events: ["conversation.created", "message.received", "contact.updated"],
    enabled: true,
  },
  { idempotencyKey: `webhook-crm-${Date.now()}` },
);
// data.secret yalnız bu yanıtta döner: güvenli saklayın (ör. gizli değer deposu),
// loglamayın. Doğrulama sunucunuz onu oradan okur.
const { secret: issued, ...subscription } = created.data as {
  secret: string;
  uuid: string;
};
const secret = process.env.CLICKFIX_WEBHOOK_SECRET ?? issued;
console.log(JSON.stringify({ subscription }));

createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const raw = Buffer.concat(chunks);
  const ok = verifyWebhook(
    secret,
    String(req.headers["clickfix-webhook-timestamp"] ?? ""),
    String(req.headers["clickfix-webhook-signature"] ?? ""),
    raw,
  );
  if (!ok) {
    res.writeHead(401).end();
    return;
  }
  // ClickFix-Webhook-Id ile tekilleştirin, kaydedin, sonra 2xx dönün.
  const event = JSON.parse(raw.toString()) as { event: string; data: unknown };
  console.log(JSON.stringify({ received: event.event }));
  res.writeHead(200).end();
}).listen(Number(process.env.PORT ?? 3000), () => console.log("listening"));
