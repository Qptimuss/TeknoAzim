import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const HUGGING_FACE_API_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
// Sorunu çözmek için farklı bir toksik yorum modeli deniyoruz.
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/s-nlp/roberta_toxicity_classifier";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight request handling
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!HUGGING_FACE_API_KEY) {
      console.error("HUGGING_FACE_API_KEY secret not found.");
      throw new Error("Hugging Face API anahtarı bulunamadı.");
    }

    const { content } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "İçerik gerekli." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("Moderation function invoked with content:", content);

    // Hangi adrese istek attığımızı loglayarak teyit edelim.
    console.log(`Calling Hugging Face API at endpoint: ${MODEL_ENDPOINT}`);
    const response = await fetch(MODEL_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: content }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Hugging Face API Error Status:", response.status);
      console.error("Hugging Face API Error Body:", errorBody);
      
      if (response.status === 503) {
        console.warn("Model is loading, approving comment by default.");
        return new Response(JSON.stringify({ approved: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Hugging Face API'den geçersiz yanıt: ${response.status}`);
    }

    const results = await response.json();
    console.log("Hugging Face API response:", JSON.stringify(results, null, 2));
    
    // Bu modelin çıktısı 'toxic' ve 'nontoxic' olabilir.
    const toxicPrediction = results[0].find((item: { label: string; score: number }) => item.label.toLowerCase() === 'toxic');
    
    const isToxic = toxicPrediction && toxicPrediction.score > 0.8;
    console.log("Toxicity check result:", { isToxic, score: toxicPrediction?.score });

    return new Response(JSON.stringify({ approved: !isToxic }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Caught an exception in moderation function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});