// Adım 4: şirket identify ile oluşur ya da dış kimliğiyle eşleşir (ikinci anahtar: domain).
// company.id yalnız user_hash onu da imzalıyorsa bağlanır (user_id + "\n" + company.id).
// @ts-check
ClickFix("boot", {
  widgetId: "WIDGET_ID",
  user: {
    user_id: "1001",
    user_hash: "SUNUCUDA_HESAPLANAN", // user_id + "\n" + "F-77" üzerinden
    company: { id: "F-77", name: "Acme A.Ş.", domain: "acme.com.tr" },
  },
});
