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

    // Remove duplicates by link
    const uniqueItems = items.filter(
      (item, idx, self) => idx === self.findIndex((t) => t.link === item.link)
    );

    const enrichedItems = [];
    for (const item of uniqueItems) {
      try {
        const blogRes = await fetch(item.link);
        const blogHtml = await blogRes.text();
        const $$ = cheerio.load(blogHtml);

        // Grab meta description
        const preview = $$("meta[name='description']").attr("content") || null;

        // Grab JSON-LD script
        let jsonLD = null;
        $$("script[type='application/ld+json']").each((i, script) => {
          try {
            const data = JSON.parse($$(script).html());
            if (data["@type"] === "Article") {
              jsonLD = data;
            }
          } catch {}
        });

        enrichedItems.push({
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          image: item.image,
          preview,
          jsonLD: jsonLD
            ? {
                headline: jsonLD.headline || item.title,
                description: jsonLD.description || preview,
                author: jsonLD.author?.name || null,
                slug: jsonLD.slug || null,
                tags: jsonLD.tags || [],
                date: jsonLD.date || item.pubDate,
              }
            : null,
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
