// Adım 8: sistem bağlama için widget'ta ek bir şey yoktur; ClickFix sisteminizi
// identify'daki user_id (dış kimlik) ile çağırır. Doğru kimliği verdiğinizden emin olun:
// @ts-check
ClickFix("on", "ready", () => {
  const state = ClickFix("getState");
  if (state && !state.verified)
    console.warn("identify yapılmadı: sistem verisi eşleşmez");
});
