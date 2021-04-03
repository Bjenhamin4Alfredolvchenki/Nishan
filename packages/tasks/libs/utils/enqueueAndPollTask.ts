import { INotionEndpointsOptions, NotionEndpoints } from '@nishans/endpoints';
import { IEnqueueTask, TTaskEventName } from '@nishans/types';

interface ITaskCbs<E extends TTaskEventName> {
	success: (task: IEnqueueTask[E]['response']['success']) => any;
	failure: (task: IEnqueueTask[E]['response']['failure']) => any;
	in_progress: (task: IEnqueueTask[E]['response']['in_progress']) => any;
}

export const enqueueAndPollTask = async <E extends TTaskEventName>(
	payload: IEnqueueTask[E]['payload'],
	cbs: Partial<ITaskCbs<E>>,
	options: INotionEndpointsOptions
) => {
	const { taskId } = await NotionEndpoints.Mutations.enqueueTask(payload, options);

	let is_task_in_progress = true;

	while (is_task_in_progress) {
		const { results } = await NotionEndpoints.Queries.getTasks({ taskIds: [ taskId ] }, options);
		if (results[0].state === 'success') {
			is_task_in_progress = false;
			cbs.success && cbs.success(results[0]);
		} else if (results[0].state === 'failure') {
			is_task_in_progress = false;
			cbs.failure && cbs.failure(results[0]);
		} else {
			cbs.in_progress && cbs.in_progress(results[0]);
		}
	}
};
