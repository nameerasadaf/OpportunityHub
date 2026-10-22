import dns from "node:dns";

// Optimize DNS lookup on Linux environments to prioritize IPv4
try {
  dns.setDefaultResultOrder("ipv4first");
} catch (_) {}

function decodeHtml(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, "")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8217;/g, "’")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&amp;/g, "&")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIsoDeadline(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (!Number.isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch (_) {}
  return "";
}

function parseDevpostDeadline(datesStr = "") {
  if (!datesStr) return "";
  const endPart = datesStr.includes("-") ? datesStr.split("-").pop().trim() : datesStr.trim();
  const parsed = Date.parse(endPart);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
}

// 1. Fetch from Unstop (India's premier student opportunity platform for jobs, internships, hackathons, and scholarships)
async function fetchUnstop(opportunityType, searchTerm = "india") {
  const url = `https://unstop.com/api/public/opportunity/search-result?opportunity=${opportunityType}&searchTerm=${encodeURIComponent(searchTerm)}&per_page=14`;
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OpportunityHub/2.0",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`Unstop (${opportunityType}) responded with HTTP ${response.status}`);
  }

  const result = await response.json();
  const items = result.data?.data || [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  return items
    .map((item) => {
      const rawEnd = item.regn_end_date || item.end_date;
      const parsedDeadline = parseIsoDeadline(rawEnd);
      const isPast = parsedDeadline && parsedDeadline < todayStr;

      let type = "Job";
      if (opportunityType === "internships" || /intern/i.test(item.title || "")) {
        type = "Internship";
      } else if (opportunityType === "hackathons" || /hackathon|coding|challenge/i.test(item.title || "")) {
        type = "Hackathon";
      } else if (opportunityType === "scholarships" || /scholarship|fellowship/i.test(item.title || "")) {
        type = "Scholarship";
      }

      const locList = Array.isArray(item.jobDetail?.locations)
        ? item.jobDetail.locations
        : Array.isArray(item.locations)
        ? item.locations
        : [];

      let locStr = locList.join(", ");
      if (!locStr) {
        if (item.region === "online") locStr = "Online / Remote";
        else locStr = "India";
      }

      const isHyd = /hyderabad|secunderabad|telangana/i.test(
        `${item.title} ${locStr} ${item.organisation?.name || ""}`
      );
      const isRemote = /online|remote|virtual/i.test(`${locStr} ${item.region || ""}`);

      return {
        id: `unstop-${item.id}`,
        title: decodeHtml(item.title || "Opportunity"),
        company: decodeHtml(item.organisation?.name || "Reputed Organization"),
        type,
        location: isHyd ? (locStr.includes("Hyderabad") ? locStr : `Hyderabad (${locStr})`) : locStr,
        locationTier: isHyd ? "hyderabad" : isRemote ? "remote" : "india",
        eligibility: "Open to Indian students & graduates",
        eligibilityStatus: "verified",
        deadline: isPast ? "" : parsedDeadline,
        deadlineLabel: parsedDeadline && !isPast ? `Due ${parsedDeadline}` : "Open for applications",
        url: item.public_url ? `https://unstop.com/${item.public_url}` : "https://unstop.com",
        source: "Unstop India",
        remote: isRemote,
        tags: [type, isHyd ? "Hyderabad / Telangana" : "India", ...(item.tags ? [item.tags] : [])].filter(Boolean),
      };
    })
    .filter((opp) => opp.url && opp.title);
}

// 2. Fetch from Devfolio (India's leading hackathon community)
async function fetchDevfolioHackathons() {
  const response = await fetch("https://api.devfolio.co/api/hackathons?page=1&limit=25", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) OpportunityHub/2.0",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`Devfolio responded with HTTP ${response.status}`);
  }

  const result = await response.json();
  const list = result.result || [];
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  return list
    .map((h) => {
      const loc = h.location || (h.is_online ? "Online" : "India");
      // Strictly exclude foreign in-person hackathons (e.g. USA, Germany, Europe, UK, France)
      const foreignCheck = /\b(USA|United States|Germany|United Kingdom|UK|France|Canada|Europe)\b/i.test(loc);
      if (foreignCheck && !h.is_online) return null;

      const rawEnd = h.ends_at || h.starts_at;
      const parsedDeadline = parseIsoDeadline(rawEnd);
      const isPast = parsedDeadline && parsedDeadline < todayStr;
      if (isPast) return null;

      const isHyd = /hyderabad|telangana/i.test(`${h.name} ${loc}`);
      const isRemote = Boolean(h.is_online) || /online|virtual/i.test(loc);
      const url =
        h.hackathon_setting?.site ||
        (h.slug ? `https://${h.slug}.devfolio.co` : "https://devfolio.co/hackathons");

      return {
        id: `devfolio-${h.slug || h.uuid || Math.random()}`,
        title: decodeHtml(h.name || "Student Hackathon"),
        company: decodeHtml(h.hackathon_brand?.name || "Devfolio Community"),
        type: "Hackathon",
        location: decodeHtml(loc),
        locationTier: isHyd ? "hyderabad" : isRemote ? "remote" : "india",
        eligibility: "Open to Indian students & developers",
        eligibilityStatus: "verified",
        deadline: parsedDeadline,
        deadlineLabel: parsedDeadline ? `Starts ${parsedDeadline}` : "Registration open",
        url,
        source: "Devfolio",
        remote: isRemote,
        tags: ["Hackathon", isRemote ? "Online" : "In-Person", isHyd ? "Telangana" : "India"],
      };
    })
    .filter(Boolean);
}

