'use client';
import { useState, useRef } from 'react';

export default function GyoSystem() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(["SYSTEM READY. WAITING FOR SOURCE..."]);
  const [imageFile, setImageFile] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);

  // --- 音效系统 ---
  const audioCtxRef = useRef(null);
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtxRef.current = new AudioContext();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
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
    }
  };

  const log = (msg) => setLogs(prev => [...prev, `> ${msg}`]);

  // --- 业务逻辑 ---

  // 1. 上传 Cloudinary
  const performUpload = async () => {
    if (!imageFile) throw new Error("NO IMAGE DETECTED");
    if (uploadedData) return uploadedData; 

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_UPLOAD_PRESET);
    const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST', body: formData
    });
    if (!res.ok) throw new Error("CLOUD UPLOAD FAILED");
    const data = await res.json();

    const result = { url: data.secure_url, id: data.asset_id };
    setUploadedData(result);
    return result;
  };

  // 2. 调用 Gemini 分析
  const performAnalysis = async (imageUrl) => {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "AI ANALYSIS FAILED");
    return data;
  };

  // 3. 一键全自动流程
  const handleStart = async () => {
    initAudio();
    if (!imageFile) { SFX.error(); return alert("ERROR: NO IMAGE"); }

    setLoading(true);
    SFX.click();
    setLogs([]); // 清屏
    log("INITIALIZING AUTO-UPLOAD SEQUENCE...");

    try {
      // --- 阶段 A: 传图 ---
      log("UPLOADING SOURCE IMAGE...");
      const { url, id } = await performUpload();
      log(`ASSET SECURED: ${id}`);

      // --- 阶段 B: AI 分析 ---
      log("AWAITING NEURAL UPLINK (GEMINI FLASH)...");
      SFX.processing();

      const aiData = await performAnalysis(url);

      // 在日志里秀一下 AI 生成的标题
      log(`GENERATED TITLE: "${aiData.title}"`);

      // --- 阶段 C: 写入 Notion ---
      log("TRANSMITTING TO NOTION DB...");
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...aiData, imageUrl: url, assetId: id })
      });

      if (!res.ok) throw new Error("DB WRITE FAILED");

      SFX.success();
      log("MISSION COMPLETE. DATA SYNCED.");

    } catch (err) {
      console.error(err);
      SFX.error();
      log(`CRITICAL ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" onClick={initAudio}>
      <div className="crt-overlay"></div>

      <div className="header">
        {/* ✅ 日文标题 */}
        <h1>GYO 作品アップロード端末</h1>
      </div>

      <div className="quote-box" id="console">
         {logs.map((l, i) => (
           <div key={i} className="log-item">{l}</div>
         ))}
         {loading && <div className="log-item blink">PROCESSING DATA STREAM...</div>}
      </div>

      <div className="input-group">
        <span className="label-text">SOURCE IMAGE:</span>
        <div className="file-upload-wrapper">
          <div className={`file-btn ${imageFile ? 'active' : ''}`}>
            {/* ✅ 选中后显示日文 */}
            {imageFile ? "[ 画像が選択されました！ ]" : "[ SELECT FILE TO UPLOAD ]"}
          </div>
          <input 
            type="file" accept="image/*" 
            onChange={e => {
              SFX.click();
              setImageFile(e.target.files[0]);
              setUploadedData(null); 
            }} 
          />
        </div>
      </div>

      <button className="action-btn" onClick={handleStart} disabled={loading}>
        {loading ? "EXECUTING..." : "[ INITIATE AUTO-UPLOAD ]"}
      </button>

      <div className="footer">GYO CORP. v2.0 // ONLINE</div>
    </div>
  );
}