// Adım 2: kişiyi dış kimliğiyle oluştur/güncelle, şirketi dış kimliğiyle bul.
import { createClient } from "@getclickfix/node";

const client = createClient({
  baseURL: process.env.CLICKFIX_BASE_URL!, // https://api.getclickfix.com
  apiKey: process.env.CLICKFIX_API_KEY!, // contacts:read, contacts:write, companies:read
});

// Aynı dış kimlikle ikinci çağrı yeni kişi açmaz, günceller (200); ilki 201 döner.
const contact = await client.request(
  "/v1/public-api/contacts/by-external-id",
  "put",
  { external_id: "1001", name: "Ayşe Yılmaz", email: "ayse@example.com" },
  { idempotencyKey: `user-1001-${Date.now()}` },
);

// Şirketin dış kimliği kişininkinden ayrıdır (widget: company.id).
const companies = await client.request(
  "/v1/public-api/companies",
  "get",
  undefined,
  { query: { external_id: "F-77" } },
);

console.log(
  JSON.stringify({ contact: contact.data, companies: companies.data }),
);
