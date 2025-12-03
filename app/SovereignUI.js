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
