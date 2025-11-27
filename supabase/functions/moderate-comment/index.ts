import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HfInference } from "https://esm.sh/@huggingface/inference@2.6.4";
import { corsHeaders } from "../_shared/cors.ts";

// Hugging Face API client'ını başlat
const hf = new HfInference(Deno.env.get("HUGGINGFACE_API_KEY"));
const model = "unitary/toxic-bert";

// Metni daha küçük parçalara ayırmak için bir fonksiyon
// Basit bir karakter tabanlı bölme yapıyoruz. Daha gelişmiş bir tokenizer
// kullanılabilir, ancak bu çoğu durum için yeterlidir.
function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.substring(i, i + maxLength));
  }
  return chunks;
}

serve(async (req) => {
  // CORS preflight isteğini işle
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string") {
      return new Response(JSON.stringify({ error: "Content is required and must be a string." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Metni 500 karakterlik parçalara ayır (token sınırına takılmamak için güvenlik payı bırakıyoruz)
    const textChunks = chunkText(content, 500);
    let isFlagged = false;

    for (const chunk of textChunks) {
      const results = await hf.textClassification({
        model: model,
        inputs: chunk,
      });

      // Modelin çıktısını kontrol et. 'toxic' veya benzeri bir etiket
      // yüksek bir skorla dönerse, metni işaretle.
      // 'toxic-bert' modeli genellikle 'toxic' etiketi ve 0-1 arası bir skor döndürür.
      const toxicClassification = results.find(
        (res) => res.label === "toxic" && res.score > 0.8
      );

      if (toxicClassification) {
        console.log("Uygunsuz içerik tespit edildi:", chunk);
        isFlagged = true;
        break; // Bir parça uygunsuzsa, diğerlerini kontrol etmeye gerek yok.
      }
    }

    // isFlagged true ise, içerik uygunsuz demektir.
    // Bizim mantığımıza göre, isModerated'ın false olması gerekiyor.
    const isModerated = !isFlagged;

    return new Response(JSON.stringify({ isModerated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error calling Hugging Face API:", error);
    // Hata nesnesini daha detaylı logla
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Object ? JSON.stringify(error, null, 2) : "";
    console.error("Error Details:", errorDetails);

    return new Response(JSON.stringify({ error: "Failed to moderate content.", details: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});