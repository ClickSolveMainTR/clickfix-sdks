// Adım 5: ekran bağlamı. Son 20 olay ve sayfa adresi ziyaretçinin mesajıyla
// gider; panelde "hangi ekrandan yazdı" ve AI'ın girdisi olur.
// @ts-check
ClickFix("track", "order_viewed", { order_id: "SP-1042", total: 1250.5 });
ClickFix("track", "payment_failed", { reason: "insufficient_funds" });
// Kullanıcı destek isterse konuşmayı hazır metinle açın:
ClickFix(
  "startConversation",
  "SP-1042 numaralı siparişimde ödeme hatası alıyorum",
);
