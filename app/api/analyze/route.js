import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request) {
  try {
    const { imageUrl } = await request.json();
    
    if (!imageUrl) return NextResponse.json({ error: "No image URL provided" }, { status: 400 });

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // ✅ 修改这里：使用 Gemini 2.0 Flash Lite
    // 注意：如果这个名字报错，请尝试 "gemini-2.0-flash-exp"
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-lite-preview-02-05", 
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