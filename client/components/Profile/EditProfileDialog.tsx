import { useState, useEffect, useRef } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { updateProfile, uploadAvatar } from '@/lib/blog-store';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg } from '@/lib/crop-image';

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
  const { toast } = useToast();

  // State for image cropping
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setDescription(profile.description || '');
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Reset crop on new image
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleImageCrop = async () => {
    if (imgRef.current && crop) {
      const croppedBlob = await getCroppedImg(imgRef.current, crop, 'avatar.jpeg');
      setCroppedImageBlob(croppedBlob);
      setImgSrc(''); // Close the cropper modal/view
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let newAvatarUrl: string | undefined = undefined;

      // 1. If a new image was cropped, upload it first
      if (croppedImageBlob) {
        const uploadedUrl = await uploadAvatar(croppedImageBlob as File, profile.id);
        if (!uploadedUrl) {
          throw new Error('Avatar could not be uploaded.');
        }
        newAvatarUrl = uploadedUrl;
      }

      // 2. Prepare profile data for update
      const updateData: { name: string; description: string; avatar_url?: string } = {
        name,
        description,
      };
      
      if (newAvatarUrl) {
        updateData.avatar_url = newAvatarUrl;
      }

      // 3. Send all updates to the server
      const updatedProfile = await updateProfile(updateData);

      onProfileUpdate(updatedProfile);
      toast({
        title: 'Success',
        description: 'Your profile has been updated.',
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setCroppedImageBlob(null); // Reset blob after saving
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        {imgSrc ? (
          // Image Cropper View
          <div className="flex flex-col items-center gap-4">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imgRef}
                alt="Crop me"
                src={imgSrc}
                style={{ maxHeight: '400px' }}
              />
            </ReactCrop>
            <div className="flex gap-2">
              <Button onClick={handleImageCrop}>Crop Image</Button>
              <Button variant="outline" onClick={() => setImgSrc('')}>Cancel</Button>
            </div>
          </div>
        ) : (
          // Profile Form View
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={croppedImageBlob ? URL.createObjectURL(croppedImageBlob) : profile.avatar_url || undefined} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
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
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};