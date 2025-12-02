'use client';
import { useState, useRef } from 'react';

export default function GyoSystem() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(["SYSTEM READY. WAITING FOR BATCH INPUT..."]);
  const [imageFiles, setImageFiles] = useState([]); 
  
  const audioCtxRef = useRef(null);
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
  };

  const playTone = (freq, type, duration) => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.value = 0.1; osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
  };

  const SFX = {
    type: () => playTone(800 + Math.random() * 200, "square", 0.03),
    click: () => playTone(1200, "sine", 0.05),
    processing: () => playTone(2000, "square", 0.1),
    success: () => {
      playTone(880, "sine", 0.1);
      setTimeout(() => playTone(1760, "sine", 0.2), 100);
    },
    error: () => {
      playTone(150, "sawtooth", 0.3);
      setTimeout(() => playTone(100, "sawtooth", 0.3), 300);
    },
    next: () => playTone(600, "triangle", 0.1)
  };

  const log = (msg) => setLogs(prev => [...prev, `> ${msg}`]);
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  // --- 核心业务 ---
  const processOneFile = async (file, index, total) => {
    const prefix = `[ ${index + 1}/${total} ]`;
    try {
      SFX.next();
      log(`${prefix} UPLOADING: ${file.name}...`);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_UPLOAD_PRESET);
      const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;
      
      const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: formData });
      if (!cloudRes.ok) throw new Error("Cloud Upload Failed");
      const cloudData = await cloudRes.json();
      const { secure_url: url, asset_id: id } = cloudData;
      
      log(`${prefix} CLOUD SECURED.`);

      // AI 分析
      SFX.processing();
      const aiRes = await fetch('/api/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url })
      });
      const aiData = await aiRes.json();
      
      // 如果后端返回错误，抛出异常
      if (!aiRes.ok) throw new Error(aiData.error || "AI Analysis Failed");
      
      log(`${prefix} AI TITLE: "${aiData.title}"`);

      // 存 Notion
      const notionRes = await fetch('/api/notion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aiData, imageUrl: url, assetId: id })
      });
      if (!notionRes.ok) throw new Error("Notion Write Failed");

      SFX.success();
      log(`${prefix} SYNC COMPLETE (TG SENT). ✅`);

    } catch (err) {
      console.error(err);
      SFX.error();
      log(`${prefix} ERROR: ${err.message} ❌`);
    }
  };

  const handleBatchStart = async () => {
    initAudio();
    if (imageFiles.length === 0) { SFX.error(); return alert("ERROR: NO FILES SELECTED"); }
    
    setLoading(true);
    SFX.click();
    setLogs([]); 
    log(`INITIALIZING BATCH SEQUENCE (${imageFiles.length} FILES)...`);

    for (let i = 0; i < imageFiles.length; i++) {
      await processOneFile(imageFiles[i], i, imageFiles.length);
      
      // ✅ 关键修改：增加到 4 秒冷却时间，防止 Google 报错
      if (i < imageFiles.length - 1) {
        log("COOLING DOWN (4s)...");
        await delay(4000); 
      }
    }

    SFX.success();
    log("ALL TASKS COMPLETED. SYSTEM STANDBY.");
    setLoading(false);
  };

  return (
    <div className="container" onClick={initAudio}>
      <div className="crt-overlay"></div>
      <div className="header"><h1>GYO 作品アップロード端末</h1></div>
      
      <div className="quote-box" id="console">
         {logs.map((l, i) => <div key={i} className="log-item">{l}</div>)}
         {loading && <div className="log-item blink">BATCH PROCESSING ACTIVE...</div>}
      </div>

      <div style={{ marginBottom: 30 }}>
        <span style={{fontSize:12, fontWeight:'bold', opacity:0.7, display:'block', marginBottom:8}}>SOURCE IMAGES (MULTI-SELECT):</span>
        <div className={`file-upload-wrapper ${imageFiles.length > 0 ? 'active' : ''}`}>
          {imageFiles.length > 0 ? `[ ${imageFiles.length} FILES SELECTED ]` : "[ SELECT FILES (SHIFT+CLICK) ]"}
          <input 
            type="file" accept="image/*" multiple 
            onChange={e => {
              SFX.click();
              setImageFiles(Array.from(e.target.files));
            }} 
          />
        </div>
      </div>

      <button className="action-btn" onClick={handleBatchStart} disabled={loading}>
        {loading ? "EXECUTING BATCH..." : "[ INITIATE BATCH UPLOAD ]"}
      </button>

      <div className="footer">GYO CORP. v2.4 // SAFETY UNLOCKED</div>
    </div>
  );
}