import { getUserDetails } from '$lib/common';
import * as db from '$lib/database';
import { PrismaErrorHandler } from '$lib/database';
import type { RequestHandler } from '@sveltejs/kit';

export const get: RequestHandler = async (event) => {
	const { teamId, status, body } = await getUserDetails(event);
	if (status === 401) return { status, body };

	const { id } = event.params;

	const repository = event.url.searchParams.get('repository')?.toLocaleLowerCase() || undefined;
	const branch = event.url.searchParams.get('branch')?.toLocaleLowerCase() || undefined;

	try {
		const found = await db.isBranchAlreadyUsed({ repository, branch, id });
		if (found) {
			throw {
				error: `Branch ${branch} is already used by another application`
			};
		}
		return {
			status: 200
		};
	} catch (error) {
		return PrismaErrorHandler(error);
	}
};

export const post: RequestHandler = async (event) => {
	const { teamId, status, body } = await getUserDetails(event);
	if (status === 401) return { status, body };

	const { id } = event.params;
	let { repository, branch, projectId, webhookToken } = await event.request.json();

	repository = repository.toLowerCase();
	branch = branch.toLowerCase();
	projectId = Number(projectId);

	try {
		await db.configureGitRepository({ id, repository, branch, projectId, webhookToken });
		return { status: 201 };
	} catch (error) {
		return PrismaErrorHandler(error);
	}
};
