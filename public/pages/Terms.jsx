import React from "react";
import legal from "../../legal.json";
import LegalPage, { CONTACT_EMAIL, CONTACT_PHONE } from "./LegalPage.jsx";

// The date lives in legal.json, so sign-up records which version people agreed to
const LAST_UPDATED = legal.termsUpdated;

// Each section: [id, title, content]. Content is a list of paragraphs; an array inside it is a bullet list.
// Keep these statements in step with what the app actually does.
const TERMS = [
  ["acceptance", "Acceptance of These Terms", [
    "By creating an account or using WatCal, you agree to these Terms and Policies. If you do not agree, please do not use the service.",
  ]],
  ["registration", "Account Registration", [
    "You must create an account to use most features of WatCal. You must be at least 18 years old to register.",
    "You agree to provide accurate and complete information when you register, to keep it up to date on the Edit Profile page, and to keep your username and password secure. You are responsible for everything done through your account. Tell us straight away if you think someone else has used it.",
  ]],
  ["landlords", "Landlord Responsibilities", [
    "If you register as a landlord, you agree to:",
    [
      "add only rooms you own or manage, and give each room the correct tenant email address;",
      "tell your tenants that you use WatCal and that their email address and electricity usage will be stored to share the bill;",
      "keep your Landlord ID and your tenants' Tenant IDs private, sharing each Tenant ID only with the tenant of that room;",
      "remove rooms and tenants that no longer apply to your property.",
    ],
  ]],
  ["billing", "Meter Readings and Bills", [
    "WatCal calculates each room's usage, share and estimated cost from the readings of the smart meters linked to your rooms and the published tiered electricity tariff.",
    "These figures are estimates to help landlords and tenants share the bill fairly. They may differ from the bill issued by your electricity provider, for example if a meter is offline, a reading is missed, or the tariff changes. Your electricity provider's bill is the final amount owed.",
    "If you believe a reading or bill is wrong, contact us and we will look into it.",
  ]],
  ["payments", "Payments", [
    "Online payment through mobile money (MTN MoMo and Telecel Cash) is being set up and is not available yet. Until it is, no payment is taken through WatCal.",
    "Once it is available, payments are processed by the mobile money provider and are also subject to that provider's terms. You must check the amount, number and meter details before approving a payment. When a payment is confirmed, each tenant of the landlord's rooms is emailed a receipt showing the amount paid and their share.",
  ]],
  ["tenants", "Tenant Access", [
    "Tenants can view their room's bill using the Landlord ID and Tenant ID given to them by their landlord. Do not share these IDs, because anyone with both can view that bill.",
  ]],
  ["conduct", "User Conduct", [
    "You agree to use WatCal in line with all applicable laws and regulations. You will not:",
    [
      "disrupt or interfere with the website or try to get around its security;",
      "access, or try to access, another person's account, rooms or bills;",
      "enter false meter details or readings, or tenant email addresses without permission;",
      "use WatCal for any unlawful or unauthorised purpose, including spamming, phishing or distributing malware.",
    ],
  ]],
  ["ip", "Intellectual Property", [
    "All content and materials on WatCal, including text, graphics, logos and software, belong to WatCal or its licensors and are protected by copyright and other intellectual property laws. You may not reproduce, modify, distribute or display them without our prior written consent. You may download and keep the reports and statements generated for your own account.",
  ]],
];

const POLICIES = [
  ["privacy", "Privacy", [
    "Our Privacy Policy explains how we collect, use and share your personal information. By using WatCal, you agree to how we handle your information as described in that policy.",
  ]],
  ["availability", "Service Availability", [
    "We work to keep WatCal running smoothly, but we cannot promise it will always be available or free of errors. We may pause the service for maintenance or updates, and meter readings may be delayed if a meter or network connection is down.",
  ]],
  ["suspension", "Suspending or Closing Accounts", [
    "You can ask us to close your account at any time by contacting us.",
    "We may suspend or close an account that breaks these terms, is used to harm others, or that we are required to close by law. Where possible, we will tell you first and explain why.",
  ]],
  ["links", "Third-Party Links", [
    "Our website may contain links to third-party websites, such as our social media pages. We are not responsible for the content or privacy practices of those websites.",
  ]],
  ["liability", "Limitation of Liability", [
    "To the fullest extent allowed by law, WatCal is not liable for any indirect, incidental, special or consequential damages arising out of or in any way connected with your use of our website or services, including losses caused by estimated bills, missed readings or service interruptions.",
  ]],
  ["indemnification", "Indemnification", [
    "You agree to indemnify and hold harmless WatCal, its affiliates, officers, directors, employees and agents from any claims, damages or losses arising out of your use of our website or services, or your breach of these Terms and Policies.",
  ]],
  ["law", "Governing Law", [
    "These Terms and Policies are governed by the laws of the Republic of Ghana.",
  ]],
  ["changes", "Changes to Terms and Policies", [
    "We may update these Terms and Policies from time to time. When we make important changes, we will tell you by email or with a clear notice on our website, and update the date at the top of this page. If you keep using WatCal after a change, you accept the updated terms.",
  ]],
  ["contact", "Contact Us", [
    "If you have questions about these Terms and Policies, contact us:",
    [`Email: ${CONTACT_EMAIL}`, `Phone: ${CONTACT_PHONE}`],
  ]],
];

export default function Terms() {
  return (
    <LegalPage
      pill="Terms and Policies"
      title="Terms and"
      accent="Policies"
      updated={LAST_UPDATED}
      intro="These terms explain the rules for using WatCal, what you can expect from us, and what we expect from landlords and tenants who use the service."
      groups={[
        { title: "Terms", icon: "star.svg", sections: TERMS },
        { title: "Policies", icon: "layers.svg", sections: POLICIES },
      ]}
      idPrefix="terms"
    />
  );
}
