import React from 'react'

/**
 * Responsive modal classes matching Campus's Dialog/Drawer design system:
 * - Mobile (< sm): Bottom-sheet drawer anchored to the bottom, rounded-t-2xl, max-h-[90dvh], slide-in-from-bottom, safe-area padding
 * - Desktop (sm+): Classic centered dialog with zoom-in-95
 */
export const SPHERA_DRAWER_MODAL_BASE =
  'fixed z-50 w-full bg-sphera-surface-2 border border-sphera-border shadow-2xl overflow-hidden flex flex-col duration-200 ' +
  // Mobile bottom-sheet drawer
  'max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:left-0 max-sm:right-0 max-sm:translate-x-0 max-sm:translate-y-0 ' +
  'max-sm:max-w-full max-sm:max-h-[90dvh] max-sm:rounded-t-2xl max-sm:rounded-b-none max-sm:border-t max-sm:border-x-0 max-sm:border-b-0 ' +
  'max-sm:pb-[env(safe-area-inset-bottom,0px)] max-sm:animate-in max-sm:slide-in-from-bottom ' +
  // Desktop centered modal
  'sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:max-h-[88vh] sm:animate-in sm:fade-in sm:zoom-in-95'

/**
 * Universal mobile drag handle matching Campus's drawer handle.
 */
export function SpheraDrawerHandle({ className = '' }: { className?: string }) {
  return (
    <div
      className={`sm:hidden sticky top-0 z-30 w-full flex items-center justify-center pt-3 pb-1.5 shrink-0 select-none touch-none ${className}`}
      aria-hidden="true"
    >
      <span className="h-1 w-9 rounded-full bg-white/20 block" />
    </div>
  )
}
