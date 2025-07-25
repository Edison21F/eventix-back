import { Injectable } from '@nestjs/common';
import { CreateArtistDto } from '../Dto/create/create-artist.dto';
import { UpdateArtistDto } from '../Dto/update/update-artist.dto';

@Injectable()
export class ArtistsService {
  create(createArtistDto: CreateArtistDto) {
    return 'This action adds a new artist';
  }

  findAll() {
    return `This action returns all artists`;
  }

  findOne(id: number) {
    return `This action returns a #${id} artist`;
  }

  update(id: number, updateArtistDto: UpdateArtistDto) {
    return `This action updates a #${id} artist`;
  }

  remove(id: number) {
    return `This action removes a #${id} artist`;
  }
}
