import cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const response = await fetch("https://www.musicofourdesire.com/blog");
    const html = await response.text();
    const $ = cheerio.load(html);

    const items = [];

    $("a.framer-rphq8z").each((i, el) => {
      const element = $(el);

      const title = element.find("div[data-framer-name='Title'] .framer-text").text().trim();
      const link = "https://www.musicofourdesire.com" + element.attr("href").replace("./", "/");
      const image = element.find("img").attr("src") || null;
      const date = element.find("div[data-framer-name='Date'] .framer-text").text().trim();
      const author = element.find("div.framer-th0gu2 .framer-text").text().trim() || null;

      items.push({
        title,
        link,
        image,
        pubDate: date,
        author,
      });
    });

    res.setHeader("Content-Type", "application/json");
    res.status(200).json({ blog: items });
  } catch (error) {
    res.status(500).json({ error: "Failed to scrape blog page", details: error.message });
  }
}
