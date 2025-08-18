import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.musicofourdesire.com/blog");
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    $("a.framer-rphq8z").each((i, el) => {
      let link = $(el).attr("href");
      const title = $(el).find("[data-framer-name='Title'] p").text();
      const pubDate = $(el).find("[data-framer-name='Date'] p").text();
      const image = $(el).find("img").attr("src") || null;

      if (title && link) {
        // normalize link safely with URL constructor
        try {
          link = new URL(link, "https://www.musicofourdesire.com").href;
        } catch {
          link = `https://www.musicofourdesire.com${link}`;
        }

        items.push({
          title,
          link,
          pubDate,
          image,
        });
      }
    });

    // remove duplicates by link
    const uniqueItems = items.filter(
      (item, idx, self) => idx === self.findIndex((t) => t.link === item.link)
    );

    // enrich with meta tags
    const enrichedItems = [];
    for (const item of uniqueItems) {
      try {
        const blogRes = await fetch(item.link);
        const blogHtml = await blogRes.text();
        const $$ = cheerio.load(blogHtml);

        const preview = $$("meta[name='description']").attr("content") || null;
        enrichedItems.push({
          ...item,
          preview,
          tags,
        });
      } catch (err) {
        console.error(`Error scraping ${item.link}:`, err);
        enrichedItems.push(item);
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ blog: enrichedItems });
  } catch (error) {
    console.error("Scraper error:", error);
    res.status(500).json({ error: "Failed to scrape" });
  }
}