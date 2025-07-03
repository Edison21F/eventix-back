import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class MovieMetadata extends Document {
  @Prop({ required: true })
  movieId: number;

  @Prop({ type: Object })
  cast: {
    actor: string;
    character: string;
    photoUrl: string;
  }[];

  @Prop()
  imdbRating?: number;

  @Prop()
  synopsis: string;

  @Prop({ type: Object })
  technicalSpecs: {
    aspectRatio: string;
    filmFormat: string;
  };
}

export const MovieMetadataSchema = SchemaFactory.createForClass(MovieMetadata);
