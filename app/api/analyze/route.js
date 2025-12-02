import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) return NextResponse.json({ error: "No image URL provided" }, { status: 400 });

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // ✅ 修复：使用目前最稳定的正式版 gemini-1.5-flash
    // 只有这个版本的免费额度(15 RPM)能支撑你的批量上传
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash", 
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: { responseMimeType: "application/json" } 
    });

    const imageResp = await fetch(imageUrl);
    const imageBuffer = await imageResp.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const prompt = `
    Analyze this image and output a JSON object strictly based on this structure:
    {
      "title": "String (English, 30-60 chars, SEO friendly)",
      "description": "String (English, 80-150 chars)",
      "prompt": "String (Midjourney style detailed prompt, >150 words)",
      "tag1": "String (Primary Subject)",
      "tag2": "String (Mood/Tone)",
      "tag3": "String (Key Element)"
    }
    Rules:
    - NO markdown formatting.
    - NO slugs.
    - STRICTLY use straight double quotes (").
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json(JSON.parse(text));

  } catch (error) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}