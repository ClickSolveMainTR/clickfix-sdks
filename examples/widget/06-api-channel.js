// Adım 6: web'de API kanalı gerekmez; widget zaten kanaldır. Kendi arayüzünüz
// varsa @getclickfix/react-widget'ın arayüzsüz istemcisini kullanın.
// @ts-check
ClickFix("on", "message", (m) => {
  // Temsilci veya AI yanıtı: kendi bildirim sisteminize aktarabilirsiniz
  console.log(m.conversation_uuid, m.sender_type, m.text);
});
