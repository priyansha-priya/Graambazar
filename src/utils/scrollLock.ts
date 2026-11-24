/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let activeScrollLocks = 0;
let previousBodyOverflow: string | null = null;

/**
 * Reference-counted body scroll lock for modals and drawers.
 * Prevents nested or adjacent closed modals from prematurely unlocking
 * scrolling while another overlay is still open.
 */
export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') {
    return () => {};
  }

  if (activeScrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeScrollLocks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);
    if (activeScrollLocks === 0) {
      document.body.style.overflow = previousBodyOverflow ?? '';
      previousBodyOverflow = null;
    }
  };
}
