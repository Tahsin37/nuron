import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NotFoundLink {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  href: string;
}

export interface NotFoundProps {
  /** Custom error code to display */
  errorCode?: string;
  /** Main heading text */
  title?: string;
  /** Subtitle/description text */
  description?: string;
  /** Links to display below the main content */
  links?: NotFoundLink[];
  /** Handler for back button click */
  onBackClick?: () => void;
  /** Handler for home button click */
  onHomeClick?: () => void;
  /** Custom back button text */
  backButtonText?: string;
  /** Custom home button text */
  homeButtonText?: string;
  /** Show the grid background pattern */
  showBackground?: boolean;
  /** Additional CSS classes for the main container */
  className?: string;
  /** Children to render instead of default content */
  children?: ReactNode;
}

export function NotFound({
  errorCode = "404 error",
  title = "We can't find this page",
  description = "The page you are looking for doesn't exist or has been moved.",
  links = [],
  onBackClick,
  onHomeClick,
  backButtonText = "Go back",
  homeButtonText = "Go Home",
  showBackground = true,
  className,
  children,
}: NotFoundProps) {
  return (
    <main
      className={cn(
        "h-screen w-full flex items-start md:items-center justify-center py-16 px-4 md:py-24 md:px-20 bg-background text-foreground relative overflow-hidden",
        className
      )}
    >
      {/* Optional grid background - customized to fit Nuron AI style */}
      {showBackground && (
        <div className="absolute inset-0 z-0 opacity-[0.03] bg-[image:linear-gradient(to_right,var(--color-foreground),transparent_1px),linear-gradient(to_bottom,var(--color-foreground),transparent_1px)] [background-size:32px_32px] md:[background-size:48px_48px] [mask-image:radial-gradient(ellipse_60%_30%_at_50%_0%,black_0%,transparent_100%)] md:[mask-image:radial-gradient(ellipse_60%_50%_at_50%_20%,black_0%,transparent_100%)]" />
      )}
      
      {/* Nuron AI specific subtle glow */}
      <div className="absolute inset-0 pointer-events-none [background:radial-gradient(80%_60%_at_50%_30%,rgba(255,255,255,0.02),transparent_60%)]" />

      <section className="flex flex-col items-center gap-8 md:gap-16 z-10 w-full max-w-3xl">
        {children || (
          <>
            <div className="flex flex-col items-center gap-8 md:gap-12">
              <header className="flex flex-col items-center gap-4">
                <div>
                  <Badge
                    variant="outline"
                    className="px-2.5 py-1 text-sm font-medium border-border/50 bg-background/55 backdrop-blur"
                  >
                    <div className="size-2 bg-emerald-400 rounded-full mr-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    {errorCode}
                  </Badge>
                </div>
                <div className="flex flex-col items-center gap-4 md:gap-6">
                  <h1 className="text-center text-4xl md:text-6xl font-bold tracking-tight">
                    {title}
                  </h1>
                  <p className="text-center text-lg md:text-xl text-muted-foreground max-w-lg">
                    {description}
                  </p>
                </div>
              </header>
              <div className="flex gap-3 flex-col md:flex-row w-full items-center justify-center">
                <Button
                  className="w-full md:w-fit"
                  variant="outline"
                  onClick={onBackClick}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {backButtonText}
                </Button>
                <Button 
                  className="w-full md:w-fit bg-white text-black hover:bg-zinc-200" 
                  onClick={onHomeClick}
                >
                  {homeButtonText}
                </Button>
              </div>
            </div>

            {links.length > 0 && (
              <div className="flex flex-col w-full border border-border/50 rounded-2xl bg-card/30 backdrop-blur overflow-hidden">
                {links.map((link, i) => (
                  <Link
                    href={link.href}
                    key={link.title}
                    className={cn(
                      "p-5 md:p-6 flex items-start md:items-center gap-4 md:gap-5 flex-col md:flex-row hover:bg-muted/30 transition-colors group",
                      i !== links.length - 1 && "border-b border-border/50"
                    )}
                  >
                    <div className="border border-border/50 p-2.5 md:p-3 rounded-xl bg-background shadow-sm">
                      <link.icon className="size-5 md:size-6 text-foreground/80" />
                    </div>
                    <div className="flex gap-5 flex-1 w-full items-center">
                      <div className="flex flex-col gap-1">
                        <div className="text-base font-semibold group-hover:text-white transition-colors">
                          {link.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {link.subtitle}
                        </div>
                      </div>
                      <div className="self-center ml-auto">
                        <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform group-hover:text-white" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
