const path = require('path');
const { LocalStorage } = require('node-localstorage');

const { COLLECTIONS } = require('../config/constants');

class LocalStorageDB {
  constructor() {
    this.storage = new LocalStorage(
      path.resolve(__dirname, '../../data/localStorage')
    );

    Object.values(COLLECTIONS).forEach((collection) => {
      if (this.storage.getItem(collection) === null) {
        this._writeCollection(collection, []);
      }
    });
  }

  _readCollection(collection) {
    const rawValue = this.storage.getItem(collection);

    if (!rawValue) {
      return [];
    }

    try {
      const parsedValue = JSON.parse(rawValue);
      return Array.isArray(parsedValue) ? parsedValue : [];
    } catch (error) {
      return [];
    }
  }

  _writeCollection(collection, items) {
    this.storage.setItem(collection, JSON.stringify(items));
  }

  getAll(collection) {
    return this._readCollection(collection);
  }

  getById(collection, id) {
    return this.getAll(collection).find((item) => item.id === id) || null;
  }

  getByField(collection, field, value) {
    return this.getAll(collection).find((item) => item[field] === value) || null;
  }

  create(collection, item) {
    const items = this.getAll(collection);
    items.push(item);
    this._writeCollection(collection, items);
    return item;
  }

  update(collection, id, updates) {
    const items = this.getAll(collection);
    const itemIndex = items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return null;
    }

    const updatedItem = {
      ...items[itemIndex],
      ...updates,
    };

    items[itemIndex] = updatedItem;
    this._writeCollection(collection, items);

    return updatedItem;
  }

  delete(collection, id) {
    const items = this.getAll(collection);
    const filteredItems = items.filter((item) => item.id !== id);
    const itemDeleted = filteredItems.length !== items.length;

    if (itemDeleted) {
      this._writeCollection(collection, filteredItems);
    }

    return itemDeleted;
  }

  query(collection, filterFn) {
    return this.getAll(collection).filter(filterFn);
  }
}

module.exports = new LocalStorageDB();
