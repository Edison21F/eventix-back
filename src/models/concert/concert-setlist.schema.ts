import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class ConcertSetlist extends Document {
  @Prop({ required: true })
  concertId: number;

  @Prop([{
    song: String,
    duration: Number,
    isEncore: Boolean
  }])
  songs: {
    song: string;
    duration: number;
    isEncore: boolean;
  }[];
}

export const ConcertSetlistSchema = SchemaFactory.createForClass(ConcertSetlist);
