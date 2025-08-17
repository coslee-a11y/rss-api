import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.musicofourdesire.com/blog");
    const html = await response.text();

    const $ = cheerio.load(html);

    const items = [];
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

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ blog: items });
  } catch (error) {
    console.error("Scraper error:", error);
    res.status(500).json({ error: "Failed to scrape" });
  }
}