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
import { LogOut, User, MessageSquare, Home, ClipboardList, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileDropdownProps {
  onItemClick?: () => void;
  align?: "start" | "center" | "end";
}

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

  const handleOpenHouseClick = () => {
    navigate("/open-house");
    onItemClick?.();
  };

  const handleFollowUpClick = () => {
    navigate("/admin/follow-up");
    onItemClick?.();
  };

  const handlePropertiesClick = () => {
    navigate("/admin/properties");
    onItemClick?.();
  };

  const handleCRMClick = () => {
    navigate("/crm");
    onItemClick?.();
  };

  const handleSignOutClick = () => {
    onItemClick?.();
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl || undefined} alt={user.email || ""} />
            <AvatarFallback>
              {avatarInitials || user.email?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align={align} forceMount>
        <DropdownMenuItem onClick={handleProfileClick}>
          <User className="mr-2 h-4 w-4" />
          <span>PROFILE</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleOpenHouseClick}>
          <ClipboardList className="mr-2 h-4 w-4" />
          <span>OPEN HOUSE SIGN IN</span>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCRMClick}>
              <Briefcase className="mr-2 h-4 w-4" />
              <span>CRM</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleFollowUpClick} className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>FOLLOW UP</span>
              </div>
              {unreadCounts.total > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCounts.total}
                </Badge>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePropertiesClick}>
              <Home className="mr-2 h-4 w-4" />
              <span>MANAGE PROPERTIES</span>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoading}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isLoading ? "SIGNING OUT..." : "SIGN OUT"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}