import { Controller, Get, Post } from '@nestjs/common';
import { ProjectsService } from './projects.service';


@Controller('projects')
export class ProjectsController {
    constructor(
        private readonly projectsService: ProjectsService
    ) {}
    @Get('cache')
    async getProjectsUsingCache()  {
        const projects = await this.projectsService.getProjectsFromRedis();
        if (!projects) {
            // const githubProjects = await this.projectsService.fetchPortfolioReadyProjects();
            // if (githubProjects.error) {
            //     return { error: githubProjects.error };
            // }
            return { data: "cache miss" };
        }
        return { data: projects };
    }
    // @Get()
    // async getProjects() {
    //     const githubProjects = await this.projectsService.fetchPortfolioReadyProjects();
    //     if (githubProjects.error) {
    //         return { error: githubProjects.error };
    //     }
    //     return { data: githubProjects.data };
    // }
    // @Post('refresh')
    // async refreshProjects() {
    //     await this.projectsService.refreshProjectsRedis();
    //     return { message: 'Projects refreshed' };
    // }
}
