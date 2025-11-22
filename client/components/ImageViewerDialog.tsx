import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User as UserIcon } from "lucide-react";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null | undefined;
  imageAlt: string;
}

export default function ImageViewerDialog({ open, onOpenChange, imageUrl, imageAlt }: ImageViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none max-w-fit w-auto h-auto">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        ) : (
          <div className="w-[50vh] h-[50vh] max-w-[90vw] max-h-[90vw] bg-muted rounded-lg flex items-center justify-center shadow-2xl">
            <UserIcon className="h-1/2 w-1/2 text-muted-foreground" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}