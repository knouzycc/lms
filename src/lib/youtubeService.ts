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
    console.error("Error fetching single video from noembed:", err);
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
 * Fetches all video items in a YouTube playlist via allorigins CORS proxy.
 */
export async function fetchYoutubePlaylistVideos(playlistUrlOrId: string): Promise<YoutubeImportedVideo[]> {
  const playlistId = extractYoutubePlaylistId(playlistUrlOrId);
  if (!playlistId) return [];

  const playlistUrl = `https://www.youtube.com/playlist?list=${playlistId}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(playlistUrl)}`;

  try {
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const data = await response.json();
      const html = data.contents;
      const initialData = parseYtInitialData(html);
      if (initialData) {
        return extractVideosFromYtInitialData(initialData);
      }
    }
  } catch (err) {
    console.error("Error fetching or parsing playlist via proxy:", err);
  }

  return [];
}