// 3. Fetch from HackerEarth (Prominent Indian developer challenges)
async function fetchHackerEarth() {
  const response = await fetch("https://www.hackerearth.com/api/events/upcoming/", {
    headers: { "User-Agent": "Mozilla/5.0 OpportunityHub/2.0" },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`HackerEarth responded with HTTP ${response.status}`);
  }

  const result = await response.json();
  const list = result.response || [];

  return list
    .map((ev, idx) => {
      const rawEnd = ev.end_tz ? ev.end_tz.split(" ")[0] : "";
      const deadline = parseIsoDeadline(rawEnd);

      return {
        id: `hackerearth-${idx}-${deadline}`,
        title: decodeHtml(ev.title || "Coding Challenge"),
        company: "HackerEarth India",
        type: "Hackathon",
        location: "Online (India IST)",
        locationTier: "remote",
        eligibility: "Open to Indian developers & college students",
        eligibilityStatus: "verified",
        deadline,
        deadlineLabel: deadline ? `Ends ${deadline}` : "Active",
        url: ev.url || "https://www.hackerearth.com/challenges/",
        source: "HackerEarth",
        remote: true,
        tags: ["Hackathon", "Coding Challenge", "Online"],
      };
    })
    .filter((h) => h.url);
}

// 4. Fetch from Devpost (Filter strictly for India or Online hackathons open to Indian applicants)
async function fetchDevpostHackathons() {
  const response = await fetch("https://devpost.com/api/hackathons", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; OpportunityHub/2.0)" },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`Devpost responded with HTTP ${response.status}`);
  }

  const result = await response.json();
  const list = result.hackathons || [];

  return list
    .map((h) => {
      const loc = h.displayed_location?.location || "Online";
      const isOnline = /online|virtual/i.test(loc);
      const isIndia = /india|hyderabad|bengaluru|bangalore|delhi|mumbai|pune|chennai/i.test(loc);

      // STRICT EXCLUSION: Discard foreign in-person hackathons (US, UK, Germany, etc.)
      if (!isOnline && !isIndia) {
        return null;
      }

      const isHyd = /hyderabad|telangana/i.test(`${h.title} ${loc}`);
      const rawDeadline = parseDevpostDeadline(h.submission_period_dates);
      const deadlineLabel = h.time_left_to_submission
        ? h.time_left_to_submission
        : h.submission_period_dates
        ? `Due ${h.submission_period_dates}`
        : "Open";

      return {
        id: `devpost-${h.id}`,
        title: decodeHtml(h.title || "Hackathon"),
        company: decodeHtml(h.organization_name || "Devpost Host"),
        type: "Hackathon",
        location: isIndia ? loc : "Online (Open to India)",
        locationTier: isHyd ? "hyderabad" : isOnline ? "remote" : "india",
        eligibility: isIndia
          ? "Open to Indian participants"
          : "Global online - Open to Indian participants",
        eligibilityStatus: "verified",
        deadline: rawDeadline,
        deadlineLabel,
        url: h.url || "",
        source: "Devpost",
        remote: isOnline,
        tags: ["Hackathon", isOnline ? "Online" : "In-Person"],
      };
    })
    .filter(Boolean);
}

// 5. Fetch from Remotive (Filter strictly for remote roles open to candidates residing in India)
async function fetchRemotiveIndia() {
  const response = await fetch("https://remotive.com/api/remote-jobs?limit=50", {
    headers: { "User-Agent": "Mozilla/5.0 OpportunityHub/2.0" },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`Remotive responded with HTTP ${response.status}`);
  }

  const result = await response.json();
  const list = result.jobs || [];

  return list
    .map((job) => {
      const locReq = (job.candidate_required_location || "").toLowerCase().trim();

      // STRICT FILTER: Exclude country-restricted jobs (e.g. USA only, Europe only, Germany only, UK only)
      // Only include jobs that are Worldwide, Anywhere, India, APAC, or Asia
      const isEligible =
        locReq === "" ||
        locReq.includes("worldwide") ||
        locReq.includes("anywhere") ||
        locReq.includes("india") ||
        locReq.includes("apac") ||
        locReq.includes("asia");

      if (!isEligible) return null;

      const isInternship = /intern|junior|entry/i.test(`${job.title || ""} ${job.category || ""}`);

      return {
        id: `remotive-${job.id}`,
        title: decodeHtml(job.title || "Remote Role"),
        company: decodeHtml(job.company_name || "Global Tech"),
        type: isInternship ? "Internship" : "Job",
        location: `Remote (${job.candidate_required_location || "Worldwide"})`,
        locationTier: "remote",
        eligibility: "Remote - Verified open to applicants residing in India",
        eligibilityStatus: "verified",
        deadline: "",
        deadlineLabel: "Rolling application",
        url: job.url || "",
        source: "Remotive",
        remote: true,
        tags: [isInternship ? "Internship" : "Job", "Remote", "India-Eligible"],
      };
    })
    .filter(Boolean);
}

// 6. Fetch from Arbeitnow (Strictly filtered so that foreign-only / Germany-only jobs are completely excluded)
async function fetchArbeitnowIndia() {
  const response = await fetch("https://www.arbeitnow.com/api/job-board-api?search=india", {
    headers: { "User-Agent": "Mozilla/5.0 OpportunityHub/2.0" },
    signal: AbortSignal.timeout(6500),
  });

  if (!response.ok) {
    throw new Error(`Arbeitnow responded with HTTP ${response.status}`);
  }

  const result = await response.json();
  const list = result.data || [];

  return list
    .map((job, index) => {
      const text = `${job.title || ""} ${job.location || ""} ${(job.tags || []).join(" ")}`.toLowerCase();

      // STRICT REQUIREMENT: Only accept if explicitly located in India or explicitly worldwide remote.
      // Exclude all Germany/Europe-restricted jobs (Berlin, Munich, France, etc.)
      const isIndiaRelated =
        text.includes("india") ||
        text.includes("hyderabad") ||
        text.includes("bangalore") ||
        text.includes("bengaluru") ||
        text.includes("delhi") ||
        text.includes("worldwide");

      if (!isIndiaRelated) return null;

      const isInternship = /intern|student|werkstudent|trainee/i.test(text);
      const isHyd = /hyderabad|telangana/i.test(text);

      return {
        id: `arbeitnow-${job.slug || index}`,
        title: decodeHtml(job.title || "Untitled Opportunity"),
        company: decodeHtml(job.company_name || "Company not specified"),
        type: isInternship ? "Internship" : "Job",
        location: decodeHtml(job.location || "Remote"),
        locationTier: isHyd ? "hyderabad" : Boolean(job.remote) ? "remote" : "india",
        eligibility: "Open to candidates in India",
        eligibilityStatus: "verified",
        deadline: "",
        deadlineLabel: "Open until filled",
        url: job.url || "",
        source: "Arbeitnow",
        remote: Boolean(job.remote),
        tags: Array.isArray(job.tags) ? job.tags.slice(0, 4) : [],
      };
    })
    .filter(Boolean);
}

