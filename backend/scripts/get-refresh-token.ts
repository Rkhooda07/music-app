import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import readline from "readline";

const CREDENTIALS_PATH = path.join(
  __dirname,
  "../credentials/oauth-client.json"
);

async function getRefreshToken() {
  // 1️⃣ Read OAuth client JSON
  const credentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, "utf-8")
  );

  const { client_id, client_secret, redirect_uris } =
    credentials.installed;

  // 2️⃣ Create OAuth client
  const oAuth2Client = new OAuth2Client(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // 3️⃣ Generate auth URL
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // REQUIRED to get refresh token
    scope: ["https://www.googleapis.com/auth/youtube.readonly"],
    prompt: "consent", // forces refresh token generation
  });

  console.log("\nAuthorize this app by visiting this URL:\n");
  console.log(authUrl, "\n");

  // 4️⃣ Read authorization code from terminal
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the code from that page here: ", async (code) => {
    rl.close();

    // 5️⃣ Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);

    console.log("\n✅ TOKENS RECEIVED:\n");
    console.log(tokens);

    if (!tokens.refresh_token) {
      console.log(
        "\n❌ No refresh token received. Revoke access and try again."
      );
      return;
    }

    // 6️⃣ Save refresh token
    const outputPath = path.join(
      __dirname,
      "../credentials/refresh-token.json"
    );

    fs.writeFileSync(
      outputPath,
      JSON.stringify(tokens, null, 2)
    );

    console.log(
      `\n🎉 Refresh token saved to ${outputPath}\n`
    );
  });
}

getRefreshToken();