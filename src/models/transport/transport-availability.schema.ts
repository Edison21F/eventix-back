import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class TransportAvailability extends Document {
  @Prop({ required: true })
  scheduleId: number;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: Map, of: Number })
  availableSeats: Map<string, number>; // {"ECONOMY": 24, "BUSINESS": 12}

  @Prop()
  overbooked: boolean;

  @Prop({ type: Object })
  vehicleAssignment: {
    vehicleId: number;
    driverId: number;
  };

  @Prop()
  lastUpdated: Date;
}

export const TransportAvailabilitySchema = SchemaFactory.createForClass(TransportAvailability);
