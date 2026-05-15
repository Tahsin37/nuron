"use client";

import { NotFound, NotFoundLink } from "@/components/ui/not-found-1";
import { BookOpen, LayoutDashboard, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const notFoundLinks: NotFoundLink[] = [
  {
    title: "Dashboard",
    subtitle: "Manage your AI employees",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Documentation",
    subtitle: "Learn how to train your AI agents",
    icon: BookOpen,
    href: "#docs",
  },
  {
    title: "Support",
    subtitle: "Get help from our human team",
    icon: MessageCircle,
    href: "#support",
  },
];

export default function GlobalNotFound() {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  const handleHomeClick = () => {
    router.push("/");
  };

  return (
    <NotFound
      errorCode="404"
      title="Page Not Found"
      description="The page you are looking for doesn't exist, has been moved, or you don't have access to it."
      links={notFoundLinks}
      onBackClick={handleBackClick}
      onHomeClick={handleHomeClick}
    />
  );
}
