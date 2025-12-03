'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as sfx from '../../lib/sfx';
import { SovereignPage, SovereignSection, SovereignStatus } from '../SovereignUI';

export default function UpdatesUploadTerminal() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(['SYSTEM READY. WAITING FOR BATCH INPUT...']);
  const [imageFiles, setImageFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    sfx.open();
  }, []);

  const log = useCallback((msg) => {
    setLogs((prev) => [...prev, `> ${msg}`]);
  }, []);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const selectedLabel = useMemo(() => {
    if (imageFiles.length === 0) return '[ SELECT FILES OR DROP HERE ]';
    return `[ ${imageFiles.length} FILES SELECTED ]`;
  }, [imageFiles.length]);

  const handleFiles = useCallback(
    (files) => {
      const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileList.length === 0) return;
      sfx.type();
      setImageFiles(fileList);
      log(`INGESTED ${fileList.length} IMAGE FILE(S). READY FOR DEPLOYMENT.`);
    },
    [log]
  );

  const processOneFile = useCallback(
    async (file, index, total) => {
      const prefix = `[ ${index + 1}/${total} ]`;
      try {
        log(`${prefix} UPLOADING: ${file.name}...`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', process.env.NEXT_PUBLIC_UPLOAD_PRESET);
        const cloudName = process.env.NEXT_PUBLIC_CLOUD_NAME;

        const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });
        if (!cloudRes.ok) throw new Error('Cloud Upload Failed');
        const cloudData = await cloudRes.json();
        const { secure_url: url, asset_id: id } = cloudData;

        log(`${prefix} CLOUD SECURED.`);

        const aiRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: url }),
        });
        const aiData = await aiRes.json();
        if (!aiRes.ok) throw new Error(aiData.error || 'AI Analysis Failed');

        log(`${prefix} AI TITLE: "${aiData.title}"`);

        const notionRes = await fetch('/api/notion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...aiData, imageUrl: url, assetId: id }),
        });
        if (!notionRes.ok) throw new Error('Notion Write Failed');

        sfx.success();
        log(`${prefix} SYNC COMPLETE (TG SENT). ✅`);
      } catch (err) {
        console.error(err);
        log(`${prefix} ERROR: ${err.message} ❌`);
      }
    },
    [log]
  );

  const handleBatchStart = useCallback(async () => {
    if (imageFiles.length === 0) {
      alert('ERROR: NO FILES SELECTED');
      return;
    }

    setLoading(true);
    sfx.close();
    setLogs([]);
    log(`INITIALIZING BATCH SEQUENCE (${imageFiles.length} FILES)...`);

    for (let i = 0; i < imageFiles.length; i++) {
      await processOneFile(imageFiles[i], i, imageFiles.length);

      if (i < imageFiles.length - 1) {
        log('COOLING DOWN (4s)...');
        await delay(4000);
      }
    }

    sfx.success();
    log('ALL TASKS COMPLETED. SYSTEM STANDBY.');
    setLoading(false);
  }, [imageFiles, log, processOneFile]);

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const latestLog = logs[logs.length - 1];

  return (
    <SovereignPage moduleLabel="更新ログ">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <SovereignStatus>
          <div className="log-item">{loading ? 'SYSTEM STATUS: BATCH ACTIVE' : 'SYSTEM STATUS: STANDBY'}</div>
          <div className="log-item">{`QUEUE: ${imageFiles.length} FILE(S)`}</div>
          <div className="log-item">{latestLog}</div>
        </SovereignStatus>

        <div style={{ marginTop: 10 }}>
          <SovereignSection title="[ OPERATION LOG ]">
            {logs.map((l, i) => (
              <div key={i} className="log-item">
                {l}
              </div>
            ))}
            {loading && <div className="log-item blink">BATCH PROCESSING ACTIVE...</div>}
          </SovereignSection>
        </div>

        <div style={{ marginTop: 20 }}>
          <SovereignSection title="[ BATCH CONTROL ]">
            <div style={{ marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 'bold', opacity: 0.7, display: 'block', marginBottom: 8 }}>
                SOURCE IMAGES (MULTI-SELECT / DROP):
              </span>
              <div
                className={`file-upload-wrapper ${imageFiles.length > 0 ? 'active' : ''} ${isDragging ? 'active' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                {selectedLabel}
                <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
              </div>
            </div>

            <button className="action-btn" onClick={handleBatchStart} disabled={loading}>
              {loading ? 'EXECUTING BATCH...' : '[ INITIATE BATCH UPLOAD ]'}
            </button>
          </SovereignSection>
        </div>

        <div className="footer">GYO CORP. v2.4 // SAFETY UNLOCKED</div>
      </div>
    </SovereignPage>
  );
}
