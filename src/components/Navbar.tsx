import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { X, Phone, MessageSquare } from "lucide-react";
import Logo from "./Logo";
import NavLink, { type NavTone } from "./NavLink";
import ProfileDropdown from "./ProfileDropdown";
import LanguageSwitcher from "./LanguageSwitcher";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV, SECONDARY_NAV, hasDarkHero, isActivePath, type NavItem } from "@/lib/navItems";
import { SITE, smsHref, telHref } from "@/lib/siteConfig";
import { VI_ROUTES } from "@/lib/viRoutes";

/**
 * A dropdown panel that opens on hover AND on click, focus and keyboard.
 *
 * The previous implementation bound `onMouseEnter` to the wrapper div and gave
 * the trigger button no onClick and no key handler at all, so on any touch
 * device wider than the 1140px breakpoint the entire secondary navigation was
 * unreachable, and keyboard users could focus the trigger and have nothing
 * happen. It also carried ~150 lines of hand-rolled close scheduling —
 * elementFromPoint against a document-level mousemove listener — with both of
 * its delay constants set to zero.
 */
const useDisclosure = () => {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  return { open, setOpen, wrapper };
};

const PANEL =
  "absolute right-0 top-full z-50 w-52 min-w-[8rem] pt-2";
const PANEL_INNER =
  "rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg";

const Navbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const phone = useDisclosure();
  const menu = useDisclosure();

  const pathname = location.pathname;
  // Transparent only while sitting over a dark hero and not yet scrolled.
  // `isScrolled` seeds false on both the server and the client and is corrected
  // in an effect, so it is not a hydration surface.
  const overDark = hasDarkHero(pathname) && !isScrolled;
  const tone: NavTone = overDark ? "dark" : "light";
  const barColor = overDark ? "bg-white" : "bg-ink";

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const labelFor = useCallback(
    (item: NavItem) => (item.labelKey ? t(item.labelKey) : (item.label as string)),
    [t],
  );

  /** One dropdown row. Real anchors, and the champagne accent on the current one. */
  const PanelLink = ({ item }: { item: NavItem }) => {
    const active = isActivePath(pathname, item.to);
    return (
      <Link
        to={item.to}
        onClick={() => menu.setOpen(false)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex w-full items-center rounded-lg px-3 py-2 text-sm uppercase tracking-wide transition-colors",
          active
            ? "bg-bone text-champagne-ink"
            : "text-ink hover:bg-bone hover:text-champagne-ink",
        )}
      >
        {labelFor(item)}
      </Link>
    );
  };

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        overDark ? "bg-transparent" : "bg-white",
      )}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link to="/" className="relative z-10 flex shrink-0 items-center">
          <Logo className="h-20 w-auto" />
        </Link>

        {/* Desktop. The breakpoint moved from 1011px to 1140px when /about made
            this a four-item bar alongside the switcher, phone, menu and login. */}
        <div className="hidden min-h-0 min-[1140px]:flex h-full items-center gap-8">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.to}
              item={item}
              pathname={pathname}
              tone={tone}
              label={labelFor(item)}
            />
          ))}

          <LanguageSwitcher />

          <div
            ref={phone.wrapper}
            className="relative"
            onMouseEnter={() => phone.setOpen(true)}
            onMouseLeave={() => phone.setOpen(false)}
          >
            <button
              type="button"
              onClick={() => phone.setOpen(!phone.open)}
              aria-expanded={phone.open}
              aria-label="Phone number"
              className={cn(
                "text-sm uppercase tracking-wider transition-colors",
                overDark ? "text-white hover:text-champagne" : "text-ink hover:text-champagne-ink",
              )}
            >
              {SITE.phone}
            </button>
            <AnimatePresence>
              {phone.open && (
                <motion.div
                  key="phone-panel"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={cn(PANEL, "w-36")}
                >
                  <div className={PANEL_INNER}>
                    <a
                      href={telHref}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm uppercase tracking-wide text-ink transition-colors hover:bg-bone hover:text-champagne-ink"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden />
                      Call
                    </a>
                    <a
                      href={smsHref}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm uppercase tracking-wide text-ink transition-colors hover:bg-bone hover:text-champagne-ink"
                    >
                      <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                      Text
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div
            ref={menu.wrapper}
            className="relative"
            onMouseEnter={() => menu.setOpen(true)}
            onMouseLeave={() => menu.setOpen(false)}
          >
            <button
              type="button"
              onClick={() => menu.setOpen(!menu.open)}
              aria-expanded={menu.open}
              aria-label="Menu"
              className={cn(
                "inline-flex h-auto min-h-0 shrink-0 items-center justify-center rounded-md p-1",
                "transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2",
              )}
            >
              <span className="relative block h-4 w-5 shrink-0">
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 h-0.5 w-5 origin-center rounded-full transition-all duration-300 ease-out",
                    barColor,
                    menu.open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0 translate-y-0 rotate-0",
                  )}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 top-1/2 h-0.5 w-5 origin-center -translate-y-1/2 rounded-full transition-all duration-150 ease-out",
                    barColor,
                    menu.open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute left-0 h-0.5 w-5 origin-center rounded-full transition-all duration-300 ease-out",
                    barColor,
                    menu.open
                      ? "top-1/2 bottom-auto -translate-y-1/2 -rotate-45"
                      : "bottom-0 top-auto translate-y-0 rotate-0",
                  )}
                />
              </span>
            </button>
            <AnimatePresence>
              {menu.open && (
                <motion.div
                  key="menu-panel"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className={PANEL}
                >
                  <div className={PANEL_INNER}>
                    {SECONDARY_NAV.map((item) => (
                      <PanelLink key={item.to} item={item} />
                    ))}

                    {/*
                      The Vietnamese tree. It was reachable only from the
                      footer, which meant scrolling the whole page to find it.
                      Labels come straight from VI_ROUTES and are literal
                      Vietnamese — never t(), which is pinned to 'en' during
                      static generation.
                    */}
                    <div className="my-1.5 h-px bg-gray-200" />
                    <p className="px-3 pb-1 pt-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-500">
                      Tiếng Việt
                    </p>
                    {VI_ROUTES.map((route) => (
                      <Link
                        key={route.vi}
                        to={route.vi}
                        onClick={() => menu.setOpen(false)}
                        aria-current={isActivePath(pathname, route.vi) ? "page" : undefined}
                        className={cn(
                          "flex w-full items-center rounded-lg px-3 py-2 text-sm uppercase tracking-wide transition-colors",
                          isActivePath(pathname, route.vi)
                            ? "bg-bone text-champagne-ink"
                            : "text-ink hover:bg-bone hover:text-champagne-ink",
                        )}
                      >
                        {route.label}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {user ? (
            <ProfileDropdown onItemClick={() => {}} />
          ) : (
            <NavLink
              item={{ to: "/auth", labelKey: "nav.login" }}
              pathname={pathname}
              tone={tone}
              label={t("nav.login")}
            />
          )}
        </div>

        {/* Mobile trigger */}
        <div className="flex h-full min-h-0 items-center gap-4 min-[1140px]:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={cn(
              "relative z-10 inline-flex rounded-md p-1.5",
              "transition-transform duration-200 ease-out hover:scale-[1.04] active:scale-[0.94]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2",
            )}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="relative block h-3 w-4 shrink-0">
              <span
                className={cn(
                  "pointer-events-none absolute left-0 h-0.5 w-4 origin-center rounded-full transition-all duration-300 ease-out",
                  barColor,
                  mobileMenuOpen ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0 translate-y-0 rotate-0",
                )}
              />
              <span
                className={cn(
                  "pointer-events-none absolute left-0 top-1/2 h-0.5 w-4 origin-center -translate-y-1/2 rounded-full transition-all duration-150 ease-out",
                  barColor,
                  mobileMenuOpen ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100",
                )}
              />
              <span
                className={cn(
                  "pointer-events-none absolute left-0 h-0.5 w-4 origin-center rounded-full transition-all duration-300 ease-out",
                  barColor,
                  mobileMenuOpen
                    ? "top-1/2 bottom-auto -translate-y-1/2 -rotate-45"
                    : "bottom-0 top-auto translate-y-0 rotate-0",
                )}
              />
            </span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 overflow-y-auto bg-white"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute right-4 top-4 z-50 p-2 text-ink transition-colors hover:text-champagne-ink"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="container mx-auto flex min-h-full flex-col px-4 pb-8 pt-24">
              <div className="mx-auto flex w-full max-w-xs flex-grow flex-col items-center gap-3">
                {/*
                  Primary first, then the rest. The old mobile list ran the eight
                  secondary routes before the three primary ones — the exact
                  inverse of the desktop hierarchy — with identical hairlines
                  between all eleven and nothing marking the boundary.
                */}
                {PRIMARY_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    item={item}
                    pathname={pathname}
                    tone="light"
                    label={labelFor(item)}
                    className="inline-block text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}

                <div className="my-2 h-px w-full bg-gray-200" />

                {SECONDARY_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    item={item}
                    pathname={pathname}
                    tone="light"
                    label={labelFor(item)}
                    className="inline-block text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}

                <div className="my-2 h-px w-full bg-gray-200" />

                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gray-500">
                  Tiếng Việt
                </p>
                {VI_ROUTES.map((route) => (
                  <Link
                    key={route.vi}
                    to={route.vi}
                    onClick={() => setMobileMenuOpen(false)}
                    aria-current={isActivePath(pathname, route.vi) ? "page" : undefined}
                    className={cn(
                      "inline-block text-center text-sm uppercase tracking-wide transition-colors",
                      isActivePath(pathname, route.vi)
                        ? "text-champagne-ink"
                        : "text-ink hover:text-champagne-ink",
                    )}
                  >
                    {route.label}
                  </Link>
                ))}

                <div className="my-2 h-px w-full bg-gray-200" />

                <a
                  href={telHref}
                  className="inline-flex items-center gap-2 text-sm uppercase tracking-wider text-ink transition-colors hover:text-champagne-ink"
                >
                  <Phone className="h-3.5 w-3.5" aria-hidden />
                  {SITE.phone}
                </a>

                {user ? (
                  <ProfileDropdown onItemClick={() => setMobileMenuOpen(false)} />
                ) : (
                  <NavLink
                    item={{ to: "/auth", labelKey: "nav.login" }}
                    pathname={pathname}
                    tone="light"
                    label={t("nav.login")}
                    className="inline-block text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  />
                )}
              </div>

              <button
                onClick={() => setMobileMenuOpen(false)}
                className="mx-auto mt-8 text-xs uppercase tracking-[0.2em] text-gray-500 transition-colors hover:text-ink"
              >
                Exit menu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
