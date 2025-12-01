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

    // 1. 先写入 Notion (这步必须立刻完成)
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

    // 2. ✅ 设置延迟发送 Telegram (1小时)
    // 逻辑：即使 return 了结果给前端，这个定时器依然会在后台 Node.js 进程里跑
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHANNEL_ID) {
      
      const ONE_HOUR_IN_MS = 60 * 60 * 1000; // 1小时
      // const ONE_HOUR_IN_MS = 10 * 1000; // 测试用：10秒 (你可以先打开这个测试一下)

      console.log(`⏳ Telegram 任务已加入队列，将在 1 小时后发送 (Asset: ${body.assetId})`);

      setTimeout(async () => {
        try {
          console.log(`⏰ 时间到！正在发送 Telegram... (Asset: ${body.assetId})`);
          
          const caption = `New post from VaveBG.com/p/${body.assetId}`;
          const tgUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
          
          await fetch(tgUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TELEGRAM_CHANNEL_ID,
              photo: body.imageUrl,
              caption: caption
            })
          });
          
          console.log(`✅ Telegram 发送成功 (Asset: ${body.assetId})`);
        } catch (tgError) {
          console.error("❌ Telegram 发送失败:", tgError);
        }
      }, ONE_HOUR_IN_MS);
    }

    // 3. 立即告诉前端“成功了”，不用等 1 小时
    return NextResponse.json({ success: true, message: "Saved to Notion & Scheduled for Telegram" });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}