import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Info, Gem } from "lucide-react";
import CrateInfoDialog from "@/components/CrateInfoDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { openCrate } from "@/lib/profile-store";
import CrateOpeningDialog from "@/components/CrateOpeningDialog";
import { FRAMES, RARITIES } from "@/lib/store-items";

const CRATE_COST = 10;

// Helper to find the frame object based on the name returned from the server
const getFrameDetails = (frameName: string) => {
  const frame = FRAMES.find(f => f.name === frameName);
  if (!frame) return null;
  const rarity = RARITIES[Object.keys(RARITIES).find(key => RARITIES[key as keyof typeof RARITIES].name === frame.rarity) as keyof typeof RARITIES];
  return {
    ...frame,
    rarity: rarity.name,
    className: frame.className,
  };
};

export default function Magaza() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { user, mergeProfileState } = useAuth(); 
  const navigate = useNavigate();
  
  const [isCrateDialogOpen, setIsCrateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wonFrame, setWonFrame] = useState<any | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  const handleOpenCrate = async () => {
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

    if (user.gems < CRATE_COST) {
      toast.error("Yetersiz Bakiye", {
        description: `Sandığı açmak için ${CRATE_COST} geme ihtiyacın var. Sende ${user.gems} gem var.`,
      });
      return;
    }

    setIsCrateDialogOpen(true);
    setIsProcessing(true);
    setWonFrame(null);
    setAlreadyOwned(false);

    try {
      // Use the secure server API to open the crate
      const { updatedProfile, itemWon } = await openCrate(CRATE_COST);
      
      // Check if the item won was a frame or a gem refund
      const isGemRefund = itemWon.includes("Gem");
      
      if (isGemRefund) {
        setWonFrame(getFrameDetails(updatedProfile.selected_frame || 'Nova')); // Mock frame for display if refund
        setAlreadyOwned(true);
      } else {
        const frameDetails = getFrameDetails(itemWon);
        setWonFrame(frameDetails);
        setAlreadyOwned(user.owned_frames?.includes(itemWon) ?? false);
      }

      // Securely merge the updated profile state (gems, owned_frames) into the context
      mergeProfileState(updatedProfile);

    } catch (e) {
      setIsCrateDialogOpen(false);
      toast.error("Sandık açılırken bir hata oluştu.", {
        description: e instanceof Error ? e.message : "Lütfen tekrar deneyin.",
      });
    } finally {
      setIsProcessing(false);
    }
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
          {!user && (
            <p className="text-sm text-muted-foreground mt-2 bg-muted p-3 rounded-lg border border-border inline-block">
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
              <Button className="w-full" onClick={handleOpenCrate} disabled={isProcessing || !user}>
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
      <CrateInfoDialog open={isInfoOpen} onOpenChange={setIsInfoOpen} />
      <CrateOpeningDialog
        open={isCrateDialogOpen}
        onClose={handleCloseDialog}
        isProcessing={isProcessing}
        wonFrame={wonFrame}
        alreadyOwned={alreadyOwned}
      />
    </>
  );
}