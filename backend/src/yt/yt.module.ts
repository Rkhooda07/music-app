import { Module } from "@nestjs/common";
import { YtController } from "./yt.controller";
import { YtService } from "./yt.service";

@Module({
  controllers: [YtController],
  providers: [YtService],
  exports: [YtService]
})
export class YtModule {}