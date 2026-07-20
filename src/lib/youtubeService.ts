/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface YoutubeImportedVideo {
  id: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  videoUrl: string;
}

const INVIDIOUS_INSTANCES = [
  "https://yewtu.be",
  "https://invidious.nerdvpn.de",
  "https://invidious.flokinet.to",
  "https://iv.melmac.space",
  "https://invidious.projectsegfaut.im",
  "https://invidio.xamh.de",
  "https://invidious.perennialte.ch"
];

/**
 * Extracts YouTube Video ID from any valid YouTube video URL or ID.
 */
export function extractYoutubeVideoId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  // If it's already an 11-char ID
  if (trimmed.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Extracts YouTube Playlist ID from a playlist URL or ID.
 */
export function extractYoutubePlaylistId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.length >= 18 && trimmed.length <= 34 && /^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return trimmed;
  }
  const regExp = /[&?]list=([^#\&\?]+)/;
  const match = trimmed.match(regExp);
  return match ? match[1] : null;
}

/**
 * Parses ytInitialData from YouTube playlist HTML string.
 */
export function parseYtInitialData(html: string): any {
  if (!html) return null;
  
  let jsonStr = "";
  const targets = [
    "window['ytInitialData'] = ",
    "window[\"ytInitialData\"] = ",
    "var ytInitialData = ",
    "ytInitialData = "
  ];
  
  let startIndex = -1;
  for (const target of targets) {
    const idx = html.indexOf(target);
    if (idx !== -1) {
      startIndex = idx + target.length;
      break;
    }
  }
  
  if (startIndex === -1) {
    return null;
  }
  
  const sub = html.substring(startIndex);
  let endIdx = sub.indexOf(";</script>");
  if (endIdx === -1) {
    endIdx = sub.indexOf(";var ");
  }
  if (endIdx === -1) {
    endIdx = sub.indexOf(";window");
  }
  if (endIdx === -1) {
    endIdx = sub.indexOf("};");
    if (endIdx !== -1) endIdx += 1;
  }
  
  if (endIdx !== -1) {
    jsonStr = sub.substring(0, endIdx).trim();
    if (jsonStr.endsWith(";")) {
      jsonStr = jsonStr.slice(0, -1);
    }
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Error parsing ytInitialData JSON substring", e);
    }
  }
  
  // Fallback regex
  const regex = /ytInitialData\s*=\s*({.+?});/s;
  const match = html.match(regex);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Regex parsing ytInitialData failed", e);
    }
  }
  
  return null;
}

/**
 * Extracts video details recursively from parsed ytInitialData JSON object.
 */
export function extractVideosFromYtInitialData(data: any): YoutubeImportedVideo[] {
  const videos: YoutubeImportedVideo[] = [];
  if (!data) return videos;

  try {
    const listItems: any[] = [];
    
    // Deep recursive search to find any playlistVideoRenderer objects
    const findPlaylistVideos = (obj: any) => {
      if (!obj || typeof obj !== "object") return;
      if (obj.playlistVideoRenderer) {
        listItems.push(obj.playlistVideoRenderer);
        return;
      }
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          findPlaylistVideos(obj[key]);
        }
      }
    };
    
    findPlaylistVideos(data);

    for (const renderer of listItems) {
      if (renderer && renderer.videoId) {
        const videoId = renderer.videoId;
        let title = "فيديو يوتيوب";
        if (renderer.title?.runs?.[0]?.text) {
          title = renderer.title.runs[0].text;
        } else if (renderer.title?.simpleText) {
          title = renderer.title.simpleText;
        }

        let duration = "45 دقيقة";
        if (renderer.lengthText?.simpleText) {
          const d = renderer.lengthText.simpleText;
          // Format as readable Arabic duration if simple, e.g. "12:34" -> "12:34 دقيقة"
          duration = d.includes(":") ? `${d} دقيقة` : d;
        } else if (renderer.lengthSeconds) {
          const sec = parseInt(renderer.lengthSeconds, 10);
          if (!isNaN(sec)) {
            const mins = Math.floor(sec / 60);
            const secs = sec % 60;
            duration = `${mins}:${secs < 10 ? "0" : ""}${secs} دقيقة`;
          }
        }

        let thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        if (renderer.thumbnail?.thumbnails?.length > 0) {
          const thumbs = renderer.thumbnail.thumbnails;
          thumbnailUrl = thumbs[thumbs.length - 1].url;
        }

        videos.push({
          id: videoId,
          title,
          duration,
          thumbnailUrl,
          videoUrl: `https://www.youtube.com/embed/${videoId}`
        });
      }
    }
  } catch (err) {
    console.error("Failed to extract videos from ytInitialData:", err);
  }
  return videos;
}

