// ====================================================
// Firestore Service — Syncs DB with Firebase
// ====================================================

const FirestoreService = {
  // Load all collections from Firestore into DB
  async loadAll() {
    const collections = ['hospitals','doctors','patients','appointments','medicines','bills','reports','beds','prescriptions'];
    for (const col of collections) {
      try {
        const snap = await db.collection(col).get();
        if (!snap.empty) {
          const firestoreIds = new Set();
          snap.forEach(doc => {
            const data = doc.data();
            data.id = doc.id;
            firestoreIds.add(doc.id);
            const existingIdx = DB[col].findIndex(x => x.id === doc.id);
            if (existingIdx >= 0) {
              DB[col][existingIdx] = data;
            } else {
              DB[col].push(data);
            }
          });
          DB[col] = DB[col].filter(x => !x.id || firestoreIds.has(x.id));
        }
      } catch (e) {
        console.warn(`Failed to load ${col}:`, e.message);
      }
    }
    console.log('Firestore: All collections loaded into DB');
    return true;
  },

  // Save a document to Firestore
  async save(collection, data) {
    try {
      if (data.id) {
        await db.collection(collection).doc(data.id).set(data, { merge: true });
      } else {
        const ref = await db.collection(collection).add(data);
        data.id = ref.id;
      }
      if (typeof DB !== 'undefined' && DB.saveCache) DB.saveCache();
      return data;
    } catch (e) {
      console.error(`Firestore save error (${collection}):`, e);
      return null;
    }
  },

  // Delete a document
  async remove(collection, id) {
    try {
      await db.collection(collection).doc(id).delete();
      return true;
    } catch (e) {
      console.error(`Firestore delete error (${collection}):`, e);
      return false;
    }
  },

  // Sync a specific DB array to Firestore
  async syncCollection(collection, dataArray) {
    let count = 0;
    for (const item of dataArray) {
      const saved = await this.save(collection, item);
      if (saved) count++;
    }
    console.log(`Firestore: Synced ${count}/${dataArray.length} ${collection}`);
    return count;
  },

  // Upload entire DB to Firestore (first-time seed)
  async seedAll() {
    const collections = ['hospitals','doctors','patients','appointments','medicines','bills','reports','beds','prescriptions'];
    let total = 0;
    for (const col of collections) {
      if (DB[col] && DB[col].length) {
        const count = await this.syncCollection(col, DB[col]);
        total += count;
      }
    }
    console.log(`Firestore: Seeded ${total} documents total`);
    return total;
  },

  // Real-time listener for a collection
  onSnapshot(collection, callback) {
    return db.collection(collection).onSnapshot(snap => {
      const items = [];
      snap.forEach(doc => {
        const data = doc.data();
        data.id = doc.id;
        items.push(data);
      });
      DB[collection] = items;
      if (callback) callback(items);
    });
  }
};
