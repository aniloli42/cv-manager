import { CreateWorkSpaceDTO } from '@/workspace/dtos/create-workspace.dto'
import { Injectable } from '@nestjs/common'

@Injectable()
export class WorkspaceService {
	async createWorkSpace(createInput: CreateWorkSpaceDTO) {
		return `Will be Created ${createInput}`
	}
}
