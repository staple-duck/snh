'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  Connection,
  OnReconnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import axios from 'axios';
import toast from 'react-hot-toast';
import { getLayoutedElements } from '../utils/dagre-layout';
import CustomTreeNode from './CustomTreeNode';
import CreateNodeModal from './CreateNodeModal';

const PlusIcon = ({ width }: { width?: number }) => (
  <svg style={{ width: width || 24 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

interface ServerNode {
  id: string;
  label: string;
  parentId: string | null;
  children?: ServerNode[];
}

interface DeleteResponse {
  id: string;
  deletedCount: number;
  message: string;
}

interface TreeFlowProps {
  treeData: ServerNode[];
  loading: boolean;
  onDataChange?: () => void;
}

const nodeTypes = {
  custom: CustomTreeNode,
};

function TreeFlowContent({ treeData, loading, onDataChange }: TreeFlowProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [parentForNewNode, setParentForNewNode] = useState<string | null>(null);
  const [parentLabel, setParentLabel] = useState<string | undefined>(undefined);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<{ id: string; label: string } | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{ deletedCount: number } | null>(null);
  
  const { fitView } = useReactFlow();

  const handleOpenCreateModal = useCallback((parentId?: string) => {
    if (parentId) {
      setParentForNewNode(parentId);
    } else {
      setParentLabel(undefined);
      setParentForNewNode(null);
    }
    setCreateModalOpen(true);
  }, []);

  const handleDeleteNode = useCallback(async (nodeId: string, label: string) => {
    setNodeToDelete({ id: nodeId, label });
    
    const count = countDescendants(nodeId, treeData);
    setDeleteInfo({ deletedCount: count + 1 });
    setDeleteModalOpen(true);
  }, [treeData]);

  useEffect(() => {
    if (parentForNewNode && nodes.length > 0) {
      const parentNode = nodes.find(n => n.data.nodeId === parentForNewNode);
      if (parentNode) {
        setParentLabel(parentNode.data.label as string);
      }
    }
  }, [parentForNewNode, nodes]);

  useEffect(() => {
    const newNodeMap = new Map<string, Node>();
    const newEdges: Edge[] = [];

    const processNodes = (serverNodes: ServerNode[]) => {
      serverNodes.forEach((sn) => {
        newNodeMap.set(sn.id, {
          id: sn.id,
          type: 'custom',
          data: { 
            label: sn.label, 
            nodeId: sn.id,
            onAddChild: handleOpenCreateModal,
            onDelete: handleDeleteNode,
          },
          position: { x: 0, y: 0 },
        });

        if (sn.parentId !== null) {
          newEdges.push({
            id: `e${sn.parentId}-${sn.id}`,
            source: sn.parentId,
            target: sn.id,
            animated: true,
            style: { stroke: '#2563eb', strokeWidth: 2 },
          });
        }

        if (sn.children && sn.children.length > 0) {
          processNodes(sn.children);
        }
      });
    };

    processNodes(treeData);

    if (newNodeMap.size > 0) {
      const initialNodes = Array.from(newNodeMap.values());
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        initialNodes,
        newEdges
      );
      
      setNodes((existingNodes) => {
        const existingMap = new Map(existingNodes.map(n => [n.id, n]));
        
        return layoutedNodes.map(newNode => {
          const existing = existingMap.get(newNode.id);
          if (existing) {
            if (existing.data.label !== newNode.data.label) {
              return {
                ...existing,
                data: { ...existing.data, label: newNode.data.label },
              };
            }
            return existing;
          }
          return newNode;
        });
      });
      
      setEdges(layoutedEdges);
      
      if (isFirstLoad && treeData.length > 0) {
        setTimeout(() => {
          fitView({ duration: 800, padding: 0.2 });
          setIsFirstLoad(false);
        }, 100);
      }
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [treeData, setNodes, setEdges, fitView, isFirstLoad, handleOpenCreateModal, handleDeleteNode]);

  const handleCreateNode = useCallback(async (label: string) => {
    try {
      await axios.post(`${API_URL}/tree`, {
        label,
        parentId: parentForNewNode,
      });
      setCreateModalOpen(false);
      setParentForNewNode(null);
      setParentLabel(undefined);
      if (onDataChange) onDataChange();
      toast.success(`Node "${label}" created successfully`);
    } catch (error: any) {
      console.error('Error creating node:', error);
      toast.error(error.response?.data?.message || 'Failed to create node');
    }
  }, [parentForNewNode, onDataChange]);

  const onConnect = useCallback(
    async (params: Connection) => {
      try {
        if (params.target && params.source) {
          await axios.patch(`${API_URL}/tree/${params.target}`, {
            parentId: params.source,
          });
          if (onDataChange) onDataChange();
          toast.success('Node connected successfully');
        }
      } catch (error: any) {
        // Silently ignore if node doesn't exist
        if (error.response?.status === 404 || error.response?.status === 400) {
          console.log('Node no longer exists, skipping connect');
          return;
        }
        
        console.error('Error connecting nodes:', error);
        toast.error(error.response?.data?.message || 'Failed to connect nodes');
      }
    },
    [onDataChange]
  );

  const onReconnect: OnReconnect = useCallback(
    async (oldEdge, newConnection) => {
      try {
        await axios.patch(`${API_URL}/tree/${newConnection.target}`, {
          parentId: newConnection.source || null,
        });
        
        if (onDataChange) onDataChange();
        toast.success('Node reparented successfully');
      } catch (error: any) {
        // Silently ignore if node doesn't exist (already deleted during cleanup)
        if (error.response?.status === 404 || error.response?.status === 400) {
          console.log('Node no longer exists, skipping reconnect');
          return;
        }
        
        console.error('Error reconnecting edge:', error);
        toast.error(error.response?.data?.message || 'Failed to reconnect node');
        if (onDataChange) onDataChange();
      }
    },
    [onDataChange]
  );

  const countDescendants = (nodeId: string, trees: ServerNode[]): number => {
    const findNode = (nodes: ServerNode[]): ServerNode | null => {
      for (const node of nodes) {
        if (node.id === nodeId) return node;
        if (node.children) {
          const found = findNode(node.children);
          if (found) return found;
        }
      }
      return null;
    };

    const countAllDescendants = (node: ServerNode): number => {
      let count = 0;
      if (node.children) {
        node.children.forEach(child => {
          count++;
          count += countAllDescendants(child);
        });
      }
      return count;
    };

    const targetNode = findNode(trees);
    return targetNode ? countAllDescendants(targetNode) : 0;
  };

  const confirmDelete = useCallback(async () => {
    if (!nodeToDelete) return;

    try {
      const response = await axios.delete<DeleteResponse>(`${API_URL}/tree/${nodeToDelete.id}`);
      setDeleteModalOpen(false);
      setNodeToDelete(null);
      setDeleteInfo(null);
      if (onDataChange) onDataChange();
      toast.success(`Deleted ${response.data.deletedCount} node(s) successfully`);
    } catch (error: any) {
      console.error('Error deleting node:', error);
      toast.error(error.response?.data?.message || 'Failed to delete node');
      setDeleteModalOpen(false);
    }
  }, [nodeToDelete, onDataChange]);

  const cancelDelete = useCallback(() => {
    setDeleteModalOpen(false);
    setNodeToDelete(null);
    setDeleteInfo(null);
  }, []);

  return (
    <>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        {loading ? (
          <div style={{ padding: '20px', fontFamily: 'Inter, sans-serif' }}>Loading...</div>
        ) : nodes.length === 0 ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <button
              onClick={() => handleOpenCreateModal()}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                border: '3px dashed #cbd5e1',
                background: '#ffffff',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: '52px',
                fontWeight: '200',
                lineHeight: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                margin: '0',
                padding: '0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <PlusIcon width={40} />
            </button>
            <p style={{ 
              marginTop: '20px', 
              color: '#6b7280', 
              fontSize: '16px', 
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
              maxWidth: '300px',
            }}>
              Click to create your first workflow node
            </p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onReconnect={onReconnect}
            nodeTypes={nodeTypes}
            edgesReconnectable={true}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} size={1} color="#e5e7eb" />
            <Controls />
          </ReactFlow>
        )}
      </div>

      <CreateNodeModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNode}
        parentLabel={parentLabel}
      />

      {deleteModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(4px)',
          }}
          onClick={cancelDelete}
        >
          <div
            style={{
              background: '#ffffff',
              padding: '32px',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0, marginBottom: '12px', fontSize: '20px', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Confirm Deletion</h2>
            <p style={{ fontSize: '15px', color: '#374151', marginBottom: '20px', fontFamily: 'Inter, sans-serif', lineHeight: '1.5' }}>
              Are you sure you want to delete <strong>{nodeToDelete?.label}</strong>?
            </p>
            {deleteInfo && deleteInfo.deletedCount > 1 && (
              <div
                style={{
                  padding: '16px',
                  background: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <strong>Warning:</strong> This will also delete <strong>{deleteInfo.deletedCount - 1}</strong> child node(s).
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '10px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function TreeFlow({ treeData, loading, onDataChange }: TreeFlowProps) {
  return (
    <ReactFlowProvider>
      <TreeFlowContent treeData={treeData} loading={loading} onDataChange={onDataChange} />
    </ReactFlowProvider>
  );
}
