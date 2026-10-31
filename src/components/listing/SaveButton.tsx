import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { pill } from '@/lib/pill';

/**
 * The heart: save a home, or take it back out.
 *
 * Two shapes of one button — a round one laid over a card's photograph, and a
 * labelled pill on the listing page — so that "is this saved" has one
 * implementation and one accessible name wherever it appears.
 *
 * ON EVERY LISTING, SOLD ONES INCLUDED, since 2026-10-09. Sold homes had none
 * on the reasoning that there is nothing left to go and see; Kevin asked for it
 * anyway, and a client marking the sold house they wish they had bought is a
 * statement of taste like any other.
 *
 * RED WHEN SAVED, and that is not a brand decision. It is the one colour on a
 * card that means something the reader did, and the design system exempts
 * colour that carries meaning from the champagne accent for exactly that
 * reason: a champagne heart on a page of champagne rules is decoration.
 *
 * A signed-out press is not an error and shows none. It goes to sign-in and
 * comes back to the same listing; see useFavorites and authReturn.
 *
 * `aria-pressed` rather than swapping the label alone, so a screen reader
 * announces a toggle and its state, not two different buttons.
 */
const SaveButton = ({
  mls,
  address,
  variant = 'card',
  className = '',
}: {
  mls: string;
  /** For the accessible name. "this home" when the listing has none. */
  address?: string | null;
  variant?: 'card' | 'page';
  className?: string;
}) => {
  const { isSaved, toggle } = useFavorites();
  const saved = isSaved(mls);
  const what = address || 'this home';

  const onClick = (event: React.MouseEvent) => {
    // On a card this sits over a link. It is a sibling of that link rather than
    // inside it, so nothing bubbles into a navigation — but a press must also
    // not be read as one by anything listening further up.
    event.preventDefault();
    event.stopPropagation();
    void toggle(mls);
  };

  if (variant === 'page') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={pill(
          'outline',
          'sm',
          `${
            saved
              ? 'border-red-200 bg-red-50 text-red-800 hover:border-red-300 hover:bg-red-200 hover:text-red-900'
              : 'bg-white'
          } ${className}`
        )}
      >
        <Heart className={`h-4 w-4 ${saved ? 'fill-red-600 text-red-600' : ''}`} aria-hidden />
        {/* "Favorite", Kevin's word for it (2026-10-09). The list it fills is
            still called Saved homes, so the hidden text says where it went. */}
        {saved ? 'Favorited' : 'Favorite'}
        <span className="sr-only">
          {saved ? ` — ${what} is in your saved homes` : ` — save ${what}`}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${what} from your saved homes` : `Save ${what}`}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur-sm transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-champagne-ink ${className}`}
    >
      <Heart className={`h-5 w-5 ${saved ? 'fill-red-600 text-red-600' : ''}`} aria-hidden />
    </button>
  );
};

export default SaveButton;
