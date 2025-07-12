import { MongooseModuleOptions } from '@nestjs/mongoose';
import { key } from '../key';

export const mongooseConfig: MongooseModuleOptions = {
  uri: key.mongo.url,
  retryAttempts: 3,
  retryDelay: 1000,
  autoIndex: true,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  dbName: 'event_metadata',
  connectionFactory: (connection) => {
    connection.on('connected', () => {
      console.log('✅ Conexión con MongoDB exitosa');
    });
    connection.on('error', (error) => {
      console.error('❌ Error de conexión con MongoDB:', error.message);
    });
    return connection;
  }
};

export const requiredCollections = [
  'artist_riders',
  'concert_weather',
  'transport_availabilities'
  
];
