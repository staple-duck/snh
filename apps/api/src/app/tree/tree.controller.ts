import { Controller, Get, Post, Body, Patch, Delete, Param } from '@nestjs/common';
import { TreeService } from './tree.service';
import { CreateTreeNodeDto, UpdateTreeNodeDto } from '@snh/shared-types';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('tree')
@Controller('tree')
export class TreeController {
  constructor(private readonly treeService: TreeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tree node' })
  @ApiResponse({ status: 201, description: 'The node has been successfully created.' })
  @ApiResponse({ status: 404, description: 'Parent node not found.' })
  create(@Body() createTreeNodeDto: CreateTreeNodeDto) {
    return this.treeService.create(createTreeNodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all trees' })
  @ApiResponse({ status: 200, description: 'Return all trees.' })
  findAll() {
    return this.treeService.findAll();
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a tree node (change label or reparent)' })
  @ApiResponse({ status: 200, description: 'The node has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Node or parent not found.' })
  @ApiResponse({ status: 400, description: 'Invalid operation (circular reference or self-parent).' })
  update(@Param('id') id: string, @Body() updateTreeNodeDto: UpdateTreeNodeDto) {
    return this.treeService.update(id, updateTreeNodeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tree node and all its descendants' })
  @ApiResponse({ status: 200, description: 'The node and its descendants have been deleted.' })
  @ApiResponse({ status: 404, description: 'Node not found.' })
  remove(@Param('id') id: string) {
    return this.treeService.delete(id);
  }
}
