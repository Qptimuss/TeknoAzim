import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { filterContent } from "@/lib/content-filter";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ContentFilterTester() {
  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTestContent = async () => {
    if (!text.trim()) {
      toast.info("Lütfen test etmek için bir metin girin.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await filterContent(text);
      if (result.isAllowed) {
        toast.success("İçerik Temiz!", {
          description: "Bu metin filtreden başarıyla geçti.",
        });
      } else {
        toast.error("Uygunsuz İçerik Tespit Edildi!", {
          description: result.reason || "Metin, topluluk kurallarına aykırı bulundu.",
        });
      }
    } catch (error) {
      toast.error("Test sırasında bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>İçerik Filtresi Test Alanı</CardTitle>
        <CardDescription>
          Bu alana yazdığınız metinlerin yapay zeka filtresinden geçip geçmediğini test edebilirsiniz. Bu bölüm sadece size özeldir.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Test edilecek metni buraya yazın..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-[120px]"
        />
      </CardContent>
      <CardFooter>
        <Button onClick={handleTestContent} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Test Ediliyor...
            </>
          ) : (
            "Metni Test Et"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}