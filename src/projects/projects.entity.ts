export type Project = {
    title: string;
    description: string | null;
    images?: string[];
    projectLink: string | null;
    githubLink: string;
    tags?: string[];
}

export type FetchProjectsResp = {
    data?: Project[];
    error?: string;
}
