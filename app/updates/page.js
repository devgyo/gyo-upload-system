'use client';
import { useCallback, useMemo, useState } from 'react';
import { SovereignPage, SovereignSection, SovereignButton, SovereignLog } from '../SovereignUI';
import { incrementUploadCount } from '../../lib/uploadStore';
import { playSuccess, playError } from '@/lib/sfx';

export default function UpdatesUploadTerminal() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState(['SYSTEM READY. WAITING FOR BATCH INPUT...']);
  const [imageFiles, setImageFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const log = useCallback((msg) => {
    setLogs((prev) => [...prev, msg]);
  }, []);

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  const selectedLabel = useMemo(() => {
    if (imageFiles.length === 0) return '[ SELECT FILES OR DROP HERE ]';
    return `[ ${imageFiles.length} FILES SELECTED ]`;
  }, [imageFiles.length]);

  const logEntries = useMemo(
    () => (loading ? [...logs, 'BATCH PROCESSING ACTIVE...'] : logs),
    [logs, loading]
  );

  const handleFiles = useCallback(
    (files) => {
      const fileList = Array.from(files).filter((f) => f.type.startsWith('image/'));
      if (fileList.length === 0) return;
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

        log(`${prefix} SYNC COMPLETE (TG SENT). ✅`);
        playSuccess();
      } catch (err) {
        console.error(err);
        playError();
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
    const initialMessage = `INITIALIZING BATCH SEQUENCE (${imageFiles.length} FILES)...`;
    setLogs([initialMessage]);

    for (let i = 0; i < imageFiles.length; i++) {
      await processOneFile(imageFiles[i], i, imageFiles.length);

      if (i < imageFiles.length - 1) {
        log('COOLING DOWN (4s)...');
        await delay(4000);
      }
    }

    incrementUploadCount(imageFiles.length);
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

  return (
    <SovereignPage moduleLabel="更新ログ">
      <div style={{ maxWidth: 840, margin: '0 auto' }}>
        <div style={{ marginTop: 10 }}>
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

            <SovereignButton variant="primary" onClick={handleBatchStart} disabled={loading}>
              {loading ? 'EXECUTING BATCH...' : '[ INITIATE BATCH UPLOAD ]'}
            </SovereignButton>
          </SovereignSection>
        </div>

        <div style={{ marginTop: 20 }}>
          <SovereignLog title="[ OPERATION LOG ]" entries={logEntries} />
        </div>

        <div className="footer">GYO CORP. v2.4 // SAFETY UNLOCKED</div>
      </div>
    </SovereignPage>
  );
}
