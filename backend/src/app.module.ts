import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '@app/app.controller';
import { AppService } from '@app/app.service';
import { Flow } from '@app/flow/entity/flow.entity';
import { FlowModule } from '@app/flow/flow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      password: process.env.POSTGRES_PASSWORD,
      username: process.env.POSTGRES_USER,
      entities: [Flow],
      database: process.env.POSTGRES_DATABASE,
      synchronize: true,
      logging: true,
      autoLoadEntities: true
    }),
    FlowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
