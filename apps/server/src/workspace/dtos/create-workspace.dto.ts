import { IsNotEmpty, IsString } from 'class-validator'

export class CreateWorkSpaceDTO {
	@IsString()
	@IsNotEmpty()
	name: string
}
