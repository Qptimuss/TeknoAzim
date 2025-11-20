import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw } from 'lucide-react';
import { getCroppedImage } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

interface ImageCropperDialogProps {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

export default function ImageCropperDialog({
  imageSrc,
  open,
  onClose,
  onCropComplete,
}: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number[]) => {
    setZoom(zoom[0]);
  }, []);

  const onRotationChange = useCallback((rotation: number[]) => {
    setRotation(rotation[0]);
  }, []);

  const onCropAreaChange = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;
    setIsCropping(true);
    try {
      const croppedBlob = await getCroppedImage(
        imageSrc,
        croppedAreaPixels,
        rotation,
      );

      if (croppedBlob) {
        onCropComplete(croppedBlob);
        // Kırpma başarılıysa Dialog'u kapatmak için onCropComplete'in çağrılmasından sonra onClose'u çağırıyoruz.
        onClose();
      } else {
        throw new Error('Cropping failed.');
      }
    } catch (e) {
      console.error('Error during cropping:', e);
      onClose();
    } finally {
      setIsCropping(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Profil Fotoğrafını Kırp</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <div className="relative h-80 w-full bg-muted rounded-md overflow-hidden">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1} // Square aspect ratio for avatar
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onRotationChange={onRotationChange}
              onCropComplete={onCropAreaChange}
              cropShape="round"
              showGrid={false}
              classes={{
                containerClassName: cn("!bg-muted"),
              }}
            />
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-12 shrink-0">Yakınlaştır:</span>
              <Slider
                min={1}
                max={3}
                step={0.1}
                value={[zoom]}
                onValueChange={onZoomChange}
                className="flex-1"
              />
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground w-12 shrink-0">Döndür:</span>
              <Slider
                min={0}
                max={360}
                step={1}
                value={[rotation]}
                onValueChange={onRotationChange}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="shrink-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button onClick={handleClose} variant="outline">
            İptal
          </Button>
          <Button onClick={handleCrop} disabled={isCropping || !croppedAreaPixels}>
            {isCropping ? 'Kırpılıyor...' : 'Kırp ve Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}