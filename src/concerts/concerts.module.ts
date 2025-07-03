import { Module } from '@nestjs/common';
import { ConcertsService } from './concerts.service';
import { ConcertsController } from './concerts.controller';
import { ArtistsModule } from './artists/artists.module';
import { ToursModule } from './tours/tours.module';

@Module({
  controllers: [ConcertsController],
  providers: [ConcertsService],
  imports: [ArtistsModule, ToursModule],
})
export class ConcertsModule {}
