import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      NOTION_API_KEY, 
      NOTION_DATABASE_ID, 
      TELEGRAM_BOT_TOKEN, 
      TELEGRAM_CHANNEL_ID 
    } = process.env;

    // --- 1. 写入 Notion ---
    const notionData = {
      parent: { database_id: NOTION_DATABASE_ID },
      properties: {
        "Title": { title: [{ text: { content: body.title || "Untitled" } }] },
        "AssetID": { rich_text: [{ text: { content: body.assetId || "" } }] },
        "Description": { rich_text: [{ text: { content: body.description || "" } }] },
        "Prompt": { rich_text: [{ text: { content: body.prompt || "" } }] },
        "Tag 1": { rich_text: [{ text: { content: body.tag1 || "" } }] },
        "Tag 2": { rich_text: [{ text: { content: body.tag2 || "" } }] },
        "Tag 3": { rich_text: [{ text: { content: body.tag3 || "" } }] },
        "Date": { date: { start: body.date || new Date().toISOString() } },
        "Image": {
          files: [{ name: "cover", type: "external", external: { url: body.imageUrl } }]
        }
      }
    };

    const notionRes = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_API_KEY}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify(notionData)
    });

    if (!notionRes.ok) {
      const errorData = await notionRes.json();
      throw new Error(`Notion Error: ${errorData.message}`);
    }

    // --- 2. 发送 Telegram (修复部分) ---
    // 只有 Notion 成功了才会执行这里
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHANNEL_ID) {
      try {
        console.log(`Sending Telegram for: ${body.title}`);
        
        const caption = `New post from VaveBG.com/p/${body.assetId}`;
        const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
        
        // 异步发送，不阻塞主流程
        fetch(tgUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: TELEGRAM_CHANNEL_ID,
            photo: body.imageUrl,
            caption: caption
          })
        }).then(res => {
            if(res.ok) console.log("✅ TG Sent");
            else console.error("❌ TG Failed", res.status);
        });

      } catch (tgError) {
        console.error("TG Error (Ignored):", tgError);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}