/**
 * Fetches single YouTube video details via oEmbed (No API Key required)
 */
export async function fetchYoutubeVideoDetails(videoUrlOrId: string): Promise<YoutubeImportedVideo | null> {
  const videoId = extractYoutubeVideoId(videoUrlOrId);
  if (!videoId) return null;

  // 0. Try Invidious API first (highly reliable and returns real title & duration without being blocked!)
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying Invidious API for video details on instance: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout for fast fallback
      
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.title) {
          console.log(`Successfully fetched video details from Invidious instance: ${instance}`);
          const mins = Math.floor((data.lengthSeconds || 2700) / 60);
          return {
            id: videoId,
            title: data.title,
            duration: mins > 0 ? `${mins} دقيقة` : "45 دقيقة",
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
            videoUrl: `https://www.youtube.com/embed/${videoId}`
          };
        }
      }
    } catch (err) {
      console.warn(`Invidious instance ${instance} single video fetch failed:`, err);
    }
  }

  const targetUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  // 1. Try direct YouTube Official oEmbed
  try {
    const response = await fetch(targetUrl);
    if (response.ok) {
      const data = await response.json();
      return {
        id: videoId,
        title: data.title || `محاضرة فيديو رقم (${videoId})`,
        duration: "45 دقيقة",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/embed/${videoId}`
      };
    }
  } catch (err) {
    console.warn("YouTube official oEmbed direct call failed, trying corsproxy...", err);
  }

  // 2. Try YouTube oEmbed via corsproxy.io
  try {
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(targetUrl)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        id: videoId,
        title: data.title || `محاضرة فيديو رقم (${videoId})`,
        duration: "45 دقيقة",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/embed/${videoId}`
      };
    }
  } catch (err) {
    console.warn("YouTube oEmbed via corsproxy.io failed...", err);
  }

  // 3. Try direct noembed.com as fallback
  try {
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    if (response.ok) {
      const data = await response.json();
      return {
        id: videoId,
        title: data.title || `محاضرة فيديو رقم (${videoId})`,
        duration: "45 دقيقة",
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/embed/${videoId}`
      };
    }
  } catch (err) {
    console.warn("Direct noembed failed, trying corsproxy...", err);
  }

  // 4. Try noembed.com via corsproxy.io
  try {
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        id: videoId,
        title: data.title || `محاضرة فيديو رقم (${videoId})`,
        duration: "45 دقيقة",
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/embed/${videoId}`
      };
    }
  } catch (err) {
    console.error("Error fetching single video from all paths:", err);
  }

  // Failsafe fallback
  return {
    id: videoId,
    title: `محاضرة فيديو رقم (${videoId})`,
    duration: "45 دقيقة",
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    videoUrl: `https://www.youtube.com/embed/${videoId}`
  };
}

/**
 * Unified parser trying standard JSON extraction first, with highly targeted HTML parser fallback.
 * It searches only for playlistVideoRenderer occurrences to prevent extracting recommended sidebar videos.
 */
