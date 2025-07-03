import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ConcertWeather extends Document {
  @Prop({ required: true })
  concertId: number;

  @Prop({ type: Object })
  forecast: {
    temperatureC: number;
    condition: 'SUNNY' | 'RAINY' | 'CLOUDY';
    precipitationChance: number;
    windSpeedKmh: number;
  };

  @Prop()
  lastUpdated: Date;

  @Prop()
  contingencyPlan?: string; // "Indoor backup available"
}

export const ConcertWeatherSchema = SchemaFactory.createForClass(ConcertWeather);
