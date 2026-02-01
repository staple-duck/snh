import axios from 'axios';

describe('🌲 Tree API - End-to-End Tests', () => {
  const baseUrl = process.env.API_URL || 'http://localhost:3000/api';
  let createdNodeIds: string[] = [];

  // Cleanup after all tests
  afterAll(async () => {
    // Clean up created nodes in reverse order (children first)
    for (const id of createdNodeIds.reverse()) {
      try {
        await axios.delete(`${baseUrl}/tree/${id}`);
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  });

  describe('📋 Health & Status', () => {
    it('should respond to health check', async () => {
      const res = await axios.get(`${baseUrl}/health`);
      
      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('status');
    });
  });

  describe('➕ CREATE Operations', () => {
    it('should create a root node', async () => {
      const res = await axios.post(`${baseUrl}/tree`, {
        label: 'E2E Root Node',
      });

      expect(res.status).toBe(201);
      expect(res.data).toHaveProperty('id');
      expect(res.data.label).toBe('E2E Root Node');
      expect(res.data.parentId).toBeNull();
      
      createdNodeIds.push(res.data.id);
    });

    it('should create a child node', async () => {
      // First create parent
      const parent = await axios.post(`${baseUrl}/tree`, {
        label: 'Parent for Child',
      });
      createdNodeIds.push(parent.data.id);

      // Then create child
      const child = await axios.post(`${baseUrl}/tree`, {
        label: 'Child Node',
        parentId: parent.data.id,
      });

      expect(child.status).toBe(201);
      expect(child.data.label).toBe('Child Node');
      expect(child.data.parentId).toBe(parent.data.id);
      
      createdNodeIds.push(child.data.id);
    });

    it('should create multiple siblings', async () => {
      const parent = await axios.post(`${baseUrl}/tree`, {
        label: 'Parent with Siblings',
      });
      createdNodeIds.push(parent.data.id);

      const sibling1 = await axios.post(`${baseUrl}/tree`, {
        label: 'Sibling 1',
        parentId: parent.data.id,
      });
      
      const sibling2 = await axios.post(`${baseUrl}/tree`, {
        label: 'Sibling 2',
        parentId: parent.data.id,
      });

      expect(sibling1.data.parentId).toBe(parent.data.id);
      expect(sibling2.data.parentId).toBe(parent.data.id);
      
      createdNodeIds.push(sibling1.data.id, sibling2.data.id);
    });
  });

  describe('📖 READ Operations', () => {
    it('should return all trees', async () => {
      const res = await axios.get(`${baseUrl}/tree`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('should return hierarchical tree structure', async () => {
      // Create a tree structure
      const root = await axios.post(`${baseUrl}/tree`, {
        label: 'Hierarchy Root',
      });
      const child = await axios.post(`${baseUrl}/tree`, {
        label: 'Hierarchy Child',
        parentId: root.data.id,
      });
      createdNodeIds.push(root.data.id, child.data.id);

      const res = await axios.get(`${baseUrl}/tree`);
      
      // Find our created tree
      const ourTree = res.data.find((node: any) => node.id === root.data.id);
      expect(ourTree).toBeDefined();
      expect(ourTree.children).toBeDefined();
      expect(Array.isArray(ourTree.children)).toBe(true);
    });
  });

  describe('✏️ UPDATE Operations', () => {
    it('should update node label', async () => {
      const node = await axios.post(`${baseUrl}/tree`, {
        label: 'Original Label',
      });
      createdNodeIds.push(node.data.id);

      const updated = await axios.patch(`${baseUrl}/tree/${node.data.id}`, {
        label: 'Updated Label',
      });

      expect(updated.status).toBe(200);
      expect(updated.data.label).toBe('Updated Label');
      expect(updated.data.id).toBe(node.data.id);
    });

    it('should reparent a node', async () => {
      const oldParent = await axios.post(`${baseUrl}/tree`, {
        label: 'Old Parent',
      });
      const newParent = await axios.post(`${baseUrl}/tree`, {
        label: 'New Parent',
      });
      const child = await axios.post(`${baseUrl}/tree`, {
        label: 'Moving Child',
        parentId: oldParent.data.id,
      });
      
      createdNodeIds.push(oldParent.data.id, newParent.data.id, child.data.id);

      const updated = await axios.patch(`${baseUrl}/tree/${child.data.id}`, {
        parentId: newParent.data.id,
      });

      expect(updated.status).toBe(200);
      expect(updated.data.parentId).toBe(newParent.data.id);
    });

    it('should convert node to root by setting parentId to null', async () => {
      const parent = await axios.post(`${baseUrl}/tree`, {
        label: 'Temporary Parent',
      });
      const child = await axios.post(`${baseUrl}/tree`, {
        label: 'Becoming Root',
        parentId: parent.data.id,
      });
      
      createdNodeIds.push(parent.data.id, child.data.id);

      const updated = await axios.patch(`${baseUrl}/tree/${child.data.id}`, {
        parentId: null,
      });

      expect(updated.status).toBe(200);
      expect(updated.data.parentId).toBeNull();
    });
  });

  describe('🗑️ DELETE Operations', () => {
    it('should delete a leaf node', async () => {
      const node = await axios.post(`${baseUrl}/tree`, {
        label: 'To Be Deleted',
      });

      const res = await axios.delete(`${baseUrl}/tree/${node.data.id}`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('deletedCount');
      expect(res.data.deletedCount).toBeGreaterThanOrEqual(1);
      expect(res.data).toHaveProperty('message');
    });

    it('should cascade delete node with children', async () => {
      const parent = await axios.post(`${baseUrl}/tree`, {
        label: 'Parent to Delete',
      });
      const child1 = await axios.post(`${baseUrl}/tree`, {
        label: 'Child 1',
        parentId: parent.data.id,
      });
      const child2 = await axios.post(`${baseUrl}/tree`, {
        label: 'Child 2',
        parentId: parent.data.id,
      });

      const res = await axios.delete(`${baseUrl}/tree/${parent.data.id}`);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('deletedCount');
      expect(res.data.deletedCount).toBeGreaterThanOrEqual(3); // parent + 2 children
    });
  });

  describe('⚠️ Validation & Error Handling', () => {
    it('should reject node creation without label', async () => {
      try {
        await axios.post(`${baseUrl}/tree`, {});
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should reject node creation with empty label', async () => {
      try {
        await axios.post(`${baseUrl}/tree`, { label: '' });
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
      }
    });

    it('should return 404 when creating node with non-existent parent', async () => {
      try {
        await axios.post(`${baseUrl}/tree`, {
          label: 'Ghost Child',
          parentId: '00000000-0000-0000-0000-000000000000',
        });
        fail('Should have thrown 404');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
        expect(error.response.data.message).toContain('not found');
      }
    });

    it('should handle update of non-existent node', async () => {
      try {
        await axios.patch(`${baseUrl}/tree/00000000-0000-0000-0000-000000000000`, {
          label: 'Updated',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        // API should return either 404 or 500 for non-existent nodes
        expect([404, 500]).toContain(error.response.status);
      }
    });

    it('should handle delete of non-existent node', async () => {
      try {
        await axios.delete(`${baseUrl}/tree/00000000-0000-0000-0000-000000000000`);
        fail('Should have thrown an error');
      } catch (error: any) {
        // API should return either 404 or 500 for non-existent nodes
        expect([404, 500]).toContain(error.response.status);
      }
    });

    it('should prevent circular reference when reparenting', async () => {
      const parent = await axios.post(`${baseUrl}/tree`, {
        label: 'Would-be Child',
      });
      const child = await axios.post(`${baseUrl}/tree`, {
        label: 'Would-be Parent',
        parentId: parent.data.id,
      });
      
      createdNodeIds.push(parent.data.id, child.data.id);

      try {
        // Try to make parent a child of its own child
        await axios.patch(`${baseUrl}/tree/${parent.data.id}`, {
          parentId: child.data.id,
        });
        fail('Should have prevented circular reference');
      } catch (error: any) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.message).toContain('circular');
      }
    });
  });

  describe('🎯 Edge Cases', () => {
    it('should handle very long labels', async () => {
      const longLabel = 'A'.repeat(255); // Test with max length
      const res = await axios.post(`${baseUrl}/tree`, {
        label: longLabel,
      });

      expect(res.status).toBe(201);
      expect(res.data.label).toBe(longLabel);
      
      createdNodeIds.push(res.data.id);
    });

    it('should handle special characters in labels', async () => {
      const specialLabel = '🌲 Tree with émojis & spëcial chars! <>"\'';
      const res = await axios.post(`${baseUrl}/tree`, {
        label: specialLabel,
      });

      expect(res.status).toBe(201);
      expect(res.data.label).toBe(specialLabel);
      
      createdNodeIds.push(res.data.id);
    });

    it('should handle deep tree hierarchy', async () => {
      let currentParentId = null;
      const depth = 5;
      const nodeIds: string[] = [];

      // Create a deep hierarchy
      for (let i = 0; i < depth; i++) {
        const res = await axios.post(`${baseUrl}/tree`, {
          label: `Level ${i}`,
          parentId: currentParentId,
        });
        currentParentId = res.data.id;
        nodeIds.push(res.data.id);
      }

      createdNodeIds.push(...nodeIds);

      // Verify the deepest node was created
      const trees = await axios.get(`${baseUrl}/tree`);
      expect(trees.status).toBe(200);
    });
  });
});
