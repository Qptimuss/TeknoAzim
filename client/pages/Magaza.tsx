import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Info } from "lucide-react";
import CrateInfoDialog from "@/components/CrateInfoDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Magaza() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleOpenCrate = () => {
    if (!user) {
      toast.error("Önce giriş yapmanız gerekiyor.", {
        description: "Sandığı açmak ve diğer mağaza özelliklerini kullanmak için lütfen giriş yapın.",
        action: {
          label: "Giriş Yap",
          onClick: () => navigate('/giris'),
        },
      });
      return;
    }
    // TODO: Implement crate opening logic for logged-in users
    toast.info("Sandık açma özelliği yakında geliyor!");
  };

  return (
    <>
      <div className="container mx-auto px-5 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold">
            Mağaza
          </h1>
          {!user && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg border border-border">
              Mağazayı kullanabilmek için giriş yapmanız gerekmektedir.
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="w-full flex flex-col transition-all hover:border-primary hover:scale-105 relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-muted-foreground hover:text-foreground"
              onClick={() => setIsInfoOpen(true)}
            >
              <Info className="h-5 w-5" />
              <span className="sr-only">Sandık Bilgisi</span>
            </Button>
            <CardHeader className="items-center text-center">
              <Gift className="h-24 w-24 text-primary" />
            </CardHeader>
            <CardContent className="flex-grow text-center">
              <CardTitle className="font-outfit text-2xl">Çerçeve Sandığı</CardTitle>
              <CardDescription className="mt-2">
                Profil fotoğrafın için özel çerçeveler kazanma şansı yakala!
              </CardDescription>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleOpenCrate}>
                Sandığı Aç {user ? "(Yakında)" : ""}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <CrateInfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
    </>
  );
}