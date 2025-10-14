export interface CVTVChannel {
  id: string;
  name: string;
  url: string;
  group: string;
}

const CVTV_CHANNELS: CVTVChannel[] = [
  { id: "AEHD", name: "A&E HD", url: "https://cvtv.cvalley.net/hls/AEHD/AEHD.m3u8", group: "Entertainment" },
  { id: "CNNHD", name: "CNN HD", url: "https://cvtv.cvalley.net/hls/CNNHD/CNNHD.m3u8", group: "News" },
  { id: "ESPNHD", name: "ESPN HD", url: "https://cvtv.cvalley.net/hls/ESPNHD/ESPNHD.m3u8", group: "Sports" },
  { id: "ESPN2HD", name: "ESPN2 HD", url: "https://cvtv.cvalley.net/hls/ESPN2HD/ESPN2HD.m3u8", group: "Sports" },
  { id: "HGTVHD", name: "HGTV HD", url: "https://cvtv.cvalley.net/hls/HGTVHD/HGTVHD.m3u8", group: "Lifestyle" },
  { id: "HistoryHD", name: "History HD", url: "https://cvtv.cvalley.net/hls/HistoryHD/HistoryHD.m3u8", group: "Entertainment" },
  { id: "LifetimeHD", name: "Lifetime HD", url: "https://cvtv.cvalley.net/hls/LifetimeHD/LifetimeHD.m3u8", group: "Entertainment" },
  { id: "TBSHD", name: "TBS HD", url: "https://cvtv.cvalley.net/hls/TBSHD/TBSHD.m3u8", group: "Entertainment" },
  { id: "TNTHD", name: "TNT HD", url: "https://cvtv.cvalley.net/hls/TNTHD/TNTHD.m3u8", group: "Entertainment" },
  { id: "USAHD", name: "USA HD", url: "https://cvtv.cvalley.net/hls/USAHD/USAHD.m3u8", group: "Entertainment" },
  { id: "FS1", name: "Fox Sports 1", url: "https://cvtv.cvalley.net/hls/FS1/FS1.m3u8", group: "Sports" },
  { id: "FoxNewsHD", name: "FOX News HD", url: "https://cvtv.cvalley.net/hls/FoxNewsHD/FoxNewsHD.m3u8", group: "News" },
  { id: "KCTVCBS", name: "KCTV CBS", url: "https://cvtv.cvalley.net/hls/KCTVCBS/KCTVCBS.m3u8", group: "US Networks" },
  { id: "KMBCABC", name: "KMBC ABC", url: "https://cvtv.cvalley.net/hls/KMBCABC/KMBCABC.m3u8", group: "US Networks" },
  { id: "KOMUNBC", name: "KOMU NBC", url: "https://cvtv.cvalley.net/hls/KOMUNBC/KOMUNBC.m3u8", group: "US Networks" },
  { id: "WDAFFox", name: "WDAF FOX", url: "https://cvtv.cvalley.net/hls/WDAFFox/WDAFFox.m3u8", group: "US Networks" },
  { id: "KOMUCW", name: "KOMU CW", url: "https://cvtv.cvalley.net/hls/KOMUCW/KOMUCW.m3u8", group: "US Networks" },
  { id: "KMCIIND", name: "KMCI IND", url: "https://cvtv.cvalley.net/hls/KMCIIND/KMCIIND.m3u8", group: "US Networks" },
  { id: "KMIZABC", name: "KMIZ ABC", url: "https://cvtv.cvalley.net/hls/KMIZABC/KMIZABC.m3u8", group: "US Networks" },
  { id: "KRCGCBS", name: "KRCG CBS", url: "https://cvtv.cvalley.net/hls/KRCGCBS/KRCGCBS.m3u8", group: "US Networks" },
  { id: "KSHBNBC", name: "KSHB NBC", url: "https://cvtv.cvalley.net/hls/KSHBNBC/KSHBNBC.m3u8", group: "US Networks" },
  { id: "KTVOABC", name: "KTVO ABC", url: "https://cvtv.cvalley.net/hls/KTVOABC/KTVOABC.m3u8", group: "US Networks" },
  { id: "KYOUFOX", name: "KYOU FOX", url: "https://cvtv.cvalley.net/hls/KYOUFOX/KYOUFOX.m3u8", group: "US Networks" },
  { id: "KTVOCBS", name: "KTVO CBS", url: "https://cvtv.cvalley.net/hls/KTVOCBS/KTVOCBS.m3u8", group: "US Networks" },
  { id: "KQFXFOX", name: "KQFX FOX", url: "https://cvtv.cvalley.net/hls/KQFXFOX/KQFXFOX.m3u8", group: "US Networks" },
  { id: "WGEMNBC", name: "WGEM NBC", url: "https://cvtv.cvalley.net/hls/WGEMNBC/WGEMNBC.m3u8", group: "US Networks" },
  { id: "KNLJ", name: "KNLJ", url: "https://cvtv.cvalley.net/hls/KNLJ/KNLJ.m3u8", group: "US Networks" },
  { id: "KCPTPBS", name: "KCPT PBS", url: "https://cvtv.cvalley.net/hls/KCPTPBS/KCPTPBS.m3u8", group: "US Networks" },
];

export async function getAllCVTVChannels(): Promise<CVTVChannel[]> {
  return CVTV_CHANNELS;
}

export async function getCVTVChannelById(channelId: string): Promise<CVTVChannel | null> {
  return CVTV_CHANNELS.find((ch) => ch.id === channelId) || null;
}

export async function searchCVTVChannels(query: string): Promise<CVTVChannel[]> {
  const queryLower = query.toLowerCase();
  return CVTV_CHANNELS.filter(
    (ch) =>
      ch.name.toLowerCase().includes(queryLower) ||
      ch.group.toLowerCase().includes(queryLower)
  );
}

export async function getCVTVChannelsByGroup(group: string): Promise<CVTVChannel[]> {
  return CVTV_CHANNELS.filter((ch) => ch.group === group);
}

