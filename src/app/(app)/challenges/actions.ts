
'use server';

import type { Challenge } from '@/types';

/**
 * Fetches a relevant image URL from Pexels based on a query.
 * @param query The search query for Pexels.
 * @returns A Pexels image URL or null if an error occurs or no image is found.
 */
export async function getPexelsImageForChallenge(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) {
    console.warn("Pexels API key (PEXELS_API_KEY) is not configured in environment variables.");
    return null;
  }

  if (!query || query.trim() === "") {
    console.warn("Pexels query is empty.");
    return null;
  }

  const pexelsApiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`;

  try {
    const response = await fetch(pexelsApiUrl, {
      headers: {
        Authorization: apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Pexels API error: ${response.status} ${response.statusText}`, errorData);
      return null;
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Prefer 'large' or 'medium' photo sizes. 'original' can be very large.
      return data.photos[0].src.large || data.photos[0].src.medium || data.photos[0].src.original;
    } else {
      console.log("No photos found on Pexels for query:", query);
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch image from Pexels:", error);
    return null;
  }
}
