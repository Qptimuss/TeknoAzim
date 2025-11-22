import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string;
  imageAlt: string;
}

export default function ImageViewerDialog({ open, onOpenChange, imageUrl, imageAlt }: ImageViewerDialogProps) {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 bg-transparent border-none max-w-4xl w-auto h-auto flex items-center justify-center">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </DialogContent>
    </Dialog>
  );
}