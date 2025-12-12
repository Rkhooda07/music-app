import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { YtController } from './yt/yt.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController, YtController],
  providers: [AppService]
})
export class AppModule {}
