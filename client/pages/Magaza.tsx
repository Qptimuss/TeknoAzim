import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Info, Gem } from "lucide-react";
import CrateInfoDialog from "@/components/CrateInfoDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CrateOpeningDialog from "@/components/CrateOpeningDialog";
import { openCrate } from "@/lib/profile-store";
import { useMutation } from "@tanstack/react-query";

const CRATE_COST = 10;

export default function Magaza() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { user, updateUser, isSessionRefreshing } = useAuth();
  const navigate = useNavigate();
  
  const [isCrateDialogOpen, setIsCrateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false); // For animation control
  const [wonFrame, setWonFrame] = useState<any | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [refundAmount, setRefundAmount] = useState(0);

  const crateMutation = useMutation({
    mutationFn: () => openCrate(CRATE_COST),
    onSuccess: ({ updatedProfile, itemWon, alreadyOwned, refundAmount }) => {
      updateUser(updatedProfile);
      setWonFrame(itemWon);
      setAlreadyOwned(alreadyOwned);
      setRefundAmount(refundAmount);
    },
    onError: (error: Error) => {
      toast.error("Bir hata oluştu", { description: error.message });
      setIsCrateDialogOpen(false);
    },
    onSettled: () => {
      setIsProcessing(false); // Stop animation processing
    },
  });

  const handleOpenCrate = () => {
    if (!user) {
      toast.error("Önce giriş yapmanız gerekiyor.", {
        action: { label: "Giriş Yap", onClick: () => navigate('/giris') },
      });
      return;
    }

    if (user.gems < CRATE_COST) {
      toast.error("Yetersiz Bakiye", {
        description: `Sandığı açmak için ${CRATE_COST} elmasa ihtiyacın var. Sende ${user.gems} elmas var.`,
      });
      return;
    }

    setIsCrateDialogOpen(true);
    setIsProcessing(true);
    setWonFrame(null);
    setAlreadyOwned(false);
    setRefundAmount(0);

    crateMutation.mutate();
  };

  const handleCloseDialog = () => {
    setIsCrateDialogOpen(false);
  };

  return (
    <>
      <div className="container mx-auto px-5 py-12">
        <div className="mb-8">
          <h1 className="text-foreground text-4xl md:text-5xl font-outfit font-bold">
            Mağaza
          </h1>
          <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-2">
              <Gem className="h-5 w-5 text-green-500" />
              Nasıl Elmas Kazanırım?
            </h2>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>Her 24 saatte bir giriş yaptığında: <span className="font-bold text-foreground">+20 Elmas</span></li>
              <li>Her yeni rozet kazandığında: <span className="font-bold text-foreground">+30 Elmas</span></li>
              <li className="flex items-center">
                Zaten sahip olduğun bir çerçeve sandıktan çıktığında: 
                <span className="font-bold text-foreground ml-1">Nadirliğe göre Elmas iadesi</span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 p-0 ml-2 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsInfoOpen(true)}
                >
                  <Info className="h-4 w-4" />
                  <span className="sr-only">Görmek için tıkla</span>
                </Button>
              </li>
            </ul>
          </div>
          {!user && (
            <p className="text-sm text-muted-foreground mt-4 bg-muted p-3 rounded-lg border border-border inline-block">
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
              <Button className="w-full" onClick={handleOpenCrate} disabled={crateMutation.isPending || isSessionRefreshing}>
                <div className="flex items-center justify-center gap-2">
                  <span>Sandığı Aç</span>
                  <div className="flex items-center gap-1 bg-background/20 rounded-full px-2 py-0.5">
                    <span>{CRATE_COST}</span>
                    <Gem className="h-4 w-4 text-green-300" />
                  </div>
                </div>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <CrateInfoDialog 
        open={isInfoOpen} 
        onOpenChange={setIsInfoOpen} 
        userAvatarUrl={user?.avatar_url}
        userName={user?.name}
      />
      <CrateOpeningDialog
        open={isCrateDialogOpen}
        onClose={handleCloseDialog}
        isProcessing={isProcessing}
        wonFrame={wonFrame}
        alreadyOwned={alreadyOwned}
        refundAmount={refundAmount}
      />
    </>
  );
}