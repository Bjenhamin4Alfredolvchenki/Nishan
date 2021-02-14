import { IViewFilter } from '@nishans/types';
import deepEqual from 'deep-equal';
import { getSchemaMap, populateFilters } from '../../src';

const schema_map = getSchemaMap({
	title: {
		type: 'text',
		name: 'Title'
	},
	text: {
		type: 'text',
		name: 'Text'
	}
});

describe('populateFilters', () => {
	it(`Should populate unnested filter`, () => {
		const parent_filter: IViewFilter = {
			operator: 'and',
			filters: []
		};

		populateFilters(
			[
				{
					filter: {
						operator: 'string_is',
						value: {
							type: 'exact',
							value: '123'
						}
					},
					name: 'Title',
					type: 'text'
				}
			],
			parent_filter.filters,
			schema_map
		);

		expect(
			deepEqual(parent_filter, {
				operator: 'and',
				filters: [
					{
						property: 'title',
						filter: {
							operator: 'string_is',
							value: {
								type: 'exact',
								value: '123'
							}
						}
					}
				]
			})
		).toBe(true);
	});

	it(`Should populate nested filter`, () => {
		const parent_filter: IViewFilter = {
			operator: 'and',
			filters: []
		};
		populateFilters(
			[
				{
					filter: {
						operator: 'string_is',
						value: {
							type: 'exact',
							value: '123'
						}
					},
					children: [
						{
							filter: {
								operator: 'string_contains',
								value: {
									type: 'exact',
									value: '123'
								}
							},
							name: 'Text',
							type: 'text',
							filter_operator: 'or'
						}
					],
					name: 'Title',
					type: 'text'
				}
			],
			parent_filter.filters,
			schema_map
		);

		expect(
			deepEqual(parent_filter, {
				operator: 'and',
				filters: [
					{
						filters: [
							{
								property: 'title',
								filter: {
									operator: 'string_is',
									value: {
										type: 'exact',
										value: '123'
									}
								}
							},
							{
								property: 'text',
								filter: {
									operator: 'string_contains',
									value: {
										type: 'exact',
										value: '123'
									}
								}
							}
						],
						operator: 'or'
					}
				]
			})
		);
	});

	it(`Should populate unnested filter when using position`, () => {
		const parent_filter: IViewFilter = {
			operator: 'and',
			filters: [
				{
					property: 'text',
					filter: {
						operator: 'string_is',
						value: {
							type: 'exact',
							value: '123'
						}
					}
				}
			]
		};

		populateFilters(
			[
				{
					filter: {
						operator: 'string_is',
						value: {
							type: 'exact',
							value: '123'
						}
					},
					name: 'Title',
					type: 'text',
					position: 0
				}
			],
			parent_filter.filters,
			schema_map
		);

		expect(
			deepEqual(parent_filter, {
				operator: 'and',
				filters: [
					{
						property: 'title',
						filter: {
							operator: 'string_is',
							value: {
								type: 'exact',
								value: '123'
							}
						}
					},
					{
						property: 'text',
						filter: {
							operator: 'string_is',
							value: {
								type: 'exact',
								value: '123'
							}
						}
					}
				]
			})
		).toBe(true);
	});

	it(`Should throw an error if unknown property is referenced`, () => {
		expect(() =>
			populateFilters(
				[
					{
						filter: {
							operator: 'string_is',
							value: {
								type: 'exact',
								value: '123'
							}
						},
						name: 'Texto',
						type: 'text'
					}
				],
				[],
				schema_map
			)
		).toThrow(`Unknown property Texto referenced`);
	});
});