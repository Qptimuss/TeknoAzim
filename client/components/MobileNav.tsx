import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

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
          className="md:hidden h-auto p-2 flex items-center gap-2 text-primary-foreground bg-transparent hover:bg-transparent transition-all duration-200 hover:-translate-y-0.5"
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
      <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-primary text-primary-foreground p-4 h-auto bottom-auto rounded-br-lg">
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            {logo}
          </Link>
          <div className="flex flex-col gap-2">
            {mainLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-bakbak text-xl text-primary-foreground hover:text-primary-foreground/80"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Separator className="my-2 bg-primary-foreground/20 h-0.5 rounded-full w-11/12 mx-auto" />
          <div className="flex flex-col gap-2">
            {authLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "font-bakbak text-xl text-primary-foreground",
                  "hover:text-primary-foreground/80"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}