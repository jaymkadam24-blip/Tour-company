import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { ExtractedEmailData } from '../types';
import { db } from '../db/database';

export class AIService {
  private static getSettings() {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    return settings;
  }

  public static async extractInformation(
    subject: string,
    body: string,
    senderEmail: string,
    senderName?: string
  ): Promise<ExtractedEmailData> {
    const settings = this.getSettings();
    const provider = settings.ai_provider || 'heuristic';
    const geminiKey = process.env.GEMINI_API_KEY || settings.gemini_api_key || '';
    const openaiKey = process.env.OPENAI_API_KEY || settings.openai_api_key || '';

    // Choose execution path
    if (provider === 'gemini' && geminiKey) {
      try {
        return await this.extractWithGemini(subject, body, senderEmail, senderName, geminiKey);
      } catch (err) {
        console.error('Gemini API extraction failed, falling back to heuristic:', err);
      }
    } else if (provider === 'openai' && openaiKey) {
      try {
        return await this.extractWithOpenAI(subject, body, senderEmail, senderName, openaiKey);
      } catch (err) {
        console.error('OpenAI API extraction failed, falling back to heuristic:', err);
      }
    }

    // Default or Fallback to Heuristic engine
    return this.extractWithHeuristic(subject, body, senderEmail, senderName);
  }

  private static async extractWithGemini(
    subject: string,
    body: string,
    senderEmail: string,
    senderName: string | undefined,
    apiKey: string
  ): Promise<ExtractedEmailData> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `
You are an expert AI booking assistant for a touring and travel company.
Analyze the following incoming customer email and extract structured application information into a JSON object.

EMAIL SUBJECT: "${subject}"
EMAIL SENDER: "${senderName || ''} <${senderEmail}>"
EMAIL BODY:
"""
${body}
"""

Return ONLY a raw valid JSON object with no markdown codeblocks, following this exact schema:
{
  "customer_name": "Full name of customer",
  "customer_email": "Email address of customer",
  "customer_phone": "Phone number or empty string if not provided",
  "tour_package": "Specific tour package name or destination mentioned",
  "travel_date": "Date in YYYY-MM-DD or descriptive text if approximate",
  "number_of_travelers": 1 (number or null),
  "pickup_location": "Pickup location or hotel requested, or empty string",
  "additional_requirements": "Dietary, accessibility, special requests, or notes",
  "extraction_confidence": 0.95 (number from 0.0 to 1.0 indicating confidence),
  "uncertain_fields": ["array", "of", "field_names_that_are_vague_or_missing"],
  "extraction_notes": "Summary of AI extraction quality and any flagged issues",
  "is_relevant_tour_inquiry": true (boolean, set false if spam or unrelated)
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return this.cleanAndParseJSON(responseText, subject, body, senderEmail, senderName);
  }

  private static async extractWithOpenAI(
    subject: string,
    body: string,
    senderEmail: string,
    senderName: string | undefined,
    apiKey: string
  ): Promise<ExtractedEmailData> {
    const openai = new OpenAI({ apiKey });

    const prompt = `
Analyze the customer email below for a touring company. Extract structured JSON data:

EMAIL SUBJECT: "${subject}"
EMAIL SENDER: "${senderName || ''} <${senderEmail}>"
EMAIL BODY:
"""
${body}
"""

Schema:
{
  "customer_name": "Full name",
  "customer_email": "Email address",
  "customer_phone": "Phone number",
  "tour_package": "Tour package/destination",
  "travel_date": "YYYY-MM-DD or string",
  "number_of_travelers": number or null,
  "pickup_location": "Pickup place",
  "additional_requirements": "Special notes",
  "extraction_confidence": float 0-1,
  "uncertain_fields": ["array of strings"],
  "extraction_notes": "Explanation",
  "is_relevant_tour_inquiry": boolean
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You extract JSON data from travel customer emails.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0].message.content || '{}';
    return this.cleanAndParseJSON(content, subject, body, senderEmail, senderName);
  }

  private static cleanAndParseJSON(
    text: string,
    subject: string,
    body: string,
    senderEmail: string,
    senderName?: string
  ): ExtractedEmailData {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
    }

    try {
      const data = JSON.parse(cleanText);
      return {
        customer_name: data.customer_name || senderName || senderEmail.split('@')[0],
        customer_email: data.customer_email || senderEmail,
        customer_phone: data.customer_phone || '',
        tour_package: data.tour_package || '',
        travel_date: data.travel_date || '',
        number_of_travelers: typeof data.number_of_travelers === 'number' ? data.number_of_travelers : undefined,
        pickup_location: data.pickup_location || '',
        additional_requirements: data.additional_requirements || '',
        extraction_confidence: typeof data.extraction_confidence === 'number' ? data.extraction_confidence : 0.85,
        uncertain_fields: Array.isArray(data.uncertain_fields) ? data.uncertain_fields : [],
        extraction_notes: data.extraction_notes || 'Successfully parsed with AI.',
        is_relevant_tour_inquiry: typeof data.is_relevant_tour_inquiry === 'boolean' ? data.is_relevant_tour_inquiry : true
      };
    } catch {
      return this.extractWithHeuristic(subject, body, senderEmail, senderName);
    }
  }

  public static extractWithHeuristic(
    subject: string,
    body: string,
    senderEmail: string,
    senderName?: string
  ): ExtractedEmailData {
    const fullText = `${subject}\n${body}`;
    const uncertainFields: string[] = [];

    // Check relevance
    const tourKeywords = ['tour', 'safari', 'booking', 'inquiry', 'trip', 'package', 'visit', 'travel', 'trek', 'cruise', 'excursion', 'reserve', 'flight', 'hotel'];
    const isRelevant = tourKeywords.some(kw => fullText.toLowerCase().includes(kw));

    // Extract Name
    let customerName = senderName || '';
    if (!customerName || customerName === senderEmail) {
      const signoffMatch = body.match(/(?:thanks|regards|best regards|sincerely|cheers),\s*\n+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
      if (signoffMatch) {
        customerName = signoffMatch[1];
      } else {
        const nameFromEmail = senderEmail.split('@')[0].replace(/[._-]/g, ' ');
        customerName = nameFromEmail.replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // Extract Phone
    const phoneMatch = fullText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
    const customerPhone = phoneMatch ? phoneMatch[0].trim() : '';
    if (!customerPhone) uncertainFields.push('customer_phone');

    // Extract Number of Travelers
    let numberOfTravelers: number | undefined = undefined;
    const travelerMatch = fullText.match(/(\d+)\s*(?:people|travelers|passengers|adults|guests|pax|persons)/i);
    if (travelerMatch) {
      numberOfTravelers = parseInt(travelerMatch[1], 10);
    } else {
      uncertainFields.push('number_of_travelers');
    }

    // Extract Travel Date
    let travelDate = '';
    const dateMatch = fullText.match(/(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?,?\s*\d{4}/i) ||
                      fullText.match(/\d{4}-\d{2}-\d{2}/) ||
                      fullText.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
    if (dateMatch) {
      travelDate = dateMatch[0];
    } else {
      const vagueDate = fullText.match(/(?:next month|in november|in december|in october|summer 2026|spring 2026)/i);
      if (vagueDate) {
        travelDate = vagueDate[0];
      } else {
        uncertainFields.push('travel_date');
      }
    }

    // Extract Tour Package
    let tourPackage = '';
    const packageKeywords = [
      'Serengeti Wildlife Safari',
      'Swiss Alps Luxury Trek',
      'Kyoto Autumn Cultural',
      'Bali Sunset Catamaran',
      'Northern Lights Expedition',
      'Amalfi Coast Private Tour',
      'Galapagos Island Cruise',
      'Grand Canyon Helicopter Flight'
    ];
    for (const pkg of packageKeywords) {
      if (fullText.toLowerCase().includes(pkg.toLowerCase()) || subject.toLowerCase().includes(pkg.split(' ')[0].toLowerCase())) {
        tourPackage = pkg;
        break;
      }
    }
    if (!tourPackage) {
      // Look for "... package" or "... tour"
      const genericMatch = fullText.match(/([A-Z][a-zA-Z\s]{3,30}(?:Safari|Tour|Trek|Cruise|Expedition|Package))/);
      if (genericMatch) {
        tourPackage = genericMatch[1].trim();
      } else {
        tourPackage = subject.replace(/re:|fw:|fwd:|booking|inquiry/gi, '').trim();
      }
    }

    // Pickup location
    let pickupLocation = '';
    const pickupMatch = fullText.match(/(?:pick us up from|pickup at|pickup from|staying at|hotel:)\s*([^\n.,]+)/i);
    if (pickupMatch) {
      pickupLocation = pickupMatch[1].trim();
    }

    // Additional requirements
    const reqLines = body.split('\n').filter(line => 
      /dietary|vegetarian|wheelchair|ground floor|photography|guide|tea ceremony|urgent|price quote/i.test(line)
    );
    const additionalRequirements = reqLines.join(' ').trim();

    // Confidence calculation
    let confidence = 0.95;
    if (uncertainFields.length > 0) {
      confidence -= uncertainFields.length * 0.12;
    }
    if (confidence < 0.4) confidence = 0.4;
    confidence = Math.round(confidence * 100) / 100;

    let notes = 'Extracted using Smart NLP Heuristic Engine.';
    if (uncertainFields.length > 0) {
      notes += ` Fields needing review: ${uncertainFields.join(', ')}.`;
    }

    return {
      customer_name: customerName,
      customer_email: senderEmail,
      customer_phone: customerPhone,
      tour_package: tourPackage,
      travel_date: travelDate,
      number_of_travelers: numberOfTravelers,
      pickup_location: pickupLocation,
      additional_requirements: additionalRequirements,
      extraction_confidence: confidence,
      uncertain_fields: uncertainFields,
      extraction_notes: notes,
      is_relevant_tour_inquiry: isRelevant
    };
  }
}
