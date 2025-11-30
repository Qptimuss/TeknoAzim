import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';

export default function DailyRewardNotifier() {
  const { isDailyRewardEligible, triggerDailyRewardClaim, user } = useAuth();

  useEffect(() => {
    if (isDailyRewardEligible && user) {
      toast.info(
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold">Günlük Giriş Ödülü Hazır!</p>
            <p className="text-sm text-muted-foreground">20 Gem ve 25 EXP seni bekliyor.</p>
          </div>
          <Button 
            onClick={() => {
              triggerDailyRewardClaim();
              toast.dismiss('daily-reward-toast'); // Toast'ı kapat
            }}
            className="ml-auto shrink-0"
          >
            Al
          </Button>
        </div>,
        {
          id: 'daily-reward-toast', // Bu toast'a benzersiz bir ID veriyoruz
          duration: Infinity, // Kullanıcı kapatana kadar açık kalır
          position: 'top-center', // Konumu 'top-center' olarak değiştirdik
          action: {
            label: 'Kapat',
            onClick: () => toast.dismiss('daily-reward-toast'),
          },
          onAutoClose: () => { /* Do nothing, it's infinite */ },
          onDismiss: () => { /* Do nothing, action button handles it */ },
        }
      );
    } else {
      toast.dismiss('daily-reward-toast'); // Uygun değilse veya çıkış yapıldıysa toast'ı kapat
    }
  }, [isDailyRewardEligible, triggerDailyRewardClaim, user]);

  return null; // Bu bileşen UI'da bir şey render etmez, sadece toast'ı yönetir
}