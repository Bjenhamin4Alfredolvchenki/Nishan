const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const CollectionBlock = require('../CollectionBlock');
const Transaction = require('../Transaction');

const { error, warn } = require('../../utils/logs');

class CollectionViewPage extends CollectionBlock {
	constructor (block_data) {
		super(block_data);
		if (block_data.type !== 'collection_view_page')
			throw new Error(error(`Cannot create collection_view_page block from ${block_data.type} block`));
	}

	static setStatic (obj) {
		Object.entries(obj).forEach(([ key, value ]) => (CollectionViewPage[key] = value));
		return CollectionViewPage;
	}
}

module.exports = CollectionViewPage;
