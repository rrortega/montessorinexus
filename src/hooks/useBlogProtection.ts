import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SECURITY_REDIRECT_PATHS = [
  '/seguridad/herramientas-prohibidas',
  '/security/devtools-prohibited'
];

/**
 * Hook to protect application and blog intellectual property:
 * 1. Disables right-click (context menu) and image dragging on all images.
 * 2. Conditionally blocks keyboard shortcuts and active DevTools detection ONLY when
 *    VITE_ENABLE_DEVTOOLS_PROTECTION === '1' | 'true' in .env.
 */
export function useAppProtection(enabled = true) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Check environment variable: support '1', 'true', 'yes', 'on'
    const envVal = String(
      import.meta.env.VITE_ENABLE_DEVTOOLS_PROTECTION ?? 
      import.meta.env.VITE_BLOG_DEVTOOLS_PROTECTION ?? 
      ''
    ).toLowerCase().trim();

    // If explicitly set to false/0/off/no/empty, it is strictly DISABLED
    const isExplicitlyDisabled = 
      envVal === '0' || 
      envVal === 'false' || 
      envVal === 'off' || 
      envVal === 'no' || 
      envVal === '';

    const isExplicitlyEnabled = 
      envVal === '1' || 
      envVal === 'true' || 
      envVal === 'yes' || 
      envVal === 'on';

    // Check runtime overrides ONLY if not explicitly disabled in env
    const isRuntimeEnabled = !isExplicitlyDisabled && (
      localStorage.getItem('mn_devtools_protection') === 'true' ||
      (window as any).__ENABLE_DEVTOOLS_PROTECTION__ === true ||
      new URLSearchParams(window.location.search).get('devtools_protection') === 'true'
    );

    const isProtectionActive = isExplicitlyEnabled || isRuntimeEnabled;

    // If protection is NOT active, do not attach ANY listeners (no right-click blocking, no devtools blocking)
    if (!isProtectionActive) {
      return;
    }

    let isRedirecting = false;

    const triggerSecurityRedirect = () => {
      if (isRedirecting) return;
      if (typeof window === 'undefined') return;
      if (SECURITY_REDIRECT_PATHS.includes(window.location.pathname)) return;
      isRedirecting = true;

      try {
        window.location.replace(SECURITY_REDIRECT_PATHS[0]);
      } catch {
        window.location.href = SECURITY_REDIRECT_PATHS[0];
      }
    };

    // 1. Prevent Right-Click Context Menu on Images
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const isImage = (
        target.tagName === 'IMG' ||
        target.tagName === 'PICTURE' ||
        target.tagName === 'FIGURE' ||
        target.closest('img, figure, picture, [data-blog-image], .group\\/hero, .group\\/thumb, .group\\/figure')
      );

      if (isImage) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 2. Prevent Drag and Drop of Images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'IMG' || target.closest('img'))) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 3. Block DevTools Keyboard Shortcuts (100% Deterministic)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isDevToolsProtectionEnabled) return;

      // F12 key
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityRedirect();
        return;
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const key = (e.key || '').toUpperCase();

      // Mac shortcuts: Cmd + Option + I / J / C / U
      if (isMac && e.metaKey && e.altKey && (key === 'I' || key === 'J' || key === 'C' || key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityRedirect();
        return;
      }

      // Windows/Linux shortcuts: Ctrl + Shift + I / J / C
      if (isCmdOrCtrl && e.shiftKey && (key === 'I' || key === 'J' || key === 'C')) {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityRedirect();
        return;
      }

      // View source: Ctrl + U / Cmd + U
      if (isCmdOrCtrl && key === 'U') {
        e.preventDefault();
        e.stopPropagation();
        triggerSecurityRedirect();
        return;
      }
    };

    // Capture initial baseline difference (window chrome, address bar, scrollbars)
    const initialDiffX = typeof window !== 'undefined' ? (window.outerWidth - window.innerWidth) : 0;
    const initialDiffY = typeof window !== 'undefined' ? (window.outerHeight - window.innerHeight) : 0;

    // 4. Safe Docked DevTools Detection (Checks delta increase against baseline)
    const checkDockedDevTools = () => {
      if (!isDevToolsProtectionEnabled) return;
      const currentDiffX = window.outerWidth - window.innerWidth;
      const currentDiffY = window.outerHeight - window.innerHeight;

      // An added panel inside the window indicates DevTools was opened docked
      const deltaX = currentDiffX - initialDiffX;
      const deltaY = currentDiffY - initialDiffY;

      if (deltaX > 140 || deltaY > 140) {
        triggerSecurityRedirect();
      }
    };

    // 5. DOM Inspector Element Trap (Detects undocked / detached DevTools when console renders DOM)
    const checkDomInspector = () => {
      if (!isDevToolsProtectionEnabled) return;
      try {
        const element = document.createElement('div');
        Object.defineProperty(element, 'id', {
          get: function () {
            triggerSecurityRedirect();
            return 'devtools-active';
          }
        });
        console.info(element);
      } catch {}
    };

    // 6. Non-blocking Debugger Timing (Evaluates when developer tools instrument execution)
    const checkDebuggerTiming = () => {
      if (!isDevToolsProtectionEnabled) return;
      const start = performance.now();
      try {
        (function () {}['constructor']('debugger')());
      } catch {}
      const end = performance.now();
      if (end - start > 80) {
        triggerSecurityRedirect();
      }
    };

    const runChecks = () => {
      checkDockedDevTools();
      checkDomInspector();
      checkDebuggerTiming();
    };

    // Register Image Protection Listeners (Always active if hook is enabled)
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('dragstart', handleDragStart, true);

    // Register DevTools Listeners
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', checkDockedDevTools);
    window.addEventListener('focus', runChecks);

    // Run on interval
    const intervalId = setInterval(runChecks, 600);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('dragstart', handleDragStart, true);

      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', checkDockedDevTools);
      window.removeEventListener('focus', runChecks);
      clearInterval(intervalId);
    };
  }, [enabled, navigate]);
}

export const useBlogProtection = useAppProtection;
export const useSecurityProtection = useAppProtection;
export default useAppProtection;
