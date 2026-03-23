import * as MediaLibrary from "expo-media-library";

export type LocalTrack = {
  id: string,
  title: string,
  artist: string,
  album: string,
  duration: number,
  uri: string
};

export async function scanLocalMusic(): Promise<LocalTrack[]> {
  const permission = await MediaLibrary.requestPermissionsAsync();

  if (!permission.granted) {
    throw new Error("Media library permission denied");
  }

  // Get audio files
  const media = await MediaLibrary.getAssetsAsync({
    mediaType: MediaLibrary.MediaType.audio,
    first: 1000,
  });

  const tracks: LocalTrack[] = [];

  for (const asset of media.assets) {
    // IMPORTANT: artist / album live in AssetInfo, not Asset
    const info = (await MediaLibrary.getAssetInfoAsync(asset.id)) as any;

    tracks.push({
      id: asset.id,
      title: asset.filename.replace(/\.[^/.]+$/, ""),
      artist: info.artist ?? "Unknown Artist",
      album: info.album ?? "Unknown Album",
      duration: asset.duration ?? 0,
      uri: asset.uri,
    });
  }

  return tracks;
}