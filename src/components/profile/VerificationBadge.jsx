import React from 'react';
import { BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function VerificationBadge({ isVerified, size = "default" }) {
  if (!isVerified) return null;

  const sizeClasses = {
    small: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1",
    large: "text-base px-4 py-2"
  };

  const iconSizes = {
    small: "w-3 h-3",
    default: "w-4 h-4",
    large: "w-5 h-5"
  };

  return (
    <Badge 
      className={`bg-blue-100 text-blue-700 border-blue-300 flex items-center gap-1 ${sizeClasses[size]}`}
    >
      <BadgeCheck className={iconSizes[size]} />
      Verified
    </Badge>
  );
}