// Adım 1: user_hash sunucuda hesaplanır ve giriş yapmış kullanıcıya verilir.
import { identityHash } from "@getclickfix/node";

// Panel > Web widget > Güvenlik > Kimlik doğrulama anahtarı (bir kez gösterilir)
const secret = process.env.CLICKFIX_IDENTITY_SECRET!;

// Oturum açmış kullanıcının sizin sisteminizdeki kimliği (dış kimlik) ve
// firmasının kimliği (identify'daki company.id). Firma verilirse imza ikisini
// birden kapsar: hex(HMAC-SHA256(anahtar, user_id + "\n" + company_id)).
export function userHashFor(userId: string, companyId?: string): string {
  return identityHash(secret, userId, companyId);
}

// Örnek: /api/support-session uç noktanız bunu döner, tarayıcı identify'a verir
console.log(
  JSON.stringify({
    user_id: "1001",
    user_hash: userHashFor("1001"), // firmasız: eski formül
    company_id: "F-77",
    company_user_hash: userHashFor("1001", "F-77"), // company: { id: "F-77" } ile gönderilir
  }),
);
