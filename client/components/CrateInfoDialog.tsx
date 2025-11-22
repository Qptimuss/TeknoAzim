import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RARITIES, FRAMES } from "@/lib/store-items";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import NovaFrame from "./frames/NovaFrame";

interface CrateInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CrateInfoDialog({ open, onOpenChange }: CrateInfoDialogProps) {
  const framesByRarity = Object.values(RARITIES).map(rarity => ({
    ...rarity,
    items: FRAMES.filter(frame => frame.rarity === rarity.name),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Çerçeve Sandığı İçerikleri</DialogTitle>
          <DialogDescription>
            Bu sandıktan çıkabilecek tüm çerçeveler ve nadirlik oranları aşağıda listelenmiştir.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Nadirlik Oranları</h3>
              <div className="space-y-1">
                {Object.values(RARITIES).map(rarity => (
                  <div key={rarity.name} className="flex justify-between items-center text-sm">
                    <span className={cn("font-medium", rarity.color)}>{rarity.name}</span>
                    <span className="text-muted-foreground">{rarity.chance}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {framesByRarity.map(rarityGroup => (
              <div key={rarityGroup.name}>
                <h3 className={cn("text-lg font-semibold mb-4", rarityGroup.color)}>
                  {rarityGroup.name} Çerçeveler
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {rarityGroup.items.map(frame => (
                    <div key={frame.name} className="flex flex-col items-center gap-2">
                      <div className="w-24 h-24 flex items-center justify-center">
                        {frame.name === 'Nova' ? (
                          <div className="w-20 h-20">
                            <NovaFrame animated={false}>
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            </NovaFrame>
                          </div>
                        ) : (
                          <div className={cn("w-20 h-20 flex items-center justify-center", frame.className)}>
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center font-medium">{frame.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}