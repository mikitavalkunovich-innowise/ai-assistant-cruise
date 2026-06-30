export interface RSSSource {
  name: string;
  url: string;
  regulator: string;
}

export const RSS_SOURCES: RSSSource[] = [
  {
    name: "IMO News",
    url: "https://www.imo.org/en/MediaCentre/PressBriefings/rss.xml",
    regulator: "IMO",
  },
  {
    name: "USCG Maritime Commons",
    url: "https://maritime.dot.gov/blog/rss.xml",
    regulator: "USCG",
  },
  {
    name: "CDC VSP Updates",
    url: "https://www.cdc.gov/vessel-sanitation/rss/vsp-rss.xml",
    regulator: "CDC VSP",
  },
  {
    name: "Maritime Executive",
    url: "https://www.maritime-executive.com/rss",
    regulator: "Industry",
  },
];

// Fallback HTML sources when RSS fails
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