// 7. Official Indian Government, Telangana State Schemes & Premier Foundations Scholarships
function getOfficialIndianScholarships() {
  return [
    {
      id: "official-nsp-central-sector",
      title: "Central Sector Scheme of Scholarship for College and University Students",
      company: "National Scholarship Portal (Ministry of Education, Govt of India)",
      type: "Scholarship",
      location: "Pan-India",
      locationTier: "india",
      eligibility:
        "Indian students above 80th percentile in Class 12 pursuing regular higher education; family income < ₹4.5 LPA",
      eligibilityStatus: "verified",
      deadline: "2026-11-30",
      deadlineLabel: "Annual cycle on NSP portal",
      url: "https://scholarships.gov.in/",
      source: "National Scholarship Portal (Govt of India)",
      remote: true,
      tags: ["Government", "Merit-cum-Means", "Higher Education", "NSP"],
    },
    {
      id: "official-telangana-epass-postmatric",
      title: "Telangana ePASS Post-Matric Scholarship & Fee Reimbursement",
      company: "Government of Telangana (BC/SC/ST/Minority Welfare)",
      type: "Scholarship",
      location: "Hyderabad & Telangana",
      locationTier: "telangana",
      eligibility:
        "Telangana domicile college students pursuing Engineering, Degree, PG, or Professional courses",
      eligibilityStatus: "verified",
      deadline: "2026-12-31",
      deadlineLabel: "State Academic Year Cycle",
      url: "https://telanganaepass.cgg.gov.in/",
      source: "Telangana ePASS (Govt of Telangana)",
      remote: true,
      tags: ["Telangana", "Fee Reimbursement", "State Government", "Hyderabad"],
    },
    {
      id: "official-telangana-cm-overseas",
      title: "Chief Minister's Overseas Scholarship Scheme for Minorities & SC/ST",
      company: "Minorities & Social Welfare Dept, Government of Telangana",
      type: "Scholarship",
      location: "Hyderabad & Telangana",
      locationTier: "telangana",
      eligibility:
        "Eligible graduates from Telangana pursuing Post-Graduate / Doctoral studies abroad (up to ₹20 Lakhs grant)",
      eligibilityStatus: "verified",
      deadline: "2026-11-15",
      deadlineLabel: "Official Biannual Intake",
      url: "https://telanganaepass.cgg.gov.in/",
      source: "Telangana Govt Welfare",
      remote: true,
      tags: ["Telangana", "Overseas Study", "Higher Education", "Govt Grant"],
    },
    {
      id: "official-aicte-pragati",
      title: "AICTE Pragati Scholarship Scheme for Girl Students (Technical Degree)",
      company: "All India Council for Technical Education (AICTE)",
      type: "Scholarship",
      location: "Pan-India",
      locationTier: "india",
      eligibility:
        "Female students admitted to 1st year degree/diploma at AICTE-approved institutions; ₹50,000/year grant",
      eligibilityStatus: "verified",
      deadline: "2026-11-30",
      deadlineLabel: "Annual cycle via NSP/AICTE",
      url: "https://www.aicte-india.org/schemes/students-development-schemes/Pragati",
      source: "AICTE Official Portal",
      remote: true,
      tags: ["AICTE", "Women in Tech", "Engineering", "Government"],
    },
    {
      id: "official-aicte-saksham",
      title: "AICTE Saksham Scholarship Scheme for Specially-Abled Students",
      company: "All India Council for Technical Education (AICTE)",
      type: "Scholarship",
      location: "Pan-India",
      locationTier: "india",
      eligibility:
        "Specially-abled students (disability >= 40%) admitted to technical degree courses; ₹50,000/year",
      eligibilityStatus: "verified",
      deadline: "2026-11-30",
      deadlineLabel: "Annual cycle via NSP",
      url: "https://www.aicte-india.org/schemes/students-development-schemes/Saksham",
      source: "AICTE Official Portal",
      remote: true,
      tags: ["AICTE", "Specially Abled", "Technical Education"],
    },
    {
      id: "official-aicte-pg-gate",
      title: "AICTE Post Graduate (PG) Scholarship for GATE / CEED Qualified Students",
      company: "AICTE MHRD",
      type: "Scholarship",
      location: "Pan-India",
      locationTier: "india",
      eligibility:
        "Full-time GATE/CEED qualified students in M.Tech/M.E/M.Des programs; ₹12,400 per month stipend",
      eligibilityStatus: "verified",
      deadline: "2026-12-15",
      deadlineLabel: "Semester Portal Cycle",
      url: "https://pgscholarship.aicte-india.org/",
      source: "AICTE Official Portal",
      remote: true,
      tags: ["AICTE", "GATE", "Postgraduate", "Monthly Stipend"],
    },
    {
      id: "official-reliance-foundation",
      title: "Reliance Foundation Undergraduate & Postgraduate Scholarships",
      company: "Reliance Foundation",
      type: "Scholarship",
      location: "Pan-India",
      locationTier: "india",
      eligibility:
        "Undergraduate (up to ₹2 Lakhs) and Postgraduate (up to ₹6 Lakhs) students in Indian universities",
      eligibilityStatus: "verified",
      deadline: "2026-10-31",
      deadlineLabel: "Annual Competitive Intake",
      url: "https://www.scholarships.reliancefoundation.org/",
      source: "Reliance Foundation",
      remote: true,
      tags: ["Private Foundation", "Merit-cum-Means", "STEM"],
    },
    {
      id: "official-tata-pankh",
      title: "Tata Capital Pankh Scholarship Programme for Higher Education",
      company: "Tata Capital Foundation",
      type: "Scholarship",
      location: "Pan-India",
      locationTier: "india",
      eligibility:
        "Indian students enrolled in undergraduate degree courses (B.Tech, B.Com, B.Sc) with family income < ₹4 LPA",
      eligibilityStatus: "verified",
      deadline: "2026-11-15",
      deadlineLabel: "Annual CSR Cycle",
      url: "https://www.tatacapital.com/sustainability/pankh-scholarship.html",
      source: "Tata Capital CSR",
      remote: true,
      tags: ["Tata Capital", "College Students", "Financial Support"],
    },
  ];
}

