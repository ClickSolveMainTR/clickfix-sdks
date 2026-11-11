// Adım 5: olaylar. Ekran bağlamı widget'tan (track) gelir; ürün olayları
// şirket zaman çizelgesine API ile yazılır (events:write).
import { createClient } from "@getclickfix/node";

const client = createClient({
  baseURL: process.env.CLICKFIX_BASE_URL!,
  apiKey: process.env.CLICKFIX_API_KEY!,
});

// Olayı sizin sisteminizde tanımlayan kimlik; tekrar gönderimde aynı kalır (örnekte zaman damgası)
const eventId = `seat-limit-F-77-${Date.now()}`;

const event = await client.request(
  "/v1/public-api/company-events",
  "post",
  {
    external_id: "F-77", // şirketin dış kimliği (ya da company_uuid / domain)
    contact_email: "ayse@example.com", // olayı bilinen kişiye bağlar
    name: "seat_limit_reached",
    properties: { seats: 12, limit: 12 },
    idempotency_key: eventId,
  },
  { idempotencyKey: eventId },
);

console.log(JSON.stringify(event.data));
