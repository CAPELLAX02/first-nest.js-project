import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
      // log: ['query', 'info', 'warn', 'error'],
    });
  }

  cleanDb() {
    /**
     * Deleting order matters. You may also want to migrate database after changing
        "  user   User @relation(fields: [userId], references: [id])" 
        to 
        "  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)"
     */
    return this.$transaction([
      this.user.deleteMany(),
      this.bookmark.deleteMany(),
    ]);
  }
}
