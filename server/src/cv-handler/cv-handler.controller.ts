import { Body, Controller, Get, Post } from '@nestjs/common'
import { CvHandlerService } from './cv-handler.service'
import { CVInputDTO } from './dtos/body-input.input'

@Controller()
export class CvHandlerController {
  constructor(private readonly cvHandlerService: CvHandlerService) {}

  @Post('cv')
  async handleCVMatching(@Body() input: CVInputDTO) {
    return await this.cvHandlerService.handleCVMatching(input)
  }

  @Get('fetch-files')
  async fetchFiles() {
    return await this.cvHandlerService.fetchedFiles()
  }

  @Post('clean-errors')
  async cleanErros() {
    return await this.cvHandlerService.cleanErrors()
  }
}
