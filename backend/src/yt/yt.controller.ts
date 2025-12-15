import { Controller, Get, Query, Param } from "@nestjs/common";
import { YtService } from "./yt.service";

@Controller("yt")
export class YtController {
  constructor(private readonly ytService: YtService) {}
  
  @Get("search")
  async search(@Query("q") q: string) {
    return this.ytService.search(q);
  }

  @Get('details/:id')
  async details(@Param("id") id: string) {
    return {
      id,
      message: "Details endpoint not implemented yet",
    }
  } 

  @Get("playlist/my")
  myPlaylists() {
    return [];
  }
}