import { Injectable } from "@nestjs/common";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

@Injectable()
export class YtService {
  private youtube;

  constructor() {
    /**
     * 1️⃣ Read OAuth client credentials
     * This file contains client_id and client_secret
     * It NEVER goes to GitHub
     */
    const credentialsPath = path.join(
      process.cwd(),
      "credentials/oauth-client.json"
    );

    const credentials = JSON.parse(
      fs.readFileSync(credentialsPath, "utf-8")
    );

    const { client_id, client_secret, redirect_uris } =
      credentials.installed;

    /**
     * 2️⃣ Create OAuth2 client
     * This object knows how to:
     * - talk to Google OAuth servers
     * - exchange refresh tokens for access tokens
     */
    const auth = new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris[0]
    );

    /**
     * 3️⃣ Read refresh token (the permanent key)
     * This token was generated once during OAuth flow
     */
    const tokenPath = path.join(
      process.cwd(),
      "credentials/refresh-token.json"
    );

    const token = JSON.parse(
      fs.readFileSync(tokenPath, "utf-8")
    );

    /**
     * 4️⃣ Attach refresh token to OAuth client
     * From now on:
     * - Google SDK auto-generates access tokens
     * - Auto-refreshes them when expired
     * - You never manage expiry manually
     */
    auth.setCredentials({
      refresh_token: token.refresh_token,
    });

    /**
     * 5️⃣ Create authenticated YouTube client
     * Every request made using this.youtube
     * is OAuth-authenticated
     */
    this.youtube = google.youtube({
      version: "v3",
      auth,
    });
  }

  /**
   * 🔍 Search YouTube videos
   * This is called by your controller
   */
  async search(query: string) {
    const response = await this.youtube.search.list({
      part: ["snippet"],        // tells YouTube what data we want
      q: query,                 // search keyword
      maxResults: 10,           // number of results
      type: ["video"],          // only videos (playable)
    });

    /**
     * Normalize YouTube's huge response
     * into a clean frontend-friendly format
     */
    return response.data.items?.map((item) => ({
      videoId: item.id?.videoId,
      title: item.snippet?.title,
      channel: item.snippet?.channelTitle,
      thumbnail: item.snippet?.thumbnails?.default?.url,
    }));
  }
}