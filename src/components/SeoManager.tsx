import { useEffect } from "react";
import { matchPath, useLocation } from "react-router-dom";

const SITE_NAME = "BabyCare";
const SITE_URL = "https://www.babycare.sg";
const DEFAULT_IMAGE = `${SITE_URL}/logo.png`;

type SeoConfig = {
  path: string;
  title: string;
  description: string;
  keywords: string;
  robots?: string;
};

const SEO_ROUTES: SeoConfig[] = [
  {
    path: "/",
    title: "Find Trusted Babysitters Across Asia",
    description:
      "Find verified babysitters, nannies, and childminders across Asia. Book trusted childcare quickly with BabyCare.",
    keywords:
      "babysitter asia, trusted babysitter, childcare asia, nanny services, babycare",
  },
  {
    path: "/babysitters",
    title: "Browse Verified Babysitters",
    description:
      "Explore babysitter profiles, experience, reviews, and availability to find the right care for your family.",
    keywords:
      "browse babysitters, babysitter profiles, childcare providers asia",
  },
  {
    path: "/babysitters/:id",
    title: "Babysitter Profile",
    description:
      "View detailed babysitter qualifications, reviews, and booking options on BabyCare.",
    keywords: "babysitter profile, sitter reviews, book babysitter",
  },
  {
    path: "/about",
    title: "About BabyCare",
    description:
      "Learn how BabyCare connects families with trusted babysitters through safe, verified childcare matching.",
    keywords: "about babycare, childcare platform asia, trusted babysitting",
  },
  {
    path: "/help",
    title: "Help and Support",
    description:
      "Get support for bookings, accounts, payments, and platform guidance for parents and babysitters.",
    keywords: "babycare help, babysitter support, childcare booking help",
  },
  {
    path: "/terms",
    title: "Terms and Privacy",
    description:
      "Read BabyCare terms of service, privacy policy, and important information for platform users.",
    keywords: "terms of service, privacy policy, babycare legal",
  },
  {
    path: "/tips/parents",
    title: "Parenting and Childcare Tips",
    description:
      "Practical parenting and childcare tips to help families choose safe, reliable babysitting support.",
    keywords: "parenting tips, childcare tips, babysitter advice for parents",
  },
  {
    path: "/tips/babysitters",
    title: "Tips for Babysitters",
    description:
      "Professional tips for babysitters to improve care quality, trust, and communication with families.",
    keywords:
      "babysitter tips, childcare career advice, babysitting best practices",
  },
  {
    path: "/special-needs",
    title: "Special Needs Childcare Support",
    description:
      "Discover compassionate babysitting support and resources for children with special care needs.",
    keywords:
      "special needs babysitter, inclusive childcare, special care support",
  },
  {
    path: "/babysitting-jobs",
    title: "Babysitting Jobs",
    description:
      "Find babysitting opportunities, apply for childcare roles, and grow your profile on BabyCare.",
    keywords: "babysitting jobs asia, childcare jobs, babysitter work",
  },
  {
    path: "/post-job",
    title: "Post a Babysitting Job",
    description:
      "Post your childcare needs and connect with trusted babysitters quickly on BabyCare.",
    keywords: "post babysitting job, hire babysitter, childcare job posting",
  },
  {
    path: "/login",
    title: "Log In",
    description:
      "Log in to BabyCare to manage bookings, messages, and your childcare profile.",
    keywords: "babycare login, parent account login, babysitter login",
    robots: "noindex, nofollow",
  },
  {
    path: "/signup",
    title: "Create an Account",
    description:
      "Join BabyCare to find trusted babysitters or offer babysitting services across Asia.",
    keywords: "babycare signup, create babysitter account, find childcare",
    robots: "noindex, nofollow",
  },
  {
    path: "/select-role",
    title: "Choose Your Role",
    description:
      "Choose whether you are a parent or babysitter to personalize your BabyCare experience.",
    keywords: "parent or babysitter, account setup, babycare onboarding",
    robots: "noindex, nofollow",
  },
  {
    path: "/onboarding/parent",
    title: "Parent Onboarding",
    description:
      "Complete your parent profile to start booking trusted childcare on BabyCare.",
    keywords: "parent onboarding, childcare profile setup, babycare",
    robots: "noindex, nofollow",
  },
  {
    path: "/onboarding/babysitter",
    title: "Babysitter Onboarding",
    description:
      "Set up your babysitter profile to connect with families and receive bookings on BabyCare.",
    keywords: "babysitter onboarding, sitter profile setup, childcare jobs",
    robots: "noindex, nofollow",
  },
  {
    path: "/profile-wizard",
    title: "Profile Setup",
    description:
      "Complete your BabyCare profile to unlock relevant platform features.",
    keywords: "profile wizard, profile setup, babycare account",
    robots: "noindex, nofollow",
  },
  {
    path: "/parent/dashboard",
    title: "Parent Dashboard",
    description:
      "Manage childcare bookings, messages, and preferences from your parent dashboard.",
    keywords: "parent dashboard, manage bookings, childcare account",
    robots: "noindex, nofollow",
  },
  {
    path: "/parent/booking/:sitterId",
    title: "Book a Babysitter",
    description:
      "Review availability and confirm your childcare booking on BabyCare.",
    keywords: "book babysitter, childcare booking, sitter availability",
    robots: "noindex, nofollow",
  },
  {
    path: "/parent/inbox",
    title: "Inbox",
    description:
      "View and manage your conversations with babysitters and families.",
    keywords: "babycare inbox, booking messages, childcare chat",
    robots: "noindex, nofollow",
  },
  {
    path: "/parent/subscription",
    title: "Subscription",
    description: "Manage your BabyCare subscription and billing details.",
    keywords: "babycare subscription, childcare membership, billing",
    robots: "noindex, nofollow",
  },
  {
    path: "/parent/review/:bookingId",
    title: "Write a Review",
    description:
      "Share feedback and rate your babysitting experience on BabyCare.",
    keywords: "babysitter review, childcare feedback, rate sitter",
    robots: "noindex, nofollow",
  },
  {
    path: "/babysitter/dashboard",
    title: "Babysitter Dashboard",
    description:
      "Manage booking requests, profile details, and conversations with families.",
    keywords: "babysitter dashboard, sitter bookings, childcare profile",
    robots: "noindex, nofollow",
  },
  {
    path: "/babysitter/inbox",
    title: "Babysitter Inbox",
    description:
      "Stay connected with families through secure messaging on BabyCare.",
    keywords: "babysitter inbox, parent messages, childcare communication",
    robots: "noindex, nofollow",
  },
  {
    path: "/admin",
    title: "Admin Panel",
    description: "Internal administration dashboard for platform management.",
    keywords: "admin panel, platform management",
    robots: "noindex, nofollow",
  },
  {
    path: "/fix-account",
    title: "Fix Account",
    description: "Resolve account setup issues and continue using BabyCare.",
    keywords: "fix account, account recovery, babycare support",
    robots: "noindex, nofollow",
  },
];

