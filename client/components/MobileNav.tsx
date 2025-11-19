import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./ThemeToggle";

interface NavLink {
  to: string;
  label: string;
}

interface MobileNavProps {
  mainLinks: NavLink[];
  authLinks: NavLink[];
  logo: React.ReactNode;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function MobileNav({ mainLinks, authLinks, logo, onMouseEnter, onMouseLeave }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          // Arka planı her zaman şeffaf yapıyoruz.
          className="md:hidden h-auto p-2 flex items-center gap-2 text-foreground bg-transparent hover:bg-transparent transition-all duration-200 hover:-translate-y-0.5"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <Menu className="h-6 w-6" />
          <span className={cn("font-bakbak text-xl")}>
            Menü
          </span>
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-background p-4 h-auto bottom-auto rounded-br-lg flex flex-col">
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            {logo}
          </Link>
          <div className="flex flex-col gap-2">
            {mainLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-bakbak text-xl text-foreground hover:text-muted-foreground whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Separator className="my-2 bg-border h-0.5 rounded-full w-11/12 mx-auto" />
          <div className="flex flex-col gap-2">
            {authLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "font-bakbak text-xl text-foreground whitespace-nowrap",
                  "hover:text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-auto flex justify-end">
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}