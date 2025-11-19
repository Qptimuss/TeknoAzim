import { toast } from "sonner";

export const moderateContent = async (text: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Moderation check failed on the server:', errorData);
      
      const details = errorData.details || "İçerik kontrolü sırasında bir sorun oluştu.";

      // Too Many Requests hatasını özel olarak ele al
      if (details.includes("Too Many Requests") || response.status === 429) {
        toast.error("Hız Limiti Aşıldı", { 
          description: "Çok fazla istek gönderdiniz. Lütfen birkaç saniye bekleyip tekrar deneyin." 
        });
      } else if (errorData.error === "Server configuration error.") {
        toast.error("Moderasyon Hatası", { description: "Sunucu yapılandırma hatası: OpenAI API anahtarı eksik." });
      } else if (errorData.error === "OpenAI API hatası") {
        // Diğer OpenAI hatalarını göster
        toast.error("OpenAI API Hatası", { description: details });
      } else {
        toast.error("Moderasyon Hatası", { description: details });
      }
      
      // Sunucu hatası durumunda kullanıcıyı engellememek için true dönüyoruz.
      return true;
    }

    const data = await response.json();
    return data.isAppropriate;
  } catch (error) {
    console.error('Error during moderation check:', error);
    // Ağ hatası gibi durumlarda da kullanıcıyı engellememek için true dönüyoruz.
    toast.error("Ağ Hatası", { description: "Moderasyon servisine ulaşılamadı." });
    return true;
  }
};