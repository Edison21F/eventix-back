import { MongooseModuleOptions } from '@nestjs/mongoose';
import { key } from './key';

export const mongooseConfig: MongooseModuleOptions = {
  uri: key.mongo.url, // URI de conexión a MongoDB
  retryAttempts: 3,
  retryDelay: 1000,
  autoIndex: true, // Solo desarrollo
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  dbName: 'event_metadata',
};

// Colecciones requeridas
export const requiredCollections = [
  'artist_riders',
  'concert_weather',
  'transport_availabilities'
];
