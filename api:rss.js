import Parser from "rss-parser";

export default async function handler(req, res) {
  const parser = new Parser();

  const feedUrl = "https://cosleee.com/rss.xml"; // replace with your feed

  try {
    const feed = await parser.parseURL(feedUrl);

    const items = feed.items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      description: item.contentSnippet || item.description,
      pubDate: item.pubDate,
      image: item.enclosure?.url || null
    }));

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ blog: items });
  } catch (error) {
    res.status(500).json({ error: "Failed to parse RSS" });
  }
}
