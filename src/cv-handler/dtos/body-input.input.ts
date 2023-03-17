import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CVInputDTO {
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @IsArray()
  @IsNotEmpty()
  tags: string[];
}
