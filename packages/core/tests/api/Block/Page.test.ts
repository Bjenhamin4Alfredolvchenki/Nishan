import { ICache, NotionCacheObject } from '@nishans/cache';
import { NotionOperationsObject } from '@nishans/operations';
import { v4 } from 'uuid';
import { NotionData, Page } from '../../../libs';
import { default_nishan_arg, last_edited_props, o } from '../../utils';

afterEach(() => {
	jest.restoreAllMocks();
});

const construct = () => {
	const space_1 = {
			id: 'space_1'
		},
		block_1 = { id: 'block_1', parent_table: 'space', parent_id: 'space_1', type: 'page', content: [ 'block_2' ] },
		block_2 = { id: 'block_2', type: 'header', properties: { title: [ [ 'Header' ] ] } } as any,
		cache = {
			...NotionCacheObject.createDefaultCache(),
			block: new Map([ [ 'block_1', block_1 ], [ 'block_2', block_2 ] ]),
			space: new Map([ [ 'space_1', space_1 ] ])
		} as any,
		executeOperationsMock = jest
			.spyOn(NotionOperationsObject, 'executeOperations')
			.mockImplementation(async () => undefined),
		initializeCacheForSpecificDataMock = jest
			.spyOn(NotionData.prototype, 'initializeCacheForSpecificData')
			.mockImplementationOnce(async () => undefined);

	const page = new Page({
		...default_nishan_arg,
		cache
	});
	return { space_1, cache, block_1, block_2, page, initializeCacheForSpecificDataMock, executeOperationsMock };
};

it(`getCachedParentData`, async () => {
	const { space_1, page } = construct();
	const space = await page.getCachedParentData();
	expect(space).toStrictEqual(space_1);
});

it(`createBlocks`, async () => {
	const { page, cache } = construct();
	const id = v4();
	const block_map = await page.createBlocks([
		{
			id,
			type: 'header',
			properties: {
				title: [ [ 'Header' ] ]
			}
		}
	]);
	expect(block_map.header.get('Header')).not.toBeUndefined();
	expect(block_map.header.get(id)).not.toBeUndefined();
	expect(cache.block.get(id)).not.toBeUndefined();
});

it(`getBlock`, async () => {
	const { page, initializeCacheForSpecificDataMock } = construct();

	const block_map = await page.getBlock('block_2');

	expect(initializeCacheForSpecificDataMock).toHaveBeenCalledWith('block_1', 'block');
	expect(block_map.header.get('block_2')).not.toBeUndefined();
	expect(block_map.header.get('Header')).not.toBeUndefined();
});

it(`updateBlock`, async () => {
	const { block_2, page, executeOperationsMock, initializeCacheForSpecificDataMock } = construct();

	const block_map = await page.updateBlock([ 'block_2', { alive: false } as any ]);

	expect(initializeCacheForSpecificDataMock).toHaveBeenCalledWith('block_1', 'block');
	expect(block_map.header.get('block_2')).not.toBeUndefined();
	expect(block_2.alive).toBe(false);
	expect(executeOperationsMock.mock.calls[0][0]).toStrictEqual([
		o.b.u(
			'block_2',
			[],
			expect.objectContaining({
				alive: false
			})
		),
		o.b.u('block_1', [], last_edited_props)
	]);
});

it(`deleteBlock`, async () => {
	const { block_2, page, executeOperationsMock, initializeCacheForSpecificDataMock } = construct();

	await page.deleteBlock('block_2');

	expect(initializeCacheForSpecificDataMock).toHaveBeenCalledWith('block_1', 'block');
	expect(block_2.alive).toBe(false);
	expect(executeOperationsMock).toHaveBeenCalledTimes(2);
	expect(executeOperationsMock.mock.calls[1][0]).toStrictEqual([
		o.b.u(
			'block_2',
			[],
			expect.objectContaining({
				alive: false
			})
		),
		o.b.u('block_1', [], last_edited_props)
	]);
});

it(`updateBookmarkedStatus`, async () => {
	const space_view_1 = { space_id: 'space_1', id: 'space_view_1', bookmarked_pages: [ 'block_1' ] },
		cache: ICache = {
			...NotionCacheObject.createDefaultCache(),
			block: new Map([ [ 'block_1', { id: 'block_1', type: 'page', space_id: 'space_1' } as any ] ]),
			space_view: new Map([
				[ 'space_view_2', { id: 'space_view_2', space_id: 'space_2' } ],
				[ 'space_view_1', space_view_1 as any ]
			])
		},
		executeOperationsMock = jest
			.spyOn(NotionOperationsObject, 'executeOperations')
			.mockImplementation(async () => undefined);

	const logger_spy = jest.fn();

	const page = new Page({
		...default_nishan_arg,
		cache,
		logger: logger_spy
	});

	await page.updateBookmarkedStatus(false);

	expect(executeOperationsMock).toHaveBeenCalledTimes(1);
});