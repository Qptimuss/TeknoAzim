import { useState, useEffect, useRef } from 'react';
import Cropper, { Area, Point } from 'react-easy-crop';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Profile } from '@shared/api';
import { toast } from 'sonner'; // Using sonner instead of shadcn toast
import { updateProfile, uploadAvatar } from '@/lib/blog-store';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { getCroppedImage } from '@/lib/image-utils'; // Use existing utility

interface EditProfileDialogProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: (updatedProfile: Profile) => void;
}

export const EditProfileDialog = ({
  profile,
  isOpen,
  onClose,
  onProfileUpdate,
}: EditProfileDialogProps) => {
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description || '');
  const [isSaving, setIsSaving] = useState(false);

  // State for image cropping
  const [imgSrc, setImgSrc] = useState('');
  // Crop state should be of type Point (x, y) for the center of the crop area
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 }); 
  const [zoom, setZoom] = useState(1); // Add zoom state
  const [rotation, setRotation] = useState(0); // Add rotation state
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null); // Not strictly needed for react-easy-crop, but kept for context

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setDescription(profile.description || '');
    }
  }, [profile]);

  const onCropAreaChange = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop({ x: 0, y: 0 }); // Reset crop on new image
      setZoom(1);
      setRotation(0);
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleImageCrop = async () => {
    if (!croppedAreaPixels) return;
    
    try {
      const croppedBlob = await getCroppedImage(
        imgSrc,
        croppedAreaPixels,
        rotation,
      );

      if (croppedBlob) {
        setCroppedImageBlob(croppedBlob);
        setImgSrc(''); // Close the cropper view
      } else {
        throw new Error('Cropping failed.');
      }
    } catch (e) {
      console.error('Error during cropping:', e);
      toast.error('Resim kırpılırken bir hata oluştu.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let newAvatarUrl: string | undefined = undefined;

      // 1. If a new image was cropped, upload it first
      if (croppedImageBlob) {
        // We need to convert Blob to File for uploadAvatar
        const croppedFile = new File([croppedImageBlob], `${profile.id}.jpeg`, { type: "image/jpeg" });
        const uploadedUrl = await uploadAvatar(croppedFile, profile.id);
        if (!uploadedUrl) {
          throw new Error('Avatar could not be uploaded.');
        }
        newAvatarUrl = uploadedUrl;
      }

      // 2. Prepare profile data for update
      const updateData: { name: string; description: string; avatar_url?: string } = {
        name: name || '', // Ensure name is not null if required
        description,
      };
      
      if (newAvatarUrl) {
        updateData.avatar_url = newAvatarUrl;
      }

      // 3. Send all updates to the server
      const updatedProfile = await updateProfile(updateData);

      onProfileUpdate(updatedProfile);
      toast.success('Profiliniz başarıyla güncellendi.');
      onClose();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error('Profil güncellenirken hata oluştu.', {
        description: error.message || 'Lütfen tekrar deneyin.',
      });
    } finally {
      setIsSaving(false);
      setCroppedImageBlob(null); // Reset blob after saving
    }
  };

  const handleClose = () => {
    // Reset cropping state when closing
    setImgSrc('');
    setCroppedImageBlob(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Profili Düzenle</DialogTitle>
        </DialogHeader>

        {imgSrc ? (
          // Image Cropper View
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full h-64 bg-muted">
              <Cropper
                image={imgSrc}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                onCropComplete={onCropAreaChange}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImageCrop}>Kırp</Button>
              <Button variant="outline" onClick={() => setImgSrc('')}>İptal</Button>
            </div>
          </div>
        ) : (
          // Profile Form View
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={croppedImageBlob ? URL.createObjectURL(croppedImageBlob) : profile.avatar_url || undefined} />
                <AvatarFallback>{name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                İsim
              </Label>
              <Input
                id="name"
                value={name || ''}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          {!imgSrc && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};