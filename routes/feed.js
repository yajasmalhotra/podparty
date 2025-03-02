import express from 'express';
import RSSParser from 'rss-parser';

const router = express.Router();

// Configure RSSParser with custom fields for channel and item.
const parser = new RSSParser({
  customFields: {
    channel: [['itunes:image', 'itunesImage']],
    item: [['itunes:image', 'itunesImage']]
  }
});

router.get('/', async (req, res) => {
  const feedUrl = req.query.url;
  if (!feedUrl) {
    return res.status(400).send('Missing feed URL parameter');
  }
  try {
    const feed = await parser.parseURL(feedUrl);
    console.log("Example feed item:", feed.items[0]);
    res.json(feed);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

export default router;