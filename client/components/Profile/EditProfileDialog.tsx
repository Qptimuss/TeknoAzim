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
import { toast } from 'sonner';
import { updateProfile, uploadAvatar } from '@/lib/blog-store';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { User as UserIcon, Loader2 } from 'lucide-react';
import ImageCropperDialog from '@/components/ImageCropperDialog';
import { useAuth } from '@/contexts/AuthContext';

interface EditProfileDialogProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileDialog = ({
  profile,
  isOpen,
  onClose,
}: EditProfileDialogProps) => {
  const { saveProfileDetails } = useAuth();
  const [name, setName] = useState(profile.name || '');
  const [description, setDescription] = useState(profile.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropping States
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setDescription(profile.description || '');
    }
  }, [profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) { // 4MB
        toast.error("Resim boyutu 4MB'den küçük olmalıdır.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const newUrl = URL.createObjectURL(file);
      setImageToCrop(newUrl);
      setIsCropperOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setIsCropperOpen(false);
    if (imageToCrop) URL.revokeObjectURL(imageToCrop);
    setImageToCrop(null);

    const croppedFile = new File([croppedBlob], `${profile.id}.jpeg`, { type: "image/jpeg" });
    
    await toast.promise(
      async () => {
        const uploadedUrl = await uploadAvatar(croppedFile, profile.id);
        if (uploadedUrl) {
          const cacheBustingUrl = `${uploadedUrl}?v=${Date.now()}`;
          await saveProfileDetails({ avatar_url: cacheBustingUrl });
        }
      },
      {
        loading: "Profil fotoğrafı yükleniyor...",
        success: "Profil fotoğrafı güncellendi!",
        error: (e) => {
          console.error("Avatar update failed:", e);
          return e.message || "Profil fotoğrafı güncellenirken bir hata oluştu.";
        },
      }
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sadece isim ve açıklama güncellemelerini gönder
      await saveProfileDetails({ name, description });

      toast.success('Profil başarıyla güncellendi.');
      onClose();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error('Profil güncellenirken hata oluştu.', {
        description: error.message || 'Lütfen tekrar deneyin.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Profili Düzenle</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.name || ''} />
                <AvatarFallback>
                  <UserIcon className="h-8 w-8" />
                </AvatarFallback>
              </Avatar>
              <Input 
                id="picture" 
                type="file" 
                accept="image/png, image/jpeg, image/gif" 
                onChange={handleFileChange} 
                ref={fileInputRef}
                className="file:text-foreground"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                İsim
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
                Açıklama
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3 min-h-[80px]"
                placeholder="Kısa bir açıklama..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                'Değişiklikleri Kaydet'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {imageToCrop && (
        <ImageCropperDialog
          imageSrc={imageToCrop}
          open={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            if (imageToCrop) URL.revokeObjectURL(imageToCrop);
            setImageToCrop(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
};