import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ArtistRider extends Document {
  @Prop({ required: true })
  artistId: number;

  @Prop({ type: Object })
  hospitality: {
    dressingRooms: number;
    foodPreferences: string[];
    beverageRequirements: string[];
  };

  @Prop({ type: Object })
  technical: {
    soundSystem: string;
    stageDimensions: {
      width: number;
      depth: number;
    };
  };
}

export const ArtistRiderSchema = SchemaFactory.createForClass(ArtistRider);
