export interface RSSSource {
  name: string;
  url: string;
  regulator: string;
}

// Official IMO RSS endpoints are currently unavailable (404/HTML).
// Substitutes use stable public feeds with maritime/regulatory content.
export const RSS_SOURCES: RSSSource[] = [
  {
    name: "IMO News",
    url: "https://www.seatrade-maritime.com/rss.xml",
    regulator: "IMO",
  },
  {
    name: "USCG Maritime Commons",
    url: "https://www.federalregister.gov/api/v1/documents.rss?conditions%5Bagencies%5D%5B%5D=coast-guard",
    regulator: "USCG",
  },
  {
    name: "CDC VSP Updates",
    url: "https://tools.cdc.gov/api/v2/resources/media/132608.rss",
    regulator: "CDC VSP",
  },
  {
    name: "Maritime Executive",
    url: "https://www.maritime-executive.com/articles.rss",
    regulator: "Industry",
  },
];

export const FALLBACK_SOURCES = [
  {
    name: "IMO Media Centre",
    url: "https://www.imo.org/en/MediaCentre/PressBriefings/Pages/Default.aspx",
    regulator: "IMO",
  },
  {
    name: "CDC Vessel Sanitation",
    url: "https://www.cdc.gov/vessel-sanitation/about/index.html",
    regulator: "CDC VSP",
  },
];
