import Link from "next/link";

interface TopAppBarProps {
  variant?: "home" | "checkout" | "subpage";
  title?: string;
  backHref?: string;
}

// TopAppBar (Stitch JSON) — three variants: "home" (menu-left, wordmark
// center, search-right), "checkout" (menu-left, wordmark center,
// notifications-right — fixed, not sticky), "subpage" (back-arrow left,
// centered title, spacer right).
export default function TopAppBar({ variant = "home", title, backHref }: TopAppBarProps) {
  if (variant === "subpage") {
    return (
      <header className="sticky top-0 z-50 flex items-center justify-between px-margin-mobile h-touch-target-min w-full bg-primary-container text-on-primary-container border-b border-outline-variant">
        <Link
          href={backHref ?? "/"}
          aria-label="Go back"
          className="text-on-primary-container hover:bg-on-primary-fixed-variant p-2 rounded-full transition-colors flex items-center justify-center w-10 h-10 -ml-2"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="font-headline-sm text-headline-sm flex-1 text-center font-bold tracking-tight">{title}</div>
        <div className="w-10 h-10" />
      </header>
    );
  }

  if (variant === "checkout") {
    return (
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-mobile h-touch-target-min bg-primary-container border-b border-outline-variant">
        <Link
          href="/cart"
          aria-label="Go back"
          className="text-on-primary-fixed-variant hover:bg-surface-container-high rounded-full w-touch-target-min h-touch-target-min flex items-center justify-center opacity-80 transition-opacity duration-150"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-on-primary">VOLTECH</div>
        <Link
          href="/account/notifications"
          aria-label="Notifications"
          className="text-on-primary-fixed-variant hover:bg-surface-container-high rounded-full w-touch-target-min h-touch-target-min flex items-center justify-center opacity-80 transition-opacity duration-150"
        >
          <span className="material-symbols-outlined">notifications</span>
        </Link>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-margin-mobile h-14 w-full bg-primary-container text-on-primary-container border-b border-outline-variant">
      <button type="button" aria-label="Open menu" className="active:scale-95 duration-75 p-2 rounded-full hover:bg-surface-container-highest transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined">menu</span>
      </button>
      <Link href="/" className="font-display text-display font-black tracking-tighter text-on-primary-container">
        VOLTECH
      </Link>
      <Link href="/search" aria-label="Search" className="active:scale-95 duration-75 p-2 rounded-full hover:bg-surface-container-highest transition-colors flex items-center justify-center">
        <span className="material-symbols-outlined">search</span>
      </Link>
    </header>
  );
}
