import { PartialType } from '@nestjs/mapped-types';
import { CreateMovieDto } from '../create/create-movie.dto';

export class UpdateMovieDto extends PartialType(CreateMovieDto) {}
