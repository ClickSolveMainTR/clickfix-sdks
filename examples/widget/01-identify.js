// Adım 1: sunucunuzdan aldığınız user_hash ile giriş yapmış kullanıcıyı tanıtın.
// @ts-check
ClickFix("boot", { widgetId: "WIDGET_ID", locale: "tr" });

fetch("/api/support-session") // sizin ucunuz: { user_id, user_hash, company_id } döner
  .then((r) => r.json())
  .then((session) =>
    ClickFix("identify", {
      user_id: session.user_id, // kişinin dış kimliği
      // Firma ile: hex(HMAC-SHA256(anahtar, user_id + "\n" + company_id)), sunucuda.
      // Firmasız: hex(HMAC-SHA256(anahtar, user_id)).
      user_hash: session.user_hash,
      name: "Ayşe Yılmaz",
      email: "ayse@example.com",
      company: { id: session.company_id }, // imzadaki firma kimliği
    }),
  );

ClickFix("on", "error", (e) => {
  if (e.code === "WIDGET_IDENTITY_INVALID")
    console.warn("user_hash eşleşmedi:", e.message);
});
