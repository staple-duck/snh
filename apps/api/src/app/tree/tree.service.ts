import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@snh/database';
import { CreateTreeNodeDto, UpdateTreeNodeDto, TreeNode, DeleteResponse } from '@snh/shared-types';
import { Prisma } from '@prisma/client';

@Injectable()
export class TreeService {
  constructor(private prisma: PrismaService) {}

  private async nodeExists(nodeId: string): Promise<boolean> {
    const node = await this.prisma.treeNode.findUnique({
      where: { id: nodeId },
      select: { id: true }
    });
    return !!node;
  }

  async create(createTreeNodeDto: CreateTreeNodeDto) {
    const { label, parentId } = createTreeNodeDto;

    if (parentId) {
      const exists = await this.nodeExists(parentId);
      if (!exists) {
        throw new NotFoundException('Parent node not found');
      }
    }

    return this.prisma.treeNode.create({
      data: {
        label,
        parentId: parentId || null
      },
    });
  }

  async findAll(): Promise<TreeNode[]> {
    const nodes = await this.prisma.treeNode.findMany();
    return this.buildTree(nodes);
  }

  async update(id: string, updateTreeNodeDto: UpdateTreeNodeDto) {
    const { label, parentId } = updateTreeNodeDto;

    await this.prisma.treeNode.findUniqueOrThrow({ where: { id } });

    if (parentId !== undefined && parentId !== null) {
      if (parentId === id) {
        throw new BadRequestException('Node cannot be its own parent');
      }

      const exists = await this.nodeExists(parentId);
      if (!exists) {
        throw new NotFoundException('Parent node not found');
      }

      const wouldCreateCycle = await this.isDescendant(id, parentId);
      if (wouldCreateCycle) {
        throw new BadRequestException('Cannot create circular reference');
      }
    }

    return this.prisma.treeNode.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(parentId !== undefined && { parentId })
      },
    });
  }

  async delete(id: string): Promise<DeleteResponse> {
    await this.prisma.treeNode.findUniqueOrThrow({ where: { id } });

    const descendantCount = await this.countDescendants(id);
    await this.prisma.treeNode.delete({ where: { id } });

    return {
      id,
      deletedCount: descendantCount + 1,
      message: `Successfully deleted node ${id} and ${descendantCount} descendant(s)`,
    };
  }

  private async isDescendant(ancestorId: string, targetId: string): Promise<boolean> {
    // Use recursive CTE to check if targetId is an ancestor of ancestorId
    // This would create a circular reference if true
    const result = await this.prisma.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE descendants AS (
        SELECT id, "parentId"
        FROM "TreeNode"
        WHERE id = ${ancestorId}::uuid
        
        UNION ALL
        
        SELECT t.id, t."parentId"
        FROM "TreeNode" t
        INNER JOIN descendants d ON t."parentId" = d.id
      )
      SELECT id FROM descendants WHERE id = ${targetId}::uuid
    `;
    
    return result.length > 0;
  }

  private async countDescendants(nodeId: string): Promise<number> {
    // Use recursive CTE to count all descendants efficiently
    const result = await this.prisma.$queryRaw<Array<{ count: bigint }>>`
      WITH RECURSIVE descendants AS (
        SELECT id, "parentId"
        FROM "TreeNode"
        WHERE "parentId" = ${nodeId}::uuid
        
        UNION ALL
        
        SELECT t.id, t."parentId"
        FROM "TreeNode" t
        INNER JOIN descendants d ON t."parentId" = d.id
      )
      SELECT COUNT(*)::int as count FROM descendants
    `;
    
    return result[0] ? Number(result[0].count) : 0;
  }

  private buildTree(nodes: Prisma.TreeNodeGetPayload<object>[]): TreeNode[] {
    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    nodes.forEach((node) => {
      map.set(node.id, {
        id: node.id,
        label: node.label,
        parentId: node.parentId,
        children: [],
      });
    });

    nodes.forEach((node) => {
      const treeNode = map.get(node.id)!;
      if (node.parentId === null) {
        roots.push(treeNode);
      } else {
        const parent = map.get(node.parentId);
        if (parent) {
          parent.children!.push(treeNode);
        } else {
          roots.push(treeNode);
        }
      }
    });

    return roots;
  }
}