export function parsePlaylistHtml(html: string): YoutubeImportedVideo[] {
  const videos: YoutubeImportedVideo[] = [];
  if (!html) return videos;

  const initialData = parseYtInitialData(html);
  const initialVideos = extractVideosFromYtInitialData(initialData);
  if (initialVideos.length > 0) {
    return initialVideos;
  }
  
  console.log("JSON parsing yielded no videos. Trying targeted playlistVideoRenderer extraction on HTML...");
  const rendererMarker = "playlistVideoRenderer";
  let index = html.indexOf(rendererMarker);
  const ids = new Set<string>();
  
  while (index !== -1) {
    // Extract a chunk of 2500 characters starting from the marker to parse details
    const chunk = html.substring(index, index + 2500);
    
    // Extract videoId from this chunk
    const idMatch = chunk.match(/"videoId"\s*:\s*"([a-zA-Z0-9_-]{11})"/);
    const videoId = idMatch ? idMatch[1] : null;
    
    if (videoId && !ids.has(videoId)) {
      ids.add(videoId);
      
      // Extract title from this chunk
      let title = `محاضرة فيديو يوتيوب (${videoId})`;
      const titleRunsMatch = chunk.match(/"title"\s*:\s*\{\s*"runs"\s*:\s*\[\s*\{\s*"text"\s*:\s*"([^"]+)"/);
      if (titleRunsMatch) {
        title = titleRunsMatch[1];
      } else {
        const titleSimpleMatch = chunk.match(/"title"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
        if (titleSimpleMatch) {
          title = titleSimpleMatch[1];
        }
      }
      
      // Decode unicode/JSON escape characters if any
      try {
        title = JSON.parse(`"${title}"`);
      } catch {
        // ignore decoding errors
      }

      // Extract duration if present
      let duration = "45 دقيقة";
      const lenTextMatch = chunk.match(/"lengthText"\s*:\s*\{\s*"simpleText"\s*:\s*"([^"]+)"/);
      if (lenTextMatch) {
        duration = `${lenTextMatch[1]} دقيقة`;
      } else {
        const lenSecsMatch = chunk.match(/"lengthSeconds"\s*:\s*"(\d+)"/);
        if (lenSecsMatch) {
          const sec = parseInt(lenSecsMatch[1], 10);
          const mins = Math.floor(sec / 60);
          const secs = sec % 60;
          duration = `${mins}:${secs < 10 ? "0" : ""}${secs} دقيقة`;
        }
      }

      videos.push({
        id: videoId,
        title,
        duration,
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        videoUrl: `https://www.youtube.com/embed/${videoId}`
      });
    }
    
    index = html.indexOf(rendererMarker, index + rendererMarker.length);
  }

  // Failsafe backup if the above highly targeted extraction found nothing but we have general watches
  if (videos.length === 0) {
    console.log("Targeted extraction yielded nothing. Trying general ID extraction as absolute fallback...");
    const idRegex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    const idsFallback = new Set<string>();
    let m;
    while ((m = idRegex.exec(html)) !== null) {
      idsFallback.add(m[1]);
    }
    for (const id of idsFallback) {
      if (id && id !== "dQw4w9WgXcQ") {
        videos.push({
          id,
          title: `محاضرة فيديو يوتيوب (${id})`,
          duration: "45 دقيقة",
          thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/embed/${id}`
        });
      }
    }
  }

  return videos;
}

/**
 * Fetches all video items in a YouTube playlist via multiple CORS proxies (with automatic fallbacks).
 */
export async function fetchYoutubePlaylistVideos(playlistUrlOrId: string): Promise<YoutubeImportedVideo[]> {
  const playlistId = extractYoutubePlaylistId(playlistUrlOrId);
  if (!playlistId) return [];

  // 1. Try Invidious Instances (clean JSON API, highly reliable, bypasses scraping blocks!)
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      console.log(`Trying Invidious API on instance: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout for fast fallback
      
      const response = await fetch(`${instance}/api/v1/playlists/${playlistId}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.videos) && data.videos.length > 0) {
          console.log(`Successfully fetched ${data.videos.length} videos from Invidious instance: ${instance}`);
          return data.videos.map((video: any) => {
            const videoId = video.videoId || "";
            const mins = Math.floor((video.lengthSeconds || 2700) / 60);
            return {
              id: videoId,
              title: video.title || `محاضرة فيديو رقم (${videoId})`,
              duration: mins > 0 ? `${mins} دقيقة` : "45 دقيقة",
              thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              videoUrl: `https://www.youtube.com/embed/${videoId}`
            };
          });
        }
      }
    } catch (err) {
      console.warn(`Invidious instance ${instance} direct fetch failed, trying via corsproxy...`, err);
      
      // Try via corsproxy.io as backup for this instance
      try {
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`${instance}/api/v1/playlists/${playlistId}`)}`;
        const response = await fetch(proxyUrl);
        if (response.ok) {
          const data = await response.json();
          if (data && Array.isArray(data.videos) && data.videos.length > 0) {
            console.log(`Successfully fetched ${data.videos.length} videos from Invidious instance ${instance} via corsproxy.io`);
            return data.videos.map((video: any) => {
              const videoId = video.videoId || "";
              const mins = Math.floor((video.lengthSeconds || 2700) / 60);
              return {
                id: videoId,
                title: video.title || `محاضرة فيديو رقم (${videoId})`,
                duration: mins > 0 ? `${mins} دقيقة` : "45 دقيقة",
                thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                videoUrl: `https://www.youtube.com/embed/${videoId}`
              };
            });
          }
        }
      } catch (proxyErr) {
        console.warn(`Invidious instance ${instance} via corsproxy failed:`, proxyErr);
      }
    }
  }

  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;

  // Proxy 1: corsproxy.io (returns raw HTML directly)
  try {
    console.log("Attempting to fetch playlist via corsproxy.io...");
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(playlistUrl)}`);
    if (response.ok) {
      const html = await response.text();
      const videos = parsePlaylistHtml(html);
      if (videos.length > 0) {
        console.log(`Successfully fetched ${videos.length} videos from corsproxy.io`);
        return videos;
      }
    }
  } catch (err) {
    console.warn("corsproxy.io failed, attempting fallback...", err);
  }

  // Proxy 2: api.allorigins.win RAW (highly reliable, returns raw HTML)
  try {
    console.log("Attempting to fetch playlist via api.allorigins.win/raw...");
    const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(playlistUrl)}`);
    if (response.ok) {
      const html = await response.text();
      const videos = parsePlaylistHtml(html);
      if (videos.length > 0) {
        console.log(`Successfully fetched ${videos.length} videos from allorigins raw`);
        return videos;
      }
    }
  } catch (err) {
    console.warn("api.allorigins.win raw failed, attempting fallback...", err);
  }

  // Proxy 3: api.allorigins.win GET JSON contents wrapper
  try {
    console.log("Attempting to fetch playlist via api.allorigins.win/get...");
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(playlistUrl)}`);
    if (response.ok) {
      const data = await response.json();
      const html = data.contents;
      const videos = parsePlaylistHtml(html);
      if (videos.length > 0) {
        console.log(`Successfully fetched ${videos.length} videos from allorigins JSON`);
        return videos;
      }
    }
  } catch (err) {
    console.warn("api.allorigins.win failed, attempting fallback...", err);
  }

  // Proxy 4: api.codetabs.com (returns raw HTML directly)
  try {
    console.log("Attempting to fetch playlist via api.codetabs.com...");
    const response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(playlistUrl)}`);
    if (response.ok) {
      const html = await response.text();
      const videos = parsePlaylistHtml(html);
      if (videos.length > 0) {
        console.log(`Successfully fetched ${videos.length} videos from codetabs`);
        return videos;
      }
    }
  } catch (err) {
    console.warn("api.codetabs.com failed...", err);
  }

  // No mock/simulated fallback list here because importing random/fake video IDs (like Rick Astley) confuses users.
  // Instead, return an empty list so the application can suggest the 100% reliable "Paste YouTube URLs list" mode.
  console.log("All scrapers failed. Returning empty list.");
  return [];
}
