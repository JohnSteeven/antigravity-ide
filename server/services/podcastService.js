/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  podcastService.js  —  Podcast Episode & RSS XML Generator Service
 *  MyJourney Platform  |  Stage 4 — Phase 24: Distribution & Omnichannel Platform
 * ─────────────────────────────────────────────────────────────────────────────
 */

const PodcastEpisode = require('../models/PodcastEpisode');

class PodcastService {
  static async getEpisodes() {
    return PodcastEpisode.find({ isPublished: true }).sort({ episodeNumber: -1 }).lean();
  }

  static async createEpisode(data) {
    const slug = (data.title || 'episode').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return PodcastEpisode.create({ ...data, slug });
  }

  /**
   * Generate valid Podcast RSS XML Feed.
   */
  static async generateRssFeed() {
    const episodes = await PodcastEpisode.find({ isPublished: true }).sort({ publishedAt: -1 }).lean();

    const itemsXml = episodes
      .map(
        (ep) => `
    <item>
      <title>${ep.title}</title>
      <description>${ep.description}</description>
      <enclosure url="${ep.audioUrl}" length="1024000" type="audio/mpeg" />
      <pubDate>${new Date(ep.publishedAt).toUTCString()}</pubDate>
      <itunes:season>${ep.seasonNumber}</itunes:season>
      <itunes:episode>${ep.episodeNumber}</itunes:episode>
      <itunes:duration>${ep.durationSeconds}</itunes:duration>
    </item>`
      )
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>MyJourney Podcast Feed</title>
    <link>https://myjourney.com/podcast</link>
    <description>Official podcast episodes from MyJourney platform</description>
    <language>en-us</language>
    ${itemsXml}
  </channel>
</rss>`;
  }
}

module.exports = PodcastService;
