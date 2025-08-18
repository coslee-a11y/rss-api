import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.musicofourdesire.com/blog");
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    // Loop through blog previews on index page
    $("a.framer-rphq8z").each((i, el) => {
      const link = $(el).attr("href");
      const title = $(el).find("[data-framer-name='Title'] p").text();
      const pubDate = $(el).find("[data-framer-name='Date'] p").text();
      const image = $(el).find("img").attr("src") || null;

      if (title && link) {
        items.push({
          title,
          link: link.startsWith("http") ? link : `https://www.musicofourdesire.com${link}`,
          pubDate,
          image,
        });
      }
    });

    // Now fetch each blog page to extract meta tags
    const enrichedItems = [];
    for (const item of items) {
      try {
        const blogRes = await fetch(item.link);
        const blogHtml = await blogRes.text();
        const $$ = cheerio.load(blogHtml);

        const preview = $$("meta[name='blog-preview']").attr("content") || null;
        const tags = $$("meta[name='tags']").attr("content")?.split(",") || [];

        enrichedItems.push({
          ...item,
          preview,
          tags,
        });
      } catch (err) {
        console.error(`Error scraping ${item.link}:`, err);
        enrichedItems.push(item); // fallback without meta
      }
    }

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ blog: enrichedItems });
  } catch (error) {
    console.error("Scraper error:", error);
    res.status(500).json({ error: "Failed to scrape" });
  }
}
