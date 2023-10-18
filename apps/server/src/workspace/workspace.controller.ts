import { Body, Controller, Get, Post } from '@nestjs/common'
import { WorkspaceService } from './workspace.service'
import { CreateWorkSpaceDTO } from '@/workspace/dtos/create-workspace.dto'

@Controller('workspace')
export class WorkspaceController {
	constructor(private readonly workspaceService: WorkspaceService) {}

	@Get()
	async getWorkSpace() {}

	@Post()
	async createWorkSpace(@Body() createInput: CreateWorkSpaceDTO) {
		return await this.workspaceService.createWorkSpace(createInput)
	}

	@Post()
	async updateWorkSpace() {}
}
