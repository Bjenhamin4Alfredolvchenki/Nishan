import { v4 as uuidv4 } from 'uuid';

import Data from "../api/Data";
import { IPage, ISpace, IRootPage, UpdateCacheManuallyParam, TCollectionViewBlock, CreateRootCollectionViewPageParams, Schema, IOperation } from "../types";

import Collection from "../api/Collection";
import CollectionView from "../api/CollectionView";
import CollectionViewPage from "../api/CollectionViewPage";
import View from "../api/View";
import { createViews } from "../utils";
import RootPage from '../api/RootPage';

type Constructor<T extends IRootPage | IPage | ISpace, E = Data<T>> = new (...args: any[]) => E;

export default function DBArtifacts<T extends IRootPage | IPage | ISpace>(Base: Constructor<T>) {
  return class DBArtifacts extends Base {
    constructor(...args: any[]) {
      super(args[0]);
    }

    async createDBArtifacts(args: [[string, TCollectionViewBlock], string, string[]][]) {
      const update_tables: UpdateCacheManuallyParam = [];
      args.forEach(arg => {
        update_tables.push(arg[0][0]);
        update_tables.push([arg[1], "collection"]);
        arg[2].forEach(view_id => update_tables.push([view_id, "collection_view"]));
      })

      await this.updateCacheManually(update_tables);

      const res: {
        block: CollectionView | CollectionViewPage,
        collection: Collection,
        collection_views: View[]
      }[] = [];

      args.forEach(arg => {
        res.push({
          block: new (arg[0][1] === "collection_view" ? CollectionView : CollectionViewPage)({
            ...this.getProps(),
            id: arg[0][0]
          }),
          collection: new Collection({
            id: arg[1],
            ...this.getProps()
          }),
          collection_views: arg[2].map(view_id => new View({ id: view_id, ...this.getProps() }))
        })
      })
      return res
    }

    async returnArtifacts(manual_res: [IOperation[], UpdateCacheManuallyParam, RootPage][]) {
      const ops: IOperation[] = [], sync_records: UpdateCacheManuallyParam = [], objects: RootPage[] = [];
      manual_res.forEach(manual_res => {
        ops.push(...manual_res[0]);
        sync_records.push(...manual_res[1]);
        objects.push(manual_res[2]);
      })
      await this.saveTransactions(ops);
      await this.updateCacheManually(sync_records);
      return objects;
    }

    createCollection(option: Partial<CreateRootCollectionViewPageParams>, parent_id: string) {
      const { properties, format } = option;

      if (!option.views) option.views = [{
        aggregations: [
          ['title', 'count']
        ],
        name: 'Default View',
        type: 'table'
      }];

      if (!option.schema) option.schema = [
        ['Name', 'title']
      ];
      const schema: Schema = {};

      option.schema.forEach(opt => {
        const schema_key = (opt[1] === "title" ? "Title" : opt[0]).toLowerCase().replace(/\s/g, '_');
        schema[schema_key] = {
          name: opt[0],
          type: opt[1],
          ...(opt[2] ?? {})
        };
        if (schema[schema_key].options) schema[schema_key].options = (schema[schema_key] as any).options.map(([value, color]: [string, string]) => ({
          id: uuidv4(),
          value,
          color
        }))
      });

      const views = option.views.map((view) => ({
        ...view,
        id: uuidv4()
      }));

      return { schema, views: createViews(views, parent_id), properties, format }
    }
  }
}