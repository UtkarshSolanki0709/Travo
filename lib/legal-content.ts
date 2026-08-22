// Single source of truth for Travo's legal documents.
// Consumed by the LegalPrivacyModal (profile), the /legal/[doc] screens,
// and the first-launch consent gate.

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalDoc {
  id: "privacy" | "terms" | "guidelines";
  shortTitle: string;
  title: string;
  lastUpdated?: string;
  intro?: string;
  callout?: { title: string; body: string };
  sections: LegalSection[];
}

export const LEGAL_ACCEPTED_KEY = "legal_accepted_v1";

export const PRIVACY_POLICY: LegalDoc = {
  id: "privacy",
  shortTitle: "Privacy Policy",
  title: "Privacy & Data Protection Policy",
  lastUpdated: "August 2026",
  sections: [
    {
      heading: "1. Information We Collect",
      body: "Travo collects location data (latitude/longitude), user profile information (email, display name, username, avatar photo), user-generated posts, photos, videos, activity markers, and direct chat messages to provide interactive location-based social networking features.",
    },
    {
      heading: "2. Use of Location Data",
      body: "Location data is accessed when you explicitly grant location permissions. Live location updates are rendered on interactive map views to show nearby activities and help friends connect. Location updates in the background are only used when live journey sharing is activated. You can disable location access at any time in your device settings.",
    },
    {
      heading: "3. Third-Party Services",
      body: "We use trusted third-party providers: Clerk (Identity & Authentication), Supabase (Encrypted Database & Realtime Messaging), Geoapify (Mapping & Location Search), and Cloudinary (Secure Media Storage). We do not sell your personal data to third-party advertisers.",
    },
    {
      heading: "4. Data Security & Retention",
      body: "Your data is transmitted using encrypted TLS/HTTPS protocols. Row Level Security (RLS) policies restrict unauthorized database access. You may request account deletion or content removal at any time within your profile settings.",
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDoc = {
  id: "terms",
  shortTitle: "Terms of Service",
  title: "Terms of Service Agreement",
  intro: "By using Travo, you agree to these Terms of Service.",
  sections: [
    {
      heading: "1. User Account & Eligibility",
      body: "You must be at least 13 years of age to register and use Travo. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.",
    },
    {
      heading: "2. User Conduct & Prohibited Content",
      body: "You agree not to post, share, or transmit content that is illegal, defamatory, threatening, abusive, harassing, obscene, hateful, or invasive of another person's privacy. Impersonation of other individuals is strictly prohibited.",
    },
    {
      heading: "3. Account Termination & Suspension",
      body: "Travo reserves the right to suspend or terminate user accounts that violate our Terms of Service or Community Guidelines without prior notice.",
    },
  ],
};

export const UGC_GUIDELINES: LegalDoc = {
  id: "guidelines",
  shortTitle: "UGC Safety",
  title: "User-Generated Content (UGC) Guidelines",
  callout: {
    title: "Zero Tolerance Policy for Objectionable Content",
    body: "Travo enforces zero tolerance for harassment, hate speech, explicit content, or dangerous behaviors.",
  },
  sections: [
    {
      heading: "1. Reporting Inappropriate Content",
      body: "Every user post, activity, and message includes a Report button. Flagged content is reviewed by moderation algorithms and administrators within 24 hours.",
    },
    {
      heading: "2. Blocking Abusive Users",
      body: "You can block any user directly from their profile or chat options. Blocking a user immediately prevents them from viewing your location, posts, or sending you messages.",
    },
    {
      heading: "3. Content Moderation & Action",
      body: "Violating posts will be removed permanently, and repeat offenders will be banned from the platform.",
    },
  ],
};

export const LEGAL_DOCS: Record<string, LegalDoc> = {
  privacy: PRIVACY_POLICY,
  terms: TERMS_OF_SERVICE,
  guidelines: UGC_GUIDELINES,
};
