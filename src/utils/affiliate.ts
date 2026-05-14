export function getAffiliateLink(
  artist: string,
  album: string,
  platform: 'amazon' | 'apple',
): string {
  if (platform === 'amazon') {
    const query = encodeURIComponent(`${artist} ${album} vinilo`);
    return `https://www.amazon.es/s?k=${query}&tag=albumapp-21`;
  }
  const query = encodeURIComponent(`${artist} ${album}`);
  return `https://music.apple.com/search?term=${query}`;
}
