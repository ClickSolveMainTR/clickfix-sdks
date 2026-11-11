// Adım 3: özel alanlar. Anahtar panelde tanımlı alanın anahtarıdır; tanımsız
// anahtar "tanımsız alan" uyarısı olarak kalır ve alanı tanımlayınca işlenir.
// @ts-check
ClickFix("setAttributes", {
  plan: "pro",
  seats: 12,
  renewal_date: "2027-01-31",
});
ClickFix("on", "attributes", ({ applied, ignored, pending }) => {
  console.log({ applied, ignored, pending }); // pending: ilk mesajla gönderilecek
});
