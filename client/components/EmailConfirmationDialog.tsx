import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmailConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  newEmail: string;
  onResend: () => void;
  isResending: boolean;
}

export default function EmailConfirmationDialog({
  open,
  onClose,
  newEmail,
  onResend,
  isResending,
}: EmailConfirmationDialogProps) {
  const handleRefreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error("Error refreshing session:", error);
      toast.error("Oturum yenilenirken hata oluştu. Lütfen tekrar giriş yapın.");
    } else if (data.session?.user?.email === newEmail) {
      toast.success("E-posta adresiniz başarıyla güncellendi!");
      onClose(); // Close the dialog after successful refresh
    } else {
      // The email might not have been updated in the session yet
      toast.info("Lütfen e-posta doğrulama bağlantısını tıkladığınızdan emin olun. Oturum yenilendi ancak e-posta henüz güncellenmemiş olabilir.");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>E-posta Adresinizi Doğrulayın</AlertDialogTitle>
          <AlertDialogDescription>
            E-posta adresinizi değiştirmek için <span className="font-bold text-foreground">{newEmail}</span> adresine bir doğrulama bağlantısı gönderdik.
            <br /><br />
            Lütfen değişikliği tamamlamak için gelen kutunuzu kontrol edin. Bağlantıyı bulamazsanız, tekrar göndermeyi deneyebilirsiniz.
            <br /><br />
            <span className="font-semibold">Doğrulama bağlantısını tıkladıysanız, oturumunuzu yenilemek için aşağıdaki butona tıklayın.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <Button onClick={onResend} disabled={isResending} variant="outline" className="flex-1">
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                "Tekrar Gönder"
              )}
            </Button>
            <Button onClick={handleRefreshSession} variant="default" className="flex-1">
              Oturumu Yenile
            </Button>
          </div>
          <AlertDialogCancel className="w-full">Kapat</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}