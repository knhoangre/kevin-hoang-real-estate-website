/**
 * Where to send somebody back to after they sign in.
 *
 * The heart on a listing asks a signed-out visitor to sign in, and until this
 * existed signing in always landed on the homepage — with the listing they were
 * about to save one search and several clicks behind them.
 *
 * sessionStorage, NOT a `?next=` query parameter, and that is the security
 * property rather than a convenience. A URL parameter is something a stranger
 * can put in a link ("kevinhoang.co/auth?next=//evil.example"), which makes the
 * sign-in page an open redirect unless every consumer validates it perfectly.
 * This value is written only by our own code, from the browser's own
 * `location`, in the same tab — nobody else can set it. It is validated on the
 * way out anyway, because the day somebody adds a second writer is not the day
 * to discover the reader trusted the first.
 */
const KEY = 'post_auth_return';

/** Remember the page being left, so sign-in can come back to it. */
export const rememberReturnPath = (): void => {
  try {
    sessionStorage.setItem(KEY, window.location.pathname + window.location.search);
  } catch {
    // Private mode or blocked storage. Sign-in still works; it lands on the homepage.
  }
};

/**
 * A same-site path: one leading slash, no scheme-relative `//`, no backslash a
 * browser would read as one, and never the sign-in pages themselves.
 */
const isSafePath = (path: string): boolean =>
  /^\/(?![/\\])/.test(path) && !/[\u0000-\u001f]/.test(path) && !/^\/auth(\/|$|\?)/.test(path);

/** The remembered path, once. Null when there is none or it does not validate. */
export const takeReturnPath = (): string | null => {
  try {
    const path = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    return path && isSafePath(path) ? path : null;
  } catch {
    return null;
  }
};
