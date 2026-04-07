import { Accessor, ParentComponent, createContext, createSignal, onCleanup, onMount, useContext } from "solid-js";

interface MobileContextValue {
  /** Whether the viewport is mobile-sized (< 768px) */
  isMobile: Accessor<boolean>;
  /** Whether the viewport is tablet-sized (< 1024px) */
  isTablet: Accessor<boolean>;
  /** Whether the mobile sidebar overlay is open */
  sidebarOpen: Accessor<boolean>;
  /** Open the mobile sidebar */
  openSidebar: () => void;
  /** Close the mobile sidebar */
  closeSidebar: () => void;
  /** Toggle the mobile sidebar */
  toggleSidebar: () => void;
}

const MobileCtx = createContext<MobileContextValue>();

export const MobileProvider: ParentComponent = (props) => {
  const [isMobile, setIsMobile] = createSignal(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const [isTablet, setIsTablet] = createSignal(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  const [sidebarOpen, setSidebarOpen] = createSignal(false);

  onMount(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");
    const tabletQuery = window.matchMedia("(max-width: 1023px)");

    const onMobileChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (!e.matches) setSidebarOpen(false);
    };
    const onTabletChange = (e: MediaQueryListEvent) => setIsTablet(e.matches);

    mobileQuery.addEventListener("change", onMobileChange);
    tabletQuery.addEventListener("change", onTabletChange);

    onCleanup(() => {
      mobileQuery.removeEventListener("change", onMobileChange);
      tabletQuery.removeEventListener("change", onTabletChange);
    });
  });

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <MobileCtx.Provider
      value={{ isMobile, isTablet, sidebarOpen, openSidebar, closeSidebar, toggleSidebar }}
    >
      {props.children}
    </MobileCtx.Provider>
  );
};

export function useMobile(): MobileContextValue {
  const ctx = useContext(MobileCtx);
  if (!ctx) {
    // Fallback for usage outside provider (shouldn't happen)
    const [f] = createSignal(false);
    const noop = () => {};
    return { isMobile: f, isTablet: f, sidebarOpen: f, openSidebar: noop, closeSidebar: noop, toggleSidebar: noop };
  }
  return ctx;
}
