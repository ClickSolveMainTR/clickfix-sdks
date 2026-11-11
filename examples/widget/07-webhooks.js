// Adım 7: tarayıcı tarafında webhook yoktur; konuşma olaylarını SDK verir.
// @ts-check
ClickFix("on", "conversation:started", ({ conversation_uuid }) =>
  console.log("yeni", conversation_uuid),
);
ClickFix("on", "conversation:ended", ({ conversation_uuid, status }) =>
  console.log(conversation_uuid, status),
);
ClickFix("on", "csat", ({ score }) => console.log("memnuniyet", score));
