import Parser from "rss-parser";

export default async function handler(req, res) {
  const parser = new Parser();

  const feedUrl = "https://rss.app/feeds/M5WkNVmUBOKbtggy.xml"; // replace with your feed

  // Helper to extract first <img> from HTML content
  function extractImageFromHTML(html) {
    if (!html) return null;
    const match = html.match(/<img[^>]+src="([^">]+)"/i);
    return match ? match[1] : null;
  }

  try {
    const feed = await parser.parseURL(feedUrl);

    const items = feed.items.slice(0, 5).map(item => ({
      title: item.title,
      link: item.link,
      description: item.contentSnippet || item.description,
      pubDate: item.pubDate,
      image:
        item.enclosure?.url ||                  // standard RSS enclosure
        item['media:content']?.url ||           // media content tag
        extractImageFromHTML(item.content) ||   // fallback: first <img> in HTML
        null
    }));

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ blog: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to parse RSS" });
  }
}
