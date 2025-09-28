import axios from "axios";
import * as cheerio from "cheerio";

export interface ArxivPaper {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published_date: string;
  pdf_url: string;
  venue?: string;
  year?: number;
}

export interface ArxivSearchResult {
  success: boolean;
  data: ArxivPaper[];
  count: number;
  query: string;
  error?: string;
}

/**
 * Scrapes papers from ArXiv search results page
 * @param query The search term (e.g., "quantum computing").
 * @param maxResults The maximum number of results to return.
 * @returns A promise that resolves to an ArxivSearchResult object.
 */
export async function scrapePapers(
  query: string,
  maxResults: number = 20,
): Promise<ArxivSearchResult> {
  try {
    console.log(`🔍 Scraping ArXiv for: '${query}'`);

    // ArXiv search URL
    const searchUrl = `https://arxiv.org/search/?query=${encodeURIComponent(query)}&searchtype=all&abstracts=show&order=-announced_date_first&size=${maxResults}`;
    console.log(`📡 ArXiv URL: ${searchUrl}`);

    const response = await axios.get(searchUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      timeout: 10000,
    });

    console.log(`📊 Response status: ${response.status}`);

    const $ = cheerio.load(response.data);
    const papers: ArxivPaper[] = [];

    // Find each paper result
    $("li.arxiv-result").each((index, element) => {
      try {
        const $paper = $(element);

        // Extract paper ID from the first link
        const idLink = $paper.find("p.list-title a").first().attr("href");
        const id = idLink
          ? idLink
              .split("/")
              .pop()
              ?.replace("v1", "")
              .replace("v2", "")
              .replace("v3", "") || ""
          : "";

        // Extract title
        const title = $paper
          .find("p.title")
          .text()
          .replace("Title:", "")
          .trim();

        // Extract authors
        const authorsText = $paper
          .find("p.authors")
          .text()
          .replace("Authors:", "")
          .trim();
        const authors = authorsText
          .split(",")
          .map((author) => author.trim())
          .filter((author) => author.length > 0);

        // Extract abstract/summary
        const summary =
          $paper.find("span.abstract-full").text().trim() ||
          $paper.find("p.abstract").text().replace("Abstract:", "").trim();

        // Extract date
        const dateText = $paper.find("p.is-size-7").text();
        const dateMatch = dateText.match(/Submitted (\d{1,2} \w+ \d{4})/);
        const publishedDate = dateMatch ? new Date(dateMatch[1]) : new Date();

        // Generate PDF URL
        const pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;

        if (id && title && authors.length > 0) {
          papers.push({
            id,
            title: title.replace(/\s+/g, " "),
            summary: summary.replace(/\s+/g, " "),
            authors,
            published_date: publishedDate.toISOString().split("T")[0],
            pdf_url: pdfUrl,
            venue: "arXiv",
            year: publishedDate.getFullYear(),
          });
        }
      } catch (error) {
        console.error(`Error parsing paper ${index}:`, error);
      }
    });

    console.log(`✅ Successfully scraped ${papers.length} papers`);

    return {
      success: true,
      data: papers,
      count: papers.length,
      query: query,
    };
  } catch (error) {
    console.error("❌ Error scraping ArXiv:", error);
    return {
      success: false,
      data: [],
      count: 0,
      query: query,
      error: error instanceof Error ? error.message : "Unknown scraping error",
    };
  }
}

/**
 * Alternative scraper using ArXiv API (original approach as fallback)
 * @param query The search term
 * @param maxResults Maximum number of results
 */
export async function scrapeArxivAPI(
  query: string,
  maxResults: number = 10,
): Promise<ArxivSearchResult> {
  try {
    console.log(`🔍 Using ArXiv API fallback for: '${query}'`);

    const baseUrl = "http://export.arxiv.org/api/query?";
    const searchQuery = `search_query=all:${encodeURIComponent(query)}`;
    const results = `&start=0&max_results=${maxResults}`;
    const sortBy = "&sortBy=relevance&sortOrder=descending";
    const apiUrl = `${baseUrl}${searchQuery}${results}${sortBy}`;

    const response = await axios.get(apiUrl, {
      timeout: 10000,
    });

    // Parse XML using cheerio
    const $ = cheerio.load(response.data, { xmlMode: true });
    const papers: ArxivPaper[] = [];

    $("entry")
      .slice(0, maxResults)
      .each((index, element) => {
        const $entry = $(element);

        const id =
          $entry.find("id").text().split("/").pop()?.replace(/v\d+$/, "") || "";
        const title = $entry.find("title").text().trim().replace(/\s+/g, " ");
        const summary = $entry
          .find("summary")
          .text()
          .trim()
          .replace(/\s+/g, " ");
        const publishedDate = new Date($entry.find("published").text());

        // Extract authors
        const authors: string[] = [];
        $entry.find("author name").each((i, authorEl) => {
          authors.push($(authorEl).text().trim());
        });

        // Generate PDF URL
        let pdfUrl = "";
        $entry.find("link").each((i, linkEl) => {
          const $link = $(linkEl);
          if ($link.attr("title") === "pdf") {
            pdfUrl = $link.attr("href") || "";
          }
        });

        if (!pdfUrl && id) {
          pdfUrl = `https://arxiv.org/pdf/${id}.pdf`;
        }

        if (id && title && authors.length > 0) {
          papers.push({
            id,
            title,
            summary,
            authors,
            published_date: publishedDate.toISOString().split("T")[0],
            pdf_url: pdfUrl,
            venue: "arXiv",
            year: publishedDate.getFullYear(),
          });
        }
      });

    return {
      success: true,
      data: papers,
      count: papers.length,
      query: query,
    };
  } catch (error) {
    console.error("❌ Error with ArXiv API fallback:", error);
    return {
      success: false,
      data: [],
      count: 0,
      query: query,
      error: error instanceof Error ? error.message : "API fallback error",
    };
  }
}

/**
 * Scraper with fallback - tries main scraping first, then API
 */
export async function scrapeWithFallback(
  query: string,
  maxResults: number = 10,
): Promise<ArxivSearchResult> {
  // Try main web scraping first
  const mainResult = await scrapePapers(query, maxResults);

  if (mainResult.success && mainResult.data.length > 0) {
    return mainResult;
  }

  // Fallback to ArXiv API if web scraping fails
  console.log("📡 Web scraping failed, trying ArXiv API fallback...");
  return await scrapeArxivAPI(query, maxResults);
}
