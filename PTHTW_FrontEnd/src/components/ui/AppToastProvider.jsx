import * as Toast from '@radix-ui/react-toast';
import GlobalToastRegion from './GlobalToastRegion';

/**
 * Root-level toast context: Radix Provider + Zustand-driven viewport.
 * Swipe to dismiss is enabled; per-toast duration comes from uiStore entries.
 */
export default function AppToastProvider({ children }) {
  return (
    <Toast.Provider swipeDirection="right" duration={5000}>
      {children}
      <GlobalToastRegion />
    </Toast.Provider>
  );
}