const DEFAULT_SEO: SeoConfig = {
  path: "*",
  title: "Trusted Babysitters for Families",
  description:
    "BabyCare helps families across Asia find safe, verified babysitters and dependable childcare support.",
  keywords: "babysitter, childcare, trusted babysitters, asia families",
};

const upsertMetaByName = (name: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[name='${name}']`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const upsertMetaByProperty = (property: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(
    `meta[property='${property}']`,
  );
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const upsertCanonical = (href: string) => {
  let element = document.head.querySelector<HTMLLinkElement>(
    "link[rel='canonical']",
  );
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const resolveSeoForPath = (pathname: string): SeoConfig => {
  const match = SEO_ROUTES.find((route) =>
    Boolean(matchPath({ path: route.path, end: true }, pathname)),
  );

  return match ?? DEFAULT_SEO;
};

const SeoManager = () => {
  const location = useLocation();

  useEffect(() => {
    const seo = resolveSeoForPath(location.pathname);
    const absoluteUrl = `${SITE_URL}${location.pathname}`;
    const fullTitle = `${seo.title} | ${SITE_NAME}`;
    const robotsValue = seo.robots ?? "index, follow";

    document.title = fullTitle;

    upsertMetaByName("description", seo.description);
    upsertMetaByName("keywords", seo.keywords);
    upsertMetaByName("author", SITE_NAME);
    upsertMetaByName("robots", robotsValue);

    upsertMetaByProperty("og:type", "website");
    upsertMetaByProperty("og:site_name", SITE_NAME);
    upsertMetaByProperty("og:title", fullTitle);
    upsertMetaByProperty("og:description", seo.description);
    upsertMetaByProperty("og:url", absoluteUrl);
    upsertMetaByProperty("og:image", DEFAULT_IMAGE);

    upsertMetaByName("twitter:card", "summary_large_image");
    upsertMetaByName("twitter:title", fullTitle);
    upsertMetaByName("twitter:description", seo.description);
    upsertMetaByName("twitter:image", DEFAULT_IMAGE);

    upsertCanonical(absoluteUrl);
  }, [location.pathname]);

  return null;
};

export default SeoManager;
