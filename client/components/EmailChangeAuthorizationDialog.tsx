import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface EmailChangeAuthorizationDialogProps {
  open: boolean;
  onClose: () => void;
  currentEmail: string;
}

export default function EmailChangeAuthorizationDialog({
  open,
  onClose,
  currentEmail,
}: EmailChangeAuthorizationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Değişikliği Onaylayın</AlertDialogTitle>
          <AlertDialogDescription>
            Güvenliğiniz için, bu değişikliği onaylamak üzere mevcut e-posta adresinize <span className="font-bold text-foreground">{currentEmail}</span> bir doğrulama bağlantısı gönderdik.
            <br /><br />
            Lütfen gelen kutunuzu kontrol edin ve bağlantıya tıklayın. Bu adımdan sonra yeni adresinize son bir onay e-postası daha gönderilecektir.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Anladım</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}