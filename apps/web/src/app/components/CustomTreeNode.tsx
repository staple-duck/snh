'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeToolbar } from '@xyflow/react';

interface CustomTreeNodeProps {
  data: {
    label: string;
    nodeId: string;
    onAddChild: (parentId: string) => void;
    onDelete: (nodeId: string, label: string) => void;
  };
  selected?: boolean;
}

const CustomTreeNode = memo(function CustomTreeNode({ data, selected }: CustomTreeNodeProps) {
  return (
    <>
      <NodeToolbar
        isVisible={selected}
        position={Position.Top}
        style={{
          display: 'flex',
          gap: '8px',
          background: '#ffffff',
          padding: '8px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          border: '1px solid #e5e7eb',
        }}
      >
        <button
          onClick={() => data.onAddChild(data.nodeId)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            background: '#10b981',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            lineHeight: '0',
            padding: 0,
          }}
          title="Add child node"
        >
          +
        </button>
        <button
          onClick={() => data.onDelete(data.nodeId, data.label)}
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            border: 'none',
            background: '#ef4444',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            lineHeight: '0',
            padding: 0,
          }}
          title="Delete node"
        >
          🗑
        </button>
      </NodeToolbar>

      <div
        style={{
          padding: '16px 24px',
          borderRadius: '12px',
          border: selected ? '2px solid #2563eb' : '2px solid #cbd5e1',
          background: '#ffffff',
          fontSize: '15px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fontWeight: 500,
          minWidth: '140px',
          textAlign: 'center',
          boxShadow: selected ? '0 8px 20px rgba(37, 99, 235, 0.2)' : '0 2px 8px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease',
        }}
      >
        {data.label}
      </div>

      <Handle 
        type="target" 
        position={Position.Top} 
        style={{ background: '#2563eb', width: '10px', height: '10px' }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        style={{ background: '#2563eb', width: '10px', height: '10px' }}
      />
    </>
  );
});

export default CustomTreeNode;
