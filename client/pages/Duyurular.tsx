import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Construction, Plus, Calendar, Pencil, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isAdmin } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { getAnnouncements, deleteAnnouncement } from "@/lib/announcement-store";
import { Announcement } from "@shared/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Duyurular() {
  const { user } = useAuth();
  const isUserAdmin = isAdmin(user);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
      setError(null);
    } catch (e) {
      setError("Duyurular yüklenirken bir hata oluştu.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleDeleteConfirm = async () => {
    if (!announcementToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnnouncement(announcementToDelete);
      toast.success("Duyuru başarıyla silindi.");
      // Listeyi yeniden çekmek yerine yerel olarak güncelleyelim
      setAnnouncements(prev => prev.filter(a => a.id !== announcementToDelete));
    } catch (error) {
      toast.error("Duyuru silinirken bir hata oluştu.");
      console.error(error);
    } finally {
      setIsDeleting(false);
      setAnnouncementToDelete(null);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="p-6">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-20 w-full" />
            </Card>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-red-500 text-lg">{error}</p>
        </div>
      );
    }

    if (announcements.length === 0) {
      return (
        <div className="bg-card border border-border rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
          <Construction className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
          <p className="text-muted-foreground text-lg md:text-xl font-roboto font-normal leading-relaxed">
            Henüz yayınlanmış bir duyuru bulunmamaktadır.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="w-full relative">
            {isUserAdmin && (
              <div className="absolute top-4 right-4 flex gap-2 z-10">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                  <Link to={`/duyuru/${announcement.id}/duzenle`} title="Düzenle">
                    <Pencil className="h-4 w-4" />
                  </Link>
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setAnnouncementToDelete(announcement.id)}
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl font-outfit">{announcement.title}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{new Date(announcement.created_at).toLocaleDateString("tr-TR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</span>
              </div>
            </CardHeader>
            <Separator className="mx-6 w-auto" />
            <CardContent className="pt-6">
              <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-5 py-20 text-center">
        <div className="max-w-4xl w-full">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-foreground text-4xl md:text-5xl lg:text-6xl font-outfit font-bold">
              Duyurular
            </h1>
            {isUserAdmin && (
              <Button asChild className="flex items-center gap-2">
                <Link to="/duyuru-olustur">
                  <Plus className="h-4 w-4" />
                  Duyuru Oluştur
                </Link>
              </Button>
            )}
          </div>
          
          {renderContent()}
        </div>
      </div>

      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Duyuruyu Silmek İstediğinize Emin Misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem geri alınamaz. Duyuru kalıcı olarak silinecektir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Siliniyor...
                </>
              ) : (
                "Sil"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}