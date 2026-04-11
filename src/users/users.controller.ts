import {
  Controller, Get, Patch, Delete, Body, Param,
  UseGuards, ClassSerializerInterceptor, UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    const { currentPassword, newPassword, confirmNew, ...data } = body;
    return this.usersService.update(id, data);
  }

  @Patch(':id/password')
  changePassword(@Param('id') id: string, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.usersService.changePassword(id, body.currentPassword, body.newPassword);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
