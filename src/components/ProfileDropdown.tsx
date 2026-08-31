import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnreadCounts } from "@/hooks/useUnreadCounts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User, Briefcase, LayoutDashboard } from "lucide-react";

interface ProfileDropdownProps {
  onItemClick?: () => void;
  align?: "start" | "center" | "end";
}

/** One row treatment, matching the navbar panel links. */
const ITEM =
  "flex w-full cursor-pointer items-center rounded-lg px-3 py-2 text-sm uppercase tracking-wide text-ink transition-colors focus:bg-bone focus:text-champagne-ink data-[highlighted]:bg-bone data-[highlighted]:text-champagne-ink";

export default function ProfileDropdown({ onItemClick, align = "end" }: ProfileDropdownProps) {
  const { user, signOut, avatarUrl, avatarInitials, isAdmin } = useAuth();
  const { unreadCounts } = useUnreadCounts();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      onItemClick?.();
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
    onItemClick?.();
  };



  const handleAdminClick = () => {
    navigate("/admin");
    onItemClick?.();
  };

  const handleCRMClick = () => {
    navigate("/crm");
    onItemClick?.();
  };


  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full p-0 transition-transform duration-200 ease-out hover:scale-[1.04] hover:bg-transparent focus-visible:ring-2 focus-visible:ring-champagne focus-visible:ring-offset-2"
        >
          {/* The champagne ring is what ties the avatar to the rest of the
              chrome; without it this was the one round grey element on the
              bar. */}
          <Avatar className="h-10 w-10 ring-1 ring-champagne/50">
            <AvatarImage src={avatarUrl || undefined} alt={user.email || ""} />
            <AvatarFallback className="bg-ink-deep text-sm font-semibold text-champagne">
              {avatarInitials || user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      {/*
        Matches the navbar's own dropdown panels (PANEL / PANEL_INNER in
        Navbar.tsx): white card, rounded-xl, hairline border, and rows that go
        bone + champagne-ink on hover. It was stock shadcn — the one menu on the
        site that looked like no other menu on the site.
      */}
      <DropdownMenuContent
        className="w-60 rounded-xl border-gray-200 p-1.5 shadow-lg"
        align={align}
        forceMount
      >
        <div className="px-3 pb-2 pt-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
            Signed in
          </p>
          <p className="truncate text-sm text-ink">{user.email}</p>
        </div>

        <DropdownMenuSeparator className="bg-gray-200" />

        <DropdownMenuItem onClick={handleProfileClick} className={ITEM}>
          <User className="mr-2.5 h-4 w-4" aria-hidden />
          <span>Profile</span>
        </DropdownMenuItem>

        {isAdmin && (
          <>
            {/*
              Every tool — Follow Up, Properties, Lockboxes and both sign-in
              kiosks — is one click into /admin now. The unread badge comes
              along so nothing is lost by not listing them here.
            */}
            <DropdownMenuItem
              onClick={handleAdminClick}
              className={`${ITEM} justify-between`}
            >
              <span className="flex items-center">
                <LayoutDashboard className="mr-2.5 h-4 w-4" aria-hidden />
                Admin
              </span>
              {unreadCounts.total > 0 && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                  {unreadCounts.total}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </DropdownMenuItem>

            {/* CRM keeps its own entry: it is a destination, not a desk tool. */}
            <DropdownMenuItem onClick={handleCRMClick} className={ITEM}>
              <Briefcase className="mr-2.5 h-4 w-4" aria-hidden />
              <span>CRM</span>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="bg-gray-200" />

        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading} className={ITEM}>
          <LogOut className="mr-2.5 h-4 w-4" aria-hidden />
          <span>{isLoading ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
