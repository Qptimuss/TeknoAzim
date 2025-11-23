import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const HUGGING_FACE_API_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/unitary/toxic-bert";

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
      throw new Error("Hugging Face API anahtarı bulunamadı.");
    }

    const { content } = await req.json();
    if (!content) {
      return new Response(JSON.stringify({ error: "İçerik gerekli." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
      console.error("Hugging Face API Error:", errorBody);
      // If the model is loading, we can choose to approve the comment to avoid blocking users.
      if (response.status === 503) {
        console.warn("Model is loading, approving comment by default.");
        return new Response(JSON.stringify({ approved: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`Hugging Face API'den geçersiz yanıt: ${response.status}`);
    }

    const results = await response.json();
    
    // The model returns an array of label predictions for the input.
    // We check if any of the predictions is 'toxic' with a high confidence score.
    const toxicPrediction = results[0].find((item: { label: string; score: number }) => item.label === 'toxic');
    
    const isToxic = toxicPrediction && toxicPrediction.score > 0.9;

    return new Response(JSON.stringify({ approved: !isToxic }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Moderasyon fonksiyonunda hata:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});