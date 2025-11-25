import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, ImageIcon, Loader2, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import { RARITIES } from "@/lib/store-items";
import NovaFrame from "@/components/frames/NovaFrame";

interface WonFrame {
  name: string;
  rarity: string;
  className: string;
}

interface CrateOpeningDialogProps {
  open: boolean;
  onClose: () => void;
  isProcessing: boolean;
  wonFrame: WonFrame | null;
  alreadyOwned: boolean;
  refundAmount: number; // Yeni prop
}

export default function CrateOpeningDialog({ open, onClose, isProcessing, wonFrame, alreadyOwned, refundAmount }: CrateOpeningDialogProps) {
  const [clickCount, setClickCount] = useState(0);
  const [animationState, setAnimationState] = useState<"idle" | "shaking" | "opening" | "revealed">("idle");

  useEffect(() => {
    // Reset state when dialog is opened or closed
    if (open) {
      setClickCount(0);
      setAnimationState("idle");
    }
  }, [open]);

  useEffect(() => {
    if (clickCount === 3) {
      setAnimationState("opening");
      const timer = setTimeout(() => {
        setAnimationState("revealed");
      }, 500); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  }, [clickCount]);

  const handleCrateClick = () => {
    if (animationState === "idle" && clickCount < 3) {
      setClickCount(prev => prev + 1);
      setAnimationState("shaking");
      const timer = setTimeout(() => {
        setAnimationState("idle");
      }, 300); // Corresponds to animation duration
      return () => clearTimeout(timer);
    }
  };

  const rarityInfo = wonFrame ? Object.values(RARITIES).find(r => r.name === wonFrame.rarity) : null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] text-center">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-outfit">Sandık Açılıyor</DialogTitle>
        </DialogHeader>
        <div className="min-h-[300px] flex flex-col items-center justify-center p-6">
          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 animate-spin text-primary" />
              <p className="text-muted-foreground">İşlem doğrulanıyor...</p>
            </div>
          ) : wonFrame && animationState === "revealed" ? (
            <div className="flex flex-col items-center gap-4 animate-reveal-prize">
              <div className="w-32 h-32 flex items-center justify-center">
                {wonFrame.name === 'Nova' ? (
                  <NovaFrame>
                    <div className="w-28 h-28 flex items-center justify-center bg-background rounded-full">
                      <ImageIcon className="h-16 w-16 text-muted-foreground" />
                    </div>
                  </NovaFrame>
                ) : (
                  <div className={cn("w-32 h-32 flex items-center justify-center", wonFrame.className)}>
                    <ImageIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold">{wonFrame.name}</h3>
              {rarityInfo && (
                <p className={cn("font-semibold", rarityInfo.color)}>{rarityInfo.name}</p>
              )}
              {alreadyOwned && (
                <div className="text-center mt-2 p-2 bg-muted rounded-md border border-border">
                  <p className="text-sm text-muted-foreground">(Bu çerçeveye zaten sahipsin)</p>
                  <p className="text-sm font-semibold text-green-500 flex items-center justify-center gap-1">
                    +{refundAmount} <Gem className="h-4 w-4" /> Geri Verildi!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleCrateClick}
                disabled={animationState !== "idle"}
                className={cn(
                  "cursor-pointer transition-transform duration-200 hover:scale-110",
                  animationState === "shaking" && "animate-shake",
                  animationState === "opening" && "animate-open-crate"
                )}
              >
                <Gift className="h-32 w-32 text-primary" />
              </button>
              <p className="text-muted-foreground">
                {clickCount < 3 ? `Sandığı açmak için tıkla! (${clickCount}/3)` : "Açılıyor..."}
              </p>
            </div>
          )}
        </div>
        {animationState === "revealed" && (
          <DialogFooter>
            <Button onClick={onClose} className="w-full">Kapat</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}