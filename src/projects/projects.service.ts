import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Project,FetchProjectsResp } from './projects.entity';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import * as emoji from 'node-emoji'
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

const USERNAME = 'naseer2426';
const PORTFOLIO_READY_TOPIC = 'portfolio-ready';
@Injectable()
export class ProjectsService {
    private readonly octokit:Octokit
    constructor(
        private readonly configService: ConfigService,
        @InjectRedis() private readonly redis: Redis
    ) {
        this.octokit = new Octokit({
            auth: this.configService.get<string>('GITHUB_TOKEN'),
        });
    }

    async refreshProjectsRedis() {
        const projects = await this.fetchPortfolioReadyProjects();
        if (projects.error) {
            console.error(projects.error);
            return;
        }
        await this.setProjectsToRedis(projects.data);
        console.log('Projects refreshed');
    }

    async setProjectsToRedis(projects:Project[]) {
        await this.redis.set('projects', JSON.stringify(projects));
    }

    async getProjectsFromRedis():Promise<Project[]> {
        const projects = await this.redis.get('projects');
        return JSON.parse(projects);
    }

    async fetchPortfolioReadyProjects():Promise<FetchProjectsResp> {
        try {
          const { data } = await this.octokit.rest.search.repos({
              q:`${PORTFOLIO_READY_TOPIC} in:topics user:${USERNAME}`,
              per_page: 100,
          });
      
          let projects:Project[] = []
          for (const repo of data.items) {
              const { data: languages } = await this.octokit.rest.repos.listLanguages({
                  owner: USERNAME,
                  repo: repo.name,
              });
              const topics = repo.topics?.filter((topic) => topic !== PORTFOLIO_READY_TOPIC) || [];
              const tags = topics.concat(Object.keys(languages));
      
              const imageUrls = await this.getRepositoryReadmeImages(USERNAME, repo.name, repo.default_branch);
      
              projects.push({
                  title: emoji.emojify(repo.name),
                  description: emoji.emojify(repo.description? repo.description : ""),
                  projectLink: repo.homepage,
                  githubLink: repo.html_url,
                  tags: tags,
                  images: imageUrls,
              });
          }
          return {data: projects};
        } catch (error:any) {
          return {error: error.message};
        }
      }
      
      
      async getRepositoryReadmeImages(owner: string, repo: string, defaultBranch: string):Promise<string[]> {
          const { data } = await this.octokit.rest.repos.getReadme({
              owner,
              repo,
          });
          const readme = Buffer.from(data.content, "base64").toString('utf-8');
          const imageUrls = [];
          const imageRegex = /!\[.*?\]\((.*?)\)/g;
          let match;
          while ((match = imageRegex.exec(readme)) !== null) {
              const url = this.getFullImageUrl(owner, repo, match[1], defaultBranch);
              imageUrls.push(url);
          }
          return imageUrls;
      }
      
      getFullImageUrl(owner: string, repo: string, path: string, defaultBranch: string):string {
          if (path.startsWith("http")) {
              return path;
          }
          return `https://github.com/${owner}/${repo}/blob/${defaultBranch}/${path}?raw=true`;
      }
}
