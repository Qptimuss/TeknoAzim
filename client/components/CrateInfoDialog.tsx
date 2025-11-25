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
import { ImageIcon, Gem, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import NovaFrame from "@/components/frames/NovaFrame";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CrateInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userAvatarUrl?: string | null; // Yeni prop
  userName?: string | null; // Yeni prop
}

// Nadirlik seviyelerine göre iade miktarları
const REFUND_AMOUNTS: { [key: string]: number } = {
  [RARITIES.SIRADAN.name]: 5,
  [RARITIES.SIRADISI.name]: 10,
  [RARITIES.ENDER.name]: 15,
  [RARITIES.EFSANEVI.name]: 25,
  [RARITIES.ÖZEL.name]: 100,
};

export default function CrateInfoDialog({ open, onOpenChange, userAvatarUrl, userName }: CrateInfoDialogProps) {
  const framesByRarity = Object.values(RARITIES).map(rarity => ({
    ...rarity,
    items: FRAMES.filter(frame => frame.rarity === rarity.name),
  }));

  const AvatarPreview = ({ sizeClass = "h-16 w-16" }: { sizeClass?: string }) => (
    <Avatar className={sizeClass}>
      <AvatarImage src={userAvatarUrl || undefined} alt={userName || ''} />
      <AvatarFallback>
        <UserIcon className="h-4/6 w-4/6" />
      </AvatarFallback>
    </Avatar>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Çerçeve Sandığı İçerikleri ve Oranları</DialogTitle>
          <DialogDescription>
            Bu sandıktan çıkabilecek tüm çerçeveler, nadirlik oranları ve tekrar çıkması durumunda iade edilecek elmas miktarları aşağıda listelenmiştir.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            
            {/* Nadirlik ve İade Oranları */}
            <div>
              <h3 className="text-lg font-semibold mb-2">Nadirlik ve İade Oranları</h3>
              <div className="space-y-1 p-3 bg-muted rounded-lg border border-border">
                {Object.values(RARITIES).map(rarity => (
                  <div key={rarity.name} className="flex justify-between items-center text-sm">
                    <span className={cn("font-medium", rarity.color)}>{rarity.name} ({rarity.chance})</span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">İade:</span>
                      <span className="font-bold text-green-500 flex items-center gap-0.5">
                        {REFUND_AMOUNTS[rarity.name]} <Gem className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Çerçeve Listesi */}
            {framesByRarity.map(rarityGroup => (
              <div key={rarityGroup.name}>
                <h3 className={cn("text-lg font-semibold mb-4 flex items-baseline gap-2", rarityGroup.color)}>
                  <span>{rarityGroup.name} Çerçeveler</span>
                  <span className="text-sm font-normal text-muted-foreground">({rarityGroup.chance})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {rarityGroup.items.map(frame => (
                    <div key={frame.name} className="flex flex-col items-center gap-2">
                      <div className="w-24 h-24 flex items-center justify-center">
                        {frame.name === 'Nova' ? (
                          <NovaFrame>
                            <AvatarPreview />
                          </NovaFrame>
                        ) : (
                          <div className={cn("w-20 h-20 flex items-center justify-center", frame.className)}>
                            <AvatarPreview sizeClass="h-16 w-16" />
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