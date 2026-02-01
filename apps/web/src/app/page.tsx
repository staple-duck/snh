'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

const TreeFlow = dynamic(() => import('./components/TreeFlow'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px' }}>Loading visualizer...</div>,
});

const DataInspector = dynamic(() => import('./components/DataInspector'), {
  ssr: false,
  loading: () => <div style={{ padding: '20px', background: '#1e1e1e', color: '#888' }}>Loading inspector...</div>,
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ServerNode {
  id: string;
  label: string;
  parentId: string | null;
  children?: ServerNode[];
}

export default function Index() {
  const [treeData, setTreeData] = useState<ServerNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const fetchTreeData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/tree`);
        setTreeData(response.data);
      } catch (error) {
        console.error('Error fetching tree data:', error);
        setTreeData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTreeData();
  }, [refreshTrigger]);

  const handleDataChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <main style={{ width: '100vw', height: '100vh', display: 'flex', position: 'relative' }}>
      {/* Workflow Canvas */}
      <div style={{ flex: isMobile ? '1' : '1 1 70%', minWidth: 0 }}>
        <TreeFlow 
          treeData={treeData} 
          loading={loading}
          onDataChange={handleDataChange} 
        />
      </div>

      {/* Desktop: Side panel */}
      {!isMobile && (
        <div style={{ flex: '1 1 30%', minWidth: '300px', maxWidth: '500px', borderLeft: '2px solid #333' }}>
          <DataInspector 
            treeData={treeData}
            loading={loading}
            onRefresh={() => setRefreshTrigger(prev => prev + 1)}
          />
        </div>
      )}

      {/* Mobile: Floating button */}
      {isMobile && (
        <button
          onClick={() => setInspectorOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#2563eb',
            color: 'white',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            zIndex: 999,
            lineHeight: '1',
            padding: 0,
          }}
        >
          JSON
        </button>
      )}

      {/* Mobile: Full-screen inspector overlay */}
      {isMobile && inspectorOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9998,
            background: '#1e1e1e',
          }}
        >
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontFamily: 'Inter, sans-serif' }}>Tree Data Inspector</h3>
              <button
                onClick={() => setInspectorOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#374151',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '24px',
                  lineHeight: '1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <DataInspector 
                treeData={treeData}
                loading={loading}
                onRefresh={() => setRefreshTrigger(prev => prev + 1)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
