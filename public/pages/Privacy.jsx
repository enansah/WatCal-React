import React from "react";
import legal from "../../legal.json";
import LegalPage, { CONTACT_EMAIL, CONTACT_PHONE } from "./LegalPage.jsx";

// The date lives in legal.json, so sign-up records which version people agreed to
const LAST_UPDATED = legal.privacyUpdated;

// Each section: [id, title, content]. Content is a list of paragraphs; an array inside it is a bullet list.
// Keep these statements in step with what the app actually does.
const SECTIONS = [
  ["collection", "Information We Collect", [
    "We collect the information needed to run your account and produce accurate electricity bills:",
    [
      "Account details: username, email address, date of birth, house address (optional), meter serial number and meter type.",
      "Your password, which we store only in a hashed (scrambled) form. We never store or see it as plain text.",
      "For landlords: the names of your rooms, the email address of the tenant in each room, and an optional profile photo.",
      "Electricity usage: meter readings and the times they were taken, collected automatically from the smart meters linked to your rooms.",
      "Payment details, once online payment is available: the mobile number, network, amount and meter number you enter, and the payment provider's reference.",
    ],
    "We do not use analytics, advertising or tracking tools, and we do not build profiles about you.",
  ]],
  ["usage", "How We Use Your Information", [
    "We use your information to:",
    [
      "create and manage your account and keep you logged in securely;",
      "calculate each room's usage, share of the bill and estimated cost;",
      "show your dashboard, analysis, history and downloadable reports;",
      "process payments and email receipts to tenants when a landlord pays the bill;",
      "send account emails, such as password reset links;",
      "respond when you contact us for help or report a problem.",
    ],
  ]],
  ["sharing", "Who Can See Your Information", [
    "Inside WatCal, information is shared only where billing needs it:",
    [
      "A landlord can see the rooms they added, each room's tenant email, meter readings, usage share and estimated cost.",
      "A tenant can view their own room's bill using their Landlord ID and Tenant ID. Anyone who has both IDs can open that bill, so keep them private.",
      "When a landlord pays, each tenant receives an email receipt showing the landlord's username, the total paid and that tenant's share.",
    ],
  ]],
  ["disclosure", "Information Disclosure", [
    "We do not sell, rent or trade your personal information. We only pass it to others when needed to provide the service, with your consent, or when required by law:",
    [
      "Mobile money providers (MTN MoMo or Telecel Cash) receive the details needed to complete a payment you start.",
      "Our email provider delivers the emails we send you on our behalf.",
      "Authorities, where we are legally required to share information.",
    ],
  ]],
  ["cookies", "Cookies and Browser Storage", [
    "WatCal uses one essential cookie to keep you logged in. It cannot be read by scripts on the page and expires after 20 minutes without activity, when you are logged out automatically.",
    "We also save a few small items in your browser to make the site work smoothly, such as when you were last active, your on/off choice for room electricity switches, and the bill you opened as a tenant. These stay on your device.",
    "You can clear cookies and site data in your browser settings at any time. You will then need to log in again.",
  ]],
  ["security", "Data Security", [
    "We protect your information with hashed passwords, login sessions that end after 20 minutes of inactivity, and checks that limit each landlord to their own rooms and data.",
    "No method of sending or storing data over the internet is 100% secure, so we cannot guarantee absolute security. Please use a strong password, keep your Landlord ID and Tenant ID private, and log out on shared devices.",
  ]],
  ["retention", "How Long We Keep Information", [
    "We keep your account information and meter readings for as long as your account is active, so you can see your history and download reports. Landlords can delete a room's history for any month from the History page.",
    "If you ask us to close your account, we delete your personal information unless we need to keep some of it to meet a legal obligation or resolve a dispute.",
  ]],
  ["rights", "Your Choices and Rights", [
    "You can:",
    [
      "see and update your details at any time on the Edit Profile page;",
      "change or remove your profile photo;",
      "ask us for a copy of the personal information we hold about you;",
      "ask us to correct anything that is wrong, or to delete your account and personal information.",
    ],
    `To make a request, contact us using the details below. We may ask you to confirm your identity first.`,
  ]],
  ["links", "Third-Party Links", [
    "Our website may contain links to other websites, such as our social media pages. We are not responsible for the privacy practices or content of those websites, so please read their privacy policies.",
  ]],
  ["children", "Children's Privacy", [
    "Our services are not directed to anyone under the age of 18, and we do not knowingly collect personal information from children. If you believe a child has given us personal information, please contact us and we will remove it.",
  ]],
  ["changes", "Changes to This Policy", [
    "We may update this Privacy Policy from time to time. When we make important changes, we will tell you by email or with a clear notice on our website, and update the date at the top of this page.",
  ]],
  ["contact", "Contact Us", [
    "If you have questions about this policy or how we handle your information, contact us:",
    [`Email: ${CONTACT_EMAIL}`, `Phone: ${CONTACT_PHONE}`],
  ]],
];

export default function Privacy() {
  return (
    <LegalPage
      pill="Privacy"
      title="Privacy"
      accent="Policy"
      updated={LAST_UPDATED}
      intro="This policy explains what information WatCal collects when you use our billing service, how we use it, who can see it, and the choices you have."
      groups={[{ sections: SECTIONS }]}
      idPrefix="privacy"
    />
  );
}
