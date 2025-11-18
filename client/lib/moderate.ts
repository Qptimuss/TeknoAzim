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
      
      // Sunucu hatası durumunda kullanıcıya bilgi ver
      if (errorData.error === "Server configuration error.") {
        toast.error("Moderasyon Hatası", { description: "Sunucu yapılandırma hatası: OpenAI API anahtarı eksik." });
      } else {
        toast.error("Moderasyon Hatası", { description: "İçerik kontrolü sırasında bir sorun oluştu." });
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