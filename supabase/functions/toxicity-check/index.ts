import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Daha popüler ve her zaman aktif olan bir modele geçiyoruz.
const HUGGING_FACE_API_URL = "https://api-inference.huggingface.co/models/savasy/bert-base-turkish-sentiment-cased";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    if (!text) {
      return new Response(JSON.stringify({ message: "Text to analyze is required." }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const HUGGING_FACE_API_KEY = Deno.env.get("HUGGING_FACE_API_KEY");
    if (!HUGGING_FACE_API_KEY) {
      console.error("HUGGING_FACE_API_KEY is not set in Supabase secrets.");
      return new Response(JSON.stringify({ message: "Toxicity service is not configured." }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const hfResponse = await fetch(HUGGING_FACE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`
      },
      body: JSON.stringify({ inputs: text })
    });

    if (!hfResponse.ok) {
      const errorBody = await hfResponse.text();
      console.error("Hugging Face API error:", errorBody);
      return new Response(JSON.stringify({ message: "Failed to analyze content." }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await hfResponse.json();
    
    // Yeni modelin çıktısını işliyoruz. "negative" etiketinin skorunu alıyoruz.
    const labels = result[0];
    const negativeLabel = labels.find((label: { label: string }) => label.label === 'negative');
    const toxicityScore = negativeLabel ? negativeLabel.score : 0;
    
    // Eğer negatiflik skoru %75'ten yüksekse, bunu toksik olarak kabul ediyoruz.
    const isToxic = toxicityScore > 0.75;

    return new Response(JSON.stringify({ isToxic, toxicityScore, message: "Content analyzed successfully." }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in toxicity function:", error);
    return new Response(JSON.stringify({ message: "An internal error occurred." }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});