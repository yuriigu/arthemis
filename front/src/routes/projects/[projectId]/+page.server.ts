import { getProject } from "$lib/server/arthemis-api";
import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
    const token = event.locals.token;
    const projectId = Number(event.params.projectId)

    if (!projectId) {
        error(400, '"projectId" not specificed');
    }

    try {
        const project = await getProject(projectId, token);

        if (!project) {
            error(404, 'project not found');
        }


        return {
            project
        };
    } catch (err: unknown) {
        error(500, 'Internal Server Error');
    }
};