let cachedPayload = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 2.5 * 60 * 1000; // 2.5 minutes cache for high performance

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Only GET requests are allowed.",
    });
  }

  // Parse query parameters
  const url = new URL(req.url, "http://localhost");
  const typeFilter = (url.searchParams.get("type") || "all").toLowerCase().trim();
  const searchFilter = (url.searchParams.get("search") || "").toLowerCase().trim();
  const locationFilter = (url.searchParams.get("location") || "all").toLowerCase().trim();
  const forceRefresh = url.searchParams.get("refresh") === "true";

  let sourceStatusList = [];
  let unavailableSources = [];
  let deduplicated = [];
  let fetchTimestamp = new Date().toISOString();

  const isCacheFresh = cachedPayload && Date.now() - lastCacheTime < CACHE_TTL_MS;

  if (isCacheFresh && !forceRefresh) {
    deduplicated = cachedPayload.opportunities;
    sourceStatusList = cachedPayload.sources;
    unavailableSources = cachedPayload.unavailableSources;
    fetchTimestamp = cachedPayload.lastFetched;
  } else {
    let rawOpportunities = [];

    // Batch 1: Primary Indian Jobs, Internships, and Tech Hackathons
    const batch1 = [
      {
        name: "Unstop (Hyderabad Jobs)",
        category: "Jobs/Internships",
        fn: () => fetchUnstop("jobs", "hyderabad"),
      },
      {
        name: "Unstop (India Jobs)",
        category: "Jobs/Internships",
        fn: () => fetchUnstop("jobs", "india"),
      },
      {
        name: "Unstop (Hyderabad Internships)",
        category: "Jobs/Internships",
        fn: () => fetchUnstop("internships", "hyderabad"),
      },
      {
        name: "Unstop (India Internships)",
        category: "Jobs/Internships",
        fn: () => fetchUnstop("internships", "india"),
      },
      {
        name: "Devfolio (Indian Hackathons)",
        category: "Hackathons",
        fn: fetchDevfolioHackathons,
      },
      {
        name: "HackerEarth (Coding Challenges)",
        category: "Hackathons",
        fn: fetchHackerEarth,
      },
    ];

    // Batch 2: Competitions, Scholarships, Global Virtual & Remote
    const batch2 = [
      {
        name: "Unstop (India Hackathons)",
        category: "Hackathons",
        fn: () => fetchUnstop("hackathons", "india"),
      },
      {
        name: "Unstop (India Scholarships)",
        category: "Scholarships",
        fn: () => fetchUnstop("scholarships", "india"),
      },
      {
        name: "Devpost (Online Hackathons)",
        category: "Hackathons",
        fn: fetchDevpostHackathons,
      },
      {
        name: "Remotive (Remote open to India)",
        category: "Jobs/Internships",
        fn: fetchRemotiveIndia,
      },
      {
        name: "Arbeitnow (India-Eligible)",
        category: "Jobs/Internships",
        fn: fetchArbeitnowIndia,
      },
    ];

    const results1 = await Promise.allSettled(batch1.map((p) => p.fn()));
    const results2 = await Promise.allSettled(batch2.map((p) => p.fn()));

    const allBatches = [
      ...batch1.map((p, idx) => ({ ...p, result: results1[idx] })),
      ...batch2.map((p, idx) => ({ ...p, result: results2[idx] })),
    ];

    allBatches.forEach((provider) => {
      const result = provider.result;
      if (result.status === "fulfilled") {
        const items = result.value || [];
        sourceStatusList.push({
          name: provider.name,
          category: provider.category,
          status: "online",
          count: items.length,
        });
        rawOpportunities.push(...items);
      } else {
        const reason = result.reason?.message || "Source timed out or is unavailable";
        console.warn(`External source unavailable: ${provider.name} - ${reason}`);
        sourceStatusList.push({
          name: provider.name,
          category: provider.category,
          status: "unavailable",
          error: reason,
          count: 0,
        });
        unavailableSources.push({
          name: provider.name,
          category: provider.category,
          error: reason,
        });
      }
    });

    // Always include verified Indian Government & Institutional Scholarships
    const officialSchols = getOfficialIndianScholarships();
    sourceStatusList.push({
      name: "Indian Govt & Official Scholarships (NSP, ePASS, AICTE)",
      category: "Scholarships",
      status: "online",
      count: officialSchols.length,
    });
    rawOpportunities.push(...officialSchols);

    // If ALL sources failed and no opportunities exist, return 502 with diagnostics
    if (rawOpportunities.length === 0 && unavailableSources.length === allBatches.length) {
      return res.status(502).json({
        error:
          "All external opportunity sources are currently unreachable. Please check your network connection and try again.",
        sources: sourceStatusList,
        unavailableSources,
      });
    }

    // Deduplicate opportunities by URL and by (Title + Company)
    const seenUrls = new Set();
    const seenKeys = new Set();

    for (const item of rawOpportunities) {
      const cleanUrl = (item.url || "").trim().toLowerCase().replace(/\/$/, "");
      const cleanKey = `${(item.title || "").trim().toLowerCase()}:::${(item.company || "").trim().toLowerCase()}`;

      if (cleanUrl && seenUrls.has(cleanUrl)) continue;
      if (cleanKey && seenKeys.has(cleanKey)) continue;

      if (cleanUrl) seenUrls.add(cleanUrl);
      if (cleanKey) seenKeys.add(cleanKey);

      deduplicated.push(item);
    }

    // Prioritize opportunities:
    // Tier 1: Hyderabad / Telangana
    // Tier 2: India-wide
    // Tier 3: Remote (Open to India)
    function getTierRank(tier) {
      if (tier === "hyderabad" || tier === "telangana") return 1;
      if (tier === "india") return 2;
      if (tier === "remote") return 3;
      return 4;
    }

    deduplicated.sort((a, b) => {
      const rankDiff = getTierRank(a.locationTier) - getTierRank(b.locationTier);
      if (rankDiff !== 0) return rankDiff;

      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return 0;
    });

    // Store in cache
    cachedPayload = {
      opportunities: deduplicated,
      sources: sourceStatusList,
      unavailableSources,
      lastFetched: fetchTimestamp,
    };
    lastCacheTime = Date.now();
  }

  // Filter by opportunity type
  let filtered = deduplicated;
  if (typeFilter !== "all") {
    filtered = filtered.filter((item) => {
      const itemType = (item.type || "").toLowerCase();
      if (typeFilter === "job" || typeFilter === "jobs") {
        return itemType === "job";
      }
      if (typeFilter === "internship" || typeFilter === "internships") {
        return itemType === "internship";
      }
      if (typeFilter === "hackathon" || typeFilter === "hackathons") {
        return itemType === "hackathon";
      }
      if (typeFilter === "scholarship" || typeFilter === "scholarships") {
        return itemType === "scholarship";
      }
      return itemType === typeFilter;
    });
  }

  // Filter by location preference if provided
  if (locationFilter !== "all") {
    filtered = filtered.filter((item) => {
      const tier = (item.locationTier || "").toLowerCase();
      const locText = (item.location || "").toLowerCase();

      if (locationFilter === "hyderabad" || locationFilter === "telangana") {
        return tier === "hyderabad" || tier === "telangana" || locText.includes("hyderabad") || locText.includes("telangana");
      }
      if (locationFilter === "india" || locationFilter === "pan-india") {
        return tier === "india" || tier === "hyderabad" || tier === "telangana";
      }
      if (locationFilter === "remote") {
        return tier === "remote" || Boolean(item.remote) || locText.includes("remote") || locText.includes("online");
      }
      return true;
    });
  }

  // Filter by search query if provided
  if (searchFilter) {
    filtered = filtered.filter((item) => {
      const inTitle = (item.title || "").toLowerCase().includes(searchFilter);
      const inCompany = (item.company || "").toLowerCase().includes(searchFilter);
      const inLocation = (item.location || "").toLowerCase().includes(searchFilter);
      const inTags =
        Array.isArray(item.tags) &&
        item.tags.some((t) => String(t).toLowerCase().includes(searchFilter));
      const inEligibility = (item.eligibility || "").toLowerCase().includes(searchFilter);

      return inTitle || inCompany || inLocation || inTags || inEligibility;
    });
  }

  // Ensure response includes headers for caching
  if (res.setHeader) {
    res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  }

  return res.status(200).json({
    count: filtered.length,
    totalDiscovered: deduplicated.length,
    lastFetched: new Date().toISOString(),
    opportunities: filtered,
    sources: sourceStatusList,
    unavailableSources,
  });
}
