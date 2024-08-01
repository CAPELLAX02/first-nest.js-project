import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthDto } from './dto';
import * as argon from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async signup(dto: AuthDto) {
    try {
      // Generate the password
      const hash = await argon.hash(dto.password);

      // Save the new user in the database
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        },
      });

      // Send back the user token
      return this.signToken(user.id, user.email);
    } catch (error: any) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ForbiddenException('Credentials taken already.');
        }
      }
      throw error;
    }
  }

  async signin(dto: AuthDto) {
    // Find the user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    // If user does not exist throw exception
    if (!user) throw new ForbiddenException('Credentials incorrect');

    // Compare password
    const passwordMatches = await argon.verify(user.hash, dto.password);

    // If password is incorrect throw exception
    if (!passwordMatches) throw new ForbiddenException('Credentials incorrect');

    // Send back the user token
    return this.signToken(user.id, user.email);
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      subscription: userId,
      email,
    };

    const secret = this.config.get('JWT_SECRET');

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret,
    });

    return { access_token: accessToken };
  }
}
