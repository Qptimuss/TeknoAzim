import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavLink {
  to: string;
  label: string;
}

interface MobileNavProps {
  mainLinks: NavLink[];
  authLinks: NavLink[];
  logo: React.ReactNode;
}

export function MobileNav({ mainLinks, authLinks, logo }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6 text-black" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] sm:w-[300px] bg-[#e6e6e6] p-4">
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-2">
            {logo}
          </Link>
          <div className="flex flex-col gap-2">
            {mainLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="font-bakbak text-xl text-[#090a0c] hover:text-gray-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t pt-4 mt-4">
            {authLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "font-bakbak text-xl",
                  link.to === "/giris" ? "text-black" : "text-[#090a0c]",
                  "hover:text-gray-700"
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