// Adım 3: özel alanlar. Alanı panelde tanımlayın (Ayarlar > Özel alanlar);
// anahtarı neyse custom_fields içinde o anahtarla gönderin.
import { createClient } from "@getclickfix/node";

const client = createClient({
  baseURL: process.env.CLICKFIX_BASE_URL!,
  apiKey: process.env.CLICKFIX_API_KEY!,
});

const contact = await client.request(
  "/v1/public-api/contacts/by-external-id",
  "put",
  {
    external_id: "1001",
    // Liste alanlarında seçeneğin kimliği ya da etiketi kabul edilir.
    custom_fields: { plan: "pro", seats: 12, renewal_date: "2027-01-31" },
  },
  { idempotencyKey: `user-1001-fields-${Date.now()}` },
);

console.log(JSON.stringify(contact.data));
