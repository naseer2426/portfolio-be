import { Controller, Get } from '@nestjs/common';

@Controller('projects')
export class ProjectsController {
    @Get()
    getProjects()  {
        return {code:200};
    }
}
