// Type-check the widget samples against the published contract
// (frontend/public/widget.d.ts): `ClickFix` is the global the script sets.
import type { ClickFixSDK } from "../../../frontend/public/widget";
declare global {
  const ClickFix: ClickFixSDK;
}
export {};
