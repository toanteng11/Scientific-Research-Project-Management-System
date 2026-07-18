import * as Toast from '@radix-ui/react-toast';
import useUiStore from '../../store/uiStore';

const TYPE_SURFACE = {
  success: 'bg-green-700 text-white border-green-800',
  error: 'bg-red-700 text-white border-red-900',
  warning: 'bg-amber-600 text-white border-amber-800',
  info: 'bg-slate-800 text-white border-slate-900',
};

/**
 * Renders Zustand-backed toasts through Radix Toast primitives (viewport + focus-safe dismissal).
 * Must be mounted inside {@link Toast.Provider} (see AppToastProvider).
 */
export default function GlobalToastRegion() {
  const toasts = useUiStore((s) => s.toasts);
  const removeToast = useUiStore((s) => s.removeToast);

  return (
    <>
      {toasts.map((t) => (
        <Toast.Root
          key={t.id}
          open
          duration={t.duration}
          onOpenChange={(open) => {
            if (!open) removeToast(t.id);
          }}
          className={`pointer-events-auto rounded-lg border px-4 py-3 shadow-lg data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 ${TYPE_SURFACE[t.type] ?? TYPE_SURFACE.info}`}
        >
          <Toast.Title className="text-sm font-semibold leading-snug">{t.message}</Toast.Title>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed bottom-4 right-4 z-[200] flex w-[min(100vw-2rem,22rem)] flex-col gap-2 outline-none" />
    </>
  );
}
