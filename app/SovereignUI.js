'use client';
import React from 'react';

export function SovereignPage({ moduleLabel, children }) {
  return (
    <div className="container">
      <div className="crt-overlay"></div>
      <div className="header">
        <h1>主権統御院・中枢管理システム // {moduleLabel}</h1>
      </div>
      {children}
    </div>
  );
}

export function SovereignStatus({ text, children }) {
  return (
    <div className="quote-box">
      {text ? <div className="log-item">{text}</div> : null}
      {children}
    </div>
  );
}

export function SovereignSection({ title, children }) {
  return (
    <div className="quote-box">
      {title ? <div className="log-item" style={{ fontWeight: 700 }}>{title}</div> : null}
      <div style={{ paddingTop: title ? 10 : 0 }}>{children}</div>
    </div>
  );
}

export function SovereignButton({ variant = 'primary', className = '', type = 'button', ...props }) {
  const baseClass = variant === 'ghost' ? 'ghost-btn' : 'action-btn';
  const combined = `${baseClass} ${className}`.trim();
  return <button type={type} {...props} className={combined} />;
}

export function SovereignLog({ entries = [], title }) {
  return (
    <div className="quote-box log-panel">
      {title ? <div className="log-item" style={{ fontWeight: 700 }}>{title}</div> : null}
      <div style={{ maxHeight: 260, overflowY: 'auto', paddingTop: title ? 10 : 0 }}>
        {entries.length === 0 && (
          <div className="log-item">{"> NO ENTRIES"}</div>
        )}
        {entries.map((entry, idx) => (
          <div key={idx} className="log-item">{`> ${entry}`}</div>
        ))}
      </div>
    </div>
  );
}
