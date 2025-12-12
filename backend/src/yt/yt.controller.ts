import { Controller, Get, Param } from "@nestjs/common";

@Controller('yt')
export class YtController {
  @Get('search')
  search() {
    return {
      items: [
        { id: 'yt_1', title: "God's plan", artist: "Drake" },
        { id: 'yt_2', title: "Revenge", artist: "XXXTentacion" },
      ],
    };
  }

  @Get('details/:id')
  details(@Param('id') id: string) {
    return { id, title: `Dummy Title ${id}`, duration: 210 };
  } 

  @Get('playlist/my')
  myPlaylists() {
    return []
  }
}