import { PartialType } from '@nestjs/mapped-types';
import { CreateArtistDto } from '../create/create-artist.dto';

export class UpdateArtistDto extends PartialType(CreateArtistDto) {}
