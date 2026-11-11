import type { ReactNode } from 'react';
import { ClickFixUIContext, useClickFixUI, type ThemeProps } from './theme.js';

/** App-wide theme and labels for the ClickFix screens, e.g. `labels={labelsTr}` or `theme={darkTheme}`. */
export function ClickFixThemeProvider(props: ThemeProps & { children?: ReactNode }) {
  const value = useClickFixUI(props);
  return <ClickFixUIContext.Provider value={value}>{props.children}</ClickFixUIContext.Provider>;
}
