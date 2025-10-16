import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function main() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not set in environment');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const col = db.collection('bins');

  const indexes = await col.indexes();
  const hasBinId = indexes.find((i) => i.name === 'binId_1');
  if (hasBinId) {
    try {
      await col.dropIndex('binId_1');
      console.log('Dropped legacy index binId_1');
    } catch (e) {
      console.warn('Failed to drop index binId_1:', e.message);
    }
  } else {
    console.log('No legacy index binId_1 found');
  }

  const hasQrCode = indexes.find((i) => i.name === 'qrCode_1' || (i.key && Object.prototype.hasOwnProperty.call(i.key, 'qrCode')));
  if (hasQrCode) {
    try {
      await col.dropIndex('qrCode_1');
      console.log('Dropped legacy index qrCode_1');
    } catch (e) {
      // Attempt by key spec as fallback
      try {
        await col.dropIndex({ qrCode: 1 });
        console.log('Dropped legacy index on { qrCode: 1 }');
      } catch (e2) {
        console.warn('Failed to drop qrCode index:', e2.message);
      }
    }
  } else {
    console.log('No legacy index qrCode_1 found');
  }

  // Optional: drop geospatial leftovers from earlier schema versions
  const geoIdx = indexes.find((i) => i.name && i.name.includes('2dsphere'));
  if (geoIdx && geoIdx.name) {
    try {
      await col.dropIndex(geoIdx.name);
      console.log(`Dropped legacy geospatial index ${geoIdx.name}`);
    } catch (e) {
      console.warn('Failed to drop legacy geospatial index:', e.message);
    }
  }

  // Ensure a proper unique index on bin code
  try {
    await col.createIndex({ code: 1 }, { unique: true, name: 'code_1' });
    console.log('Ensured unique index on code');
  } catch (e) {
    console.warn('Failed to ensure unique index on code:', e.message);
  }

  await mongoose.disconnect();
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
