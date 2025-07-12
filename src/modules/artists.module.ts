import { Module } from '@nestjs/common';
import { ArtistsService } from '../services/artists.service';
import { ArtistsController } from '../controllers/artists.controller';

@Module({
  controllers: [ArtistsController],
  providers: [ArtistsService],
})
export class ArtistsModule {}
