import { Operation } from '@nishans/operations';
import { IOperation, TData } from '@nishans/types';

export function updateChildContainer<T extends TData> (
	data: T,
	keep: boolean,
	id: string,
	child_path: keyof T & string,
	stack: IOperation[]
) {
	const container = (data[child_path] as unknown) as string[];
	if (!keep && container.includes(id)) {
		data[child_path] = container.filter((page_id) => page_id !== id) as any;
		stack.push(
			Operation.space_view.listRemove(data.id, [ child_path ], {
				id
			})
		);
	} else if (keep && !container.includes(id)) {
		container.push(id);
		stack.push(
			Operation.space_view.listAfter(data.id, [ child_path ], {
				id
			})
		);
	}
}