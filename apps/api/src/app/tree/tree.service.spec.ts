import { Test, TestingModule } from '@nestjs/testing';
import { TreeService } from './tree.service';
import { PrismaService } from '@snh/database';

describe('TreeService', () => {
  let service: TreeService;
  let prisma: PrismaService;

  const mockPrismaService = {
    treeNode: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TreeService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TreeService>(TreeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('buildTree', () => {
    it('should transform a flat list into a hierarchical tree', () => {
      const flatNodes = [
        { id: 1, label: 'root', parentId: null },
        { id: 2, label: 'child 1', parentId: 1 },
        { id: 3, label: 'grandchild', parentId: 2 },
        { id: 4, label: 'child 2', parentId: 1 },
      ];

      const tree = (service as any).buildTree(flatNodes);

      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(1);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].id).toBe(2);
      expect(tree[0].children[0].children).toHaveLength(1);
      expect(tree[0].children[0].children[0].id).toBe(3);
    });

    it('should handle multiple roots', () => {
      const flatNodes = [
        { id: 1, label: 'root 1', parentId: null },
        { id: 2, label: 'root 2', parentId: null },
      ];

      const tree = (service as any).buildTree(flatNodes);

      expect(tree).toHaveLength(2);
      expect(tree[0].id).toBe(1);
      expect(tree[1].id).toBe(2);
    });

    it('should return empty array for empty input', () => {
      const tree = (service as any).buildTree([]);
      expect(tree).toEqual([]);
    });
  });
});
