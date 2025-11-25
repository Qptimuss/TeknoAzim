import { Link } from "react-router-dom";
import { Construction, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";

export default function Duyurular() {
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-5 py-20 text-center">
      <div className="max-w-4xl w-full">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-outfit font-bold">
            Duyurular
          </h1>
          {isUserAdmin && (
            <Button asChild className="flex items-center gap-2">
              <Link to="/duyuru-olustur">
                <Plus className="h-4 w-4" />
                Duyuru Oluştur
              </Link>
            </Button>
          )}
        </div>
        
        <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Construction className="h-16 w-16 text-yellow-500 mx-auto mb-6 animate-pulse" />
          <p className="text-muted-foreground text-lg md:text-xl font-roboto font-normal leading-relaxed">
            Bu bölüm geliştirilme aşamasındadır. Yakında güncel duyurulara buradan ulaşabileceksiniz.
          </p>
        </div>
      </div>
    </div>
  );
}