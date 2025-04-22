
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

export function UserAvatar() {
  const { user, avatarUrl, avatarInitials } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Avatar className="h-8 w-8">
      {avatarUrl && <AvatarImage src={avatarUrl} alt="User avatar" />}
      <AvatarFallback className="bg-[#1a1a1a] text-white">
        {avatarInitials || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
