import { useCallback, useEffect, useState } from "react";
import {
  setSidebarStorage,
  getSidebarFromStorage,
  getDefaultSidebarState,
} from "@/lib/sidebar-utils";
import { useServerSidebar } from "@/providers/sidebar-provider";

function withDisabledAnimations(fn: () => void) {
  if (typeof document === "undefined") return fn();

  document.documentElement.classList.add("disable-animations");

  fn();

  // Re-enable animations after a short delay to allow DOM changes to settle
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.classList.remove("disable-animations");
    });
  });
}

export function useSidebar() {
  const serverSidebarVisible = useServerSidebar();
  const [mounted, setMounted] = useState(false);
  const [clientSidebarVisible, setClientSidebarVisible] =
    useState<boolean>(serverSidebarVisible);
  const [isMobile, setIsMobile] = useState(false);
  const [lastDesktopSidebarState, setLastDesktopSidebarState] = useState(true);

  useEffect(() => {
    withDisabledAnimations(() => {
      setMounted(true);

      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);

      if (mobile) {
        // On mobile, always start collapsed
        setClientSidebarVisible(false);
        setSidebarStorage(false);
      } else {
        // On desktop, load from localStorage or use default
        const storedVisibility = getSidebarFromStorage();
        const finalVisibility =
          storedVisibility !== null
            ? storedVisibility
            : getDefaultSidebarState();
        setClientSidebarVisible(finalVisibility);
        setLastDesktopSidebarState(finalVisibility);
      }
    });

    // Listen for sidebar state changes from other hook instances
    const handleSidebarChange = (event: CustomEvent) => {
      setClientSidebarVisible(event.detail.isVisible);
    };

    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      const wasMobile = isMobile;

      if (mobile !== wasMobile) {
        if (mobile && !wasMobile) {
          // Switching to mobile - save desktop state and collapse
          setLastDesktopSidebarState(clientSidebarVisible);
          setClientSidebarVisible(false);
          setSidebarStorage(false);
          // Notify other hook instances
          window.dispatchEvent(
            new CustomEvent("sidebarToggle", { detail: { isVisible: false } })
          );
        } else if (!mobile && wasMobile) {
          // Switching to desktop - restore previous desktop state
          setClientSidebarVisible(lastDesktopSidebarState);
          setSidebarStorage(lastDesktopSidebarState);
          // Notify other hook instances
          window.dispatchEvent(
            new CustomEvent("sidebarToggle", {
              detail: { isVisible: lastDesktopSidebarState },
            })
          );
        }
        setIsMobile(mobile);
      }
    };

    window.addEventListener(
      "sidebarToggle",
      handleSidebarChange as EventListener
    );
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener(
        "sidebarToggle",
        handleSidebarChange as EventListener
      );
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isSidebarVisible = mounted
    ? clientSidebarVisible
    : serverSidebarVisible;

  const setSidebarVisible = useCallback(
    (isVisible: boolean) => {
      setClientSidebarVisible(isVisible);
      setSidebarStorage(isVisible);

      if (!isMobile) {
        setLastDesktopSidebarState(isVisible);
      }

      // Notify other hook instances
      window.dispatchEvent(
        new CustomEvent("sidebarToggle", { detail: { isVisible } })
      );
    },
    [isMobile]
  );

  const toggleSidebar = useCallback(() => {
    const newVisibility = !isSidebarVisible;
    setSidebarVisible(newVisibility);
  }, [isSidebarVisible, setSidebarVisible]);

  return {
    isSidebarVisible,
    setSidebarVisible,
    toggleSidebar,
    isMobile,
    mounted,
  };
}
