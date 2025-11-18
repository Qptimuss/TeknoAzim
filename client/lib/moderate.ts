import { toast } from "sonner";

export const moderateContent = async (text: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('Moderation check failed on the server.');
      // Sunucu hatası durumunda kullanıcıyı engellememek için true dönüyoruz.
      return true;
    }

    const data = await response.json();
    return data.isAppropriate;
  } catch (error) {
    console.error('Error during moderation check:', error);
    // Ağ hatası gibi durumlarda da kullanıcıyı engellememek için true dönüyoruz.
    return true;
  }
};