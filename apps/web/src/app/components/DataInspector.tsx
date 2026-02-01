'use client';

import React, { memo } from 'react';

interface ServerNode {
  id: string;
  label: string;
  parentId: string | null;
  children?: ServerNode[];
}

interface DataInspectorProps {
  treeData: ServerNode[];
  loading: boolean;
  onRefresh: () => void;
}

const DataInspector = memo(function DataInspector({ treeData, loading, onRefresh }: DataInspectorProps) {

  return (
    <div
      style={{
        height: '100%',
        background: '#1e1e1e',
        color: '#d4d4d4',
        padding: '20px',
        overflow: 'auto',
        fontFamily: 'Inter, monospace',
      }}
    >
      <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '16px', fontFamily: 'Inter, sans-serif' }}>Tree Data Inspector</h3>
        <button
          onClick={onRefresh}
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid #007bff',
            background: '#007bff',
            color: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Refresh
        </button>
      </div>
      {loading ? (
        <div style={{ color: '#888' }}>Loading...</div>
      ) : (
        <pre style={{ 
          margin: 0, 
          fontFamily: 'monospace', 
          fontSize: '12px',
          lineHeight: '1.5',
          whiteSpace: 'pre',
          overflow: 'auto',
        }}>
          {JSON.stringify(treeData, (key, value) => {
            // Keep structure but make it more compact
            return value;
          }, 2)}
        </pre>
      )}
    </div>
  );
});

export default DataInspector;
