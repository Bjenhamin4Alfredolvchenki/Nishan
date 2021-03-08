import { TView } from '@nishans/types';
import { TViewExtracted } from '../..';

export const extractViewsData = (views_data: TView[] | TViewExtracted[]) => {
	return (views_data as any).map((view_data: any) => {
		return {
			type: view_data.type,
			name: view_data.name,
			format: view_data.format,
			query2: view_data.query2
		};
	});
};
