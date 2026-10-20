import { Query, Resolver } from '@nestjs/graphql';
import { ProfileService } from './profile.service.js';

@Resolver('Profile')
export class ProfileResolver {
  constructor(private readonly profiles: ProfileService) {}

  @Query('profile')
  profile() {
    return this.profiles.getProfile();
  }
}
