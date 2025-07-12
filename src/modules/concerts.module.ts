import { Module } from '@nestjs/common';
import { ConcertsService } from '../services/concerts.service';
import { ConcertsController } from '../controllers/concerts.controller';
import { ArtistsModule } from './artists.module';
import { ToursModule } from './tours.module';

@Module({
  controllers: [ConcertsController],
  providers: [ConcertsService],
  imports: [ArtistsModule, ToursModule],
})
export class ConcertsModule {}
