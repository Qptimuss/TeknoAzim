import { RequestHandler } from "express";
import "dotenv/config";

const TOXICITY_THRESHOLD = 0.65;

interface ToxicityResponse {
  isToxic: boolean;
  toxicityScore: number;
  message: string;
}

/**
 * Middleware to check content toxicity using the BERTurk edge function
 */
export const checkToxicity: RequestHandler = async (req, res, next) => {
  try {
    // A simple way to allow admins to bypass checks
    if (process.env.ADMIN_USER_ID && req.userId === process.env.ADMIN_USER_ID) {
      return next();
    }

    // Extract content to check from request body
    const contentToCheck: string[] = [];
    
    if (req.body.title && typeof req.body.title === 'string') contentToCheck.push(req.body.title);
    if (req.body.content && typeof req.body.content === 'string') contentToCheck.push(req.body.content);
    if (req.body.description && typeof req.body.description === 'string') contentToCheck.push(req.body.description);
    if (req.body.name && typeof req.body.name === 'string') contentToCheck.push(req.body.name);
    
    if (contentToCheck.length === 0) {
      return next();
    }

    for (const text of contentToCheck) {
      const response = await fetch('https://yswvdavntaevzbxluvkh.supabase.co/functions/v1/toxicity-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Toxicity check service failed:', errorText);
        
        // FAIL-OPEN in development: If the service fails, allow the request
        if (process.env.NODE_ENV === 'production') {
          return res.status(503).json({ 
            message: "İçerik denetleme servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." 
          });
        } else {
          console.warn('Toxicity check failed in development, allowing request to proceed');
          continue;
        }
      }

      const result: ToxicityResponse = await response.json();
      
      if (result.isToxic || result.toxicityScore > TOXICITY_THRESHOLD) {
        return res.status(400).json({ 
          message: "İçeriğiniz topluluk kurallarımızı ihlal ediyor. Lütfen daha yapıcı bir dil kullanın." 
        });
      }
    }

    next();

  } catch (error) {
    console.error("Error in toxicity middleware:", error);
    // FAIL-OPEN in development: If any other error occurs, allow the request
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({
        message: "İçerik denetlenirken bir hata oluştu. Lütfen tekrar deneyin."
      });
    } else {
      console.warn('Toxicity check error in development, allowing request to proceed');
      next();
    }
  }
};