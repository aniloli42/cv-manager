import { IsArray, IsNotEmpty } from 'class-validator';

export class CVInputDTO {
  @IsArray()
  @IsNotEmpty()
  tags: string[];
}
