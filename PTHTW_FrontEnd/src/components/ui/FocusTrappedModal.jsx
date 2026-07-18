import * as Dialog from '@radix-ui/react-dialog';

/**
 * Modal shell with Radix-managed focus trap, Escape handling, and focus restoration.
 * @param {boolean} dismissible When false, overlay click and Escape do not dismiss (e.g. during submission).
 */
export default function FocusTrappedModal({ children, onClose, dismissible = true }) {
  return (
    <Dialog.Root
      open
      modal
      onOpenChange={(open) => {
        if (!open && dismissible) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-gray-900/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-[101] flex items-center justify-center p-4 outline-none focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          onPointerDownOutside={(e) => {
            if (!dismissible) e.preventDefault();
          }}
          onInteractOutside={(e) => {
            if (!dismissible) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (!dismissible) e.preventDefault();
          }}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
