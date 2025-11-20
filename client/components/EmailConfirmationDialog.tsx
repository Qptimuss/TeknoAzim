import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>E-posta Adresinizi Doğrulayın</AlertDialogTitle>
          <AlertDialogDescription>
            E-posta adresinizi değiştirmek için <span className="font-bold text-foreground">{newEmail}</span> adresine bir doğrulama bağlantısı gönderdik.
            <br /><br />
            Lütfen değişikliği tamamlamak için gelen kutunuzu kontrol edin. Bağlantıyı bulamazsanız, tekrar göndermeyi deneyebilirsiniz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Kapat</AlertDialogCancel>
          <Button onClick={onResend} disabled={isResending}>
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              "Tekrar Gönder"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}