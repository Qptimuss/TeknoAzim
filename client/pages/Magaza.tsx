import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Info, Gem } from "lucide-react";
import CrateInfoDialog from "@/components/CrateInfoDialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { RARITIES, FRAMES } from "@/lib/store-items";
import { supabase } from "@/integrations/supabase/client";
import CrateOpeningDialog from "@/components/CrateOpeningDialog";

const CRATE_COST = 10;

const selectRandomFrame = () => {
  const rand = Math.random() * 100;
  let selectedRarityName: string;

  if (rand < 1) selectedRarityName = RARITIES.ÖZEL.name; // 1% chance for Özel
  else if (rand < 6) selectedRarityName = RARITIES.EFSANEVI.name; // 5% chance for Efsanevi
  else if (rand < 21) selectedRarityName = RARITIES.ENDER.name; // 15% chance for Ender
  else if (rand < 51) selectedRarityName = RARITIES.SIRADISI.name; // 30% chance for Sıradışı
  else selectedRarityName = RARITIES.SIRADAN.name; // 49% chance for Sıradan

  const framesInRarity = FRAMES.filter(frame => frame.rarity === selectedRarityName);
  if (framesInRarity.length === 0) {
    // Fallback to common if for some reason no frames are found in the selected rarity
    const commonFrames = FRAMES.filter(frame => frame.rarity === RARITIES.SIRADAN.name);
    return commonFrames[Math.floor(Math.random() * commonFrames.length)];
  }
  return framesInRarity[Math.floor(Math.random() * framesInRarity.length)];
};

export default function Magaza() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [isCrateDialogOpen, setIsCrateDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wonFrame, setWonFrame] = useState<any | null>(null);
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  const handleOpenCrate = async () => {
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

    try {
      const frame = selectRandomFrame();
      
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles').select('gems, owned_frames').eq('id', user.id).single();

      if (fetchError || !currentProfile) throw new Error("Kullanıcı profili alınamadı.");
      if (currentProfile.gems < CRATE_COST) throw new Error("Yetersiz bakiye.");

      const newGems = currentProfile.gems - CRATE_COST;
      const currentFrames = currentProfile.owned_frames || [];
      const isOwned = currentFrames.includes(frame.name);
      const newFrames = isOwned ? currentFrames : [...currentFrames, frame.name];

      await updateUser({ gems: newGems, owned_frames: newFrames });

      setWonFrame(frame);
      setAlreadyOwned(isOwned);
    } catch (error) {
      toast.error("Bir hata oluştu", { description: error instanceof Error ? error.message : "Sandık açma işlemi başarısız." });
      setIsCrateDialogOpen(false);
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
              <Button className="w-full" onClick={handleOpenCrate} disabled={isProcessing}>
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