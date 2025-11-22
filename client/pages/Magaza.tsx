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

const CRATE_COST = 10;

// Helper function to select a random frame based on rarity
const selectRandomFrame = () => {
  const rand = Math.random() * 100;
  let selectedRarityName: string;

  if (rand < 50) { // 50% chance for Sıradan
    selectedRarityName = RARITIES.SIRADAN.name;
  } else if (rand < 80) { // 30% chance for Sıradışı
    selectedRarityName = RARITIES.SIRADISI.name;
  } else if (rand < 95) { // 15% chance for Ender
    selectedRarityName = RARITIES.ENDER.name;
  } else { // 5% chance for Efsanevi
    selectedRarityName = RARITIES.EFSANEVI.name;
  }

  const framesInRarity = FRAMES.filter(frame => frame.rarity === selectedRarityName);
  
  // Fallback to common if no frames for a given rarity exist, to prevent errors
  if (framesInRarity.length === 0) {
    const commonFrames = FRAMES.filter(frame => frame.rarity === RARITIES.SIRADAN.name);
    return commonFrames[Math.floor(Math.random() * commonFrames.length)];
  }

  const randomFrameIndex = Math.floor(Math.random() * framesInRarity.length);
  return framesInRarity[randomFrameIndex];
};

export default function Magaza() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isOpening, setIsOpening] = useState(false);

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

    setIsOpening(true);

    await toast.promise(
      async () => {
        // 1. Select a random frame
        const wonFrame = selectRandomFrame();

        // 2. Get current user data to ensure atomicity
        const { data: currentProfile, error: fetchError } = await supabase
          .from('profiles')
          .select('gems, owned_frames')
          .eq('id', user.id)
          .single();

        if (fetchError || !currentProfile) {
          throw new Error("Kullanıcı profili alınamadı.");
        }

        if (currentProfile.gems < CRATE_COST) {
          throw new Error("Yetersiz bakiye.");
        }

        // 3. Prepare update payload
        const newGems = currentProfile.gems - CRATE_COST;
        const currentFrames = currentProfile.owned_frames || [];
        
        const alreadyOwned = currentFrames.includes(wonFrame.name);
        const newFrames = alreadyOwned ? currentFrames : [...currentFrames, wonFrame.name];

        // 4. Update the database and then the local state via updateUser
        await updateUser({ gems: newGems, owned_frames: newFrames });

        return { wonFrame, alreadyOwned };
      },
      {
        loading: "Sandık açılıyor...",
        success: ({ wonFrame, alreadyOwned }) => {
          setIsOpening(false);
          if (alreadyOwned) {
            return `"${wonFrame.name}" (${wonFrame.rarity}) kazandın, ama zaten sende vardı!`;
          }
          return `Tebrikler! Yeni bir çerçeve kazandın: "${wonFrame.name}" (${wonFrame.rarity})!`;
        },
        error: (err) => {
          setIsOpening(false);
          // Refresh user data in case of error to sync gems
          updateUser({});
          return err.message || "Sandık açılırken bir hata oluştu.";
        },
      }
    );
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
              <Button className="w-full" onClick={handleOpenCrate} disabled={isOpening}>
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
    </>
  );
}