import { IsString, IsOptional, IsUUID, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTreeNodeDto {
  @ApiProperty({ example: 'Root Node', description: 'The label of the tree node' })
  @IsString()
  @MinLength(1)
  label!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The UUID of the parent node', required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

export class UpdateTreeNodeDto {
  @ApiProperty({ example: 'Updated Node', description: 'The new label of the tree node', required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'The new parent UUID', required: false, nullable: true })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}

export interface TreeNode {
  id: string;
  label: string;
  parentId: string | null;
  children?: TreeNode[];
}

export interface DeleteResponse {
  id: string;
  deletedCount: number;
  message: string;
}
