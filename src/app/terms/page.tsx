import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Talkotype — accounts, recordings, transcript accuracy, plans, acceptable use, and liability.",
};

const EFFECTIVE = "November 12, 2026";

export default function TermsPage() {
  return (
    <LegalDoc title="Terms of Service" effectiveDate={EFFECTIVE}>
      <section>
        <h2>1. Who we are and what these Terms cover</h2>
        <p>
          These Terms of Service (“Terms”) govern access to and use of the
          Talkotype website at{" "}
          <a href="https://talkotype.app">talkotype.app</a> and related
          applications and services (together, the “Service”).
        </p>
        <p>
          Talkotype is a software service that converts uploaded audio and video
          into editable text transcripts. The Service is operated by the
          business that controls talkotype.app (the “Operator,” “we,” “us,” or
          “our”). The Operator’s legal entity name and registered address will
          be confirmed and published in an updated version of these Terms.
        </p>
        <p>
          By creating an account or using the Service, you agree to these Terms
          and to our{" "}
          <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do
          not use the Service.
        </p>
      </section>

      <section>
        <h2>2. The Service</h2>
        <p>Talkotype may provide features such as:</p>
        <ul>
          <li>account registration and account settings;</li>
          <li>
            uploading audio or video files for transcription (when that feature
            is available);
          </li>
          <li>viewing, editing, and exporting transcripts; and</li>
          <li>plan selection between Free and Unlimited offerings.</li>
        </ul>
        <p>
          Some features described on the marketing site or pricing page may be
          in limited release or not yet available. Where a feature is not yet
          available, these Terms still apply to the parts of the Service you
          can use, and additional notices may appear in the product when new
          features launch.
        </p>
        <p>
          The website is hosted by Vercel. Additional infrastructure providers
          used to store or transcribe files will be identified in the Privacy
          Policy or a linked subprocessor list before those providers process
          customer recordings.
        </p>
      </section>

      <section>
        <h2>3. Accounts and eligibility</h2>
        <p>
          You must provide accurate account information and keep it up to date.
          You are responsible for activity under your account and for keeping
          your login credentials confidential. If you believe your account has
          been accessed without authorization, contact us promptly at{" "}
          <a href="mailto:hello@talkotype.app">hello@talkotype.app</a>.
        </p>
        <p>
          You must be at least 16 years old (or the higher age of digital
          consent in your country) to create an account. If you use Talkotype on
          behalf of a company or other organization, you confirm that you have
          authority to bind that organization, and “you” includes that
          organization.
        </p>
        <p>
          You may not share a single Unlimited login for use by multiple people
          as a substitute for separate seats or accounts, unless we expressly
          offer a team plan that allows it.
        </p>
      </section>

      <section>
        <h2>4. Uploaded recordings and content</h2>
        <h3>4.1 Permissions you need</h3>
        <p>
          You may only upload recordings and related content that you have the
          right to upload and process. That includes having permission from, or
          another valid legal basis covering, people whose voices or personal
          information appear in a recording, where such permission or basis is
          required by law.
        </p>
        <p>
          You must not upload content that is unlawful, that infringes someone
          else’s rights, or that you are prohibited from sharing under a
          contract, workplace policy, or confidentiality obligation.
        </p>

        <h3>4.2 Ownership</h3>
        <p>
          As between you and Talkotype, you retain ownership of the audio,
          video, and other materials you upload (“Customer Content”) and of the
          transcripts generated from your Customer Content for your account
          (“Transcripts”), subject to these Terms.
        </p>

        <h3>4.3 License to operate the Service</h3>
        <p>
          You grant Talkotype a limited license to host, store, transmit,
          process, transcribe, display, and otherwise use Customer Content and
          Transcripts solely as needed to provide, maintain, secure, and
          support the Service for you, including troubleshooting when you ask
          for help. We do not claim ownership of your Customer Content.
        </p>

        <h3>4.4 Sharing</h3>
        <p>
          If the Service later allows sharing links or team access, you are
          responsible for choosing who can access shared items and for any
          disclosure that results from your sharing settings.
        </p>
      </section>

      <section>
        <h2>5. Transcript accuracy</h2>
        <p>
          Transcription is automated and can be wrong. Names, numbers,
          technical terms, accents, overlapping speakers, background noise, and
          speaker labels may be incorrect or incomplete.
        </p>
        <p>
          You should review Transcripts against the original recording before
          relying on them for decisions, publication, legal, medical, financial,
          compliance, or other high-stakes uses. Talkotype does not guarantee
          that any Transcript is complete or error-free.
        </p>
      </section>

      <section>
        <h2>6. Plans, limits, and billing</h2>
        <h3>6.1 Current offer (as published)</h3>
        <p>
          Plan details are shown on the{" "}
          <Link href="/pricing">Pricing</Link> page and may be updated from time
          to time. As of the effective date of these Terms:
        </p>
        <ul>
          <li>
            <strong>Free:</strong> up to 3 transcripts per day; transcription
            limited to the first 30 minutes of each file; one upload at a time;
            original media retained for 7 days; lower processing priority; TXT
            export when export is available.
          </li>
          <li>
            <strong>Unlimited:</strong> no daily transcript cap for one person;
            uploads up to 10 hours or 5 GB per file; up to 50 concurrent
            uploads; original media retained for the life of the subscription;
            higher priority; features such as speaker labels and PDF, DOCX, and
            SRT exports when those features are available; priced at USD 20 per
            month billed monthly, or the yearly equivalent shown on the Pricing
            page (currently USD 14 per month equivalent when billed yearly at
            USD 168 per year, reflecting a 30% discount versus twelve monthly
            payments).
          </li>
        </ul>

        <h3>6.2 Billing status</h3>
        <p>
          Paid subscriptions and automated invoicing are not fully enabled until
          a payment processor is connected and billing is turned on in the
          product. Until then, pricing information is informational. When paid
          billing is enabled, charges will appear through the payment method you
          provide, subscriptions renew for the selected period unless cancelled,
          and applicable taxes may be added.
        </p>

        <h3>6.3 Cancellation, refunds, and end of plan</h3>
        <p>
          When paid billing is live, you may cancel from account settings. Access
          to paid features continues until the end of the then-current paid
          period unless we state otherwise at checkout. Refunds, if any, will
          follow the refund rules published at purchase or in an updated version
          of these Terms.
        </p>
        <p>
          If a paid plan ends or your account is closed, we may delete or
          restrict access to stored recordings and Transcripts after a
          reasonable period, subject to the Privacy Policy and any export window
          we provide in the product. Free-plan limits may be enforced at any
          time once usage metering is active.
        </p>
      </section>

      <section>
        <h2>7. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service for unlawful, harmful, or abusive purposes;</li>
          <li>
            upload malware or attempt to disrupt, scrape, or reverse engineer
            the Service except where mandatory law allows;
          </li>
          <li>
            bypass plan limits, security controls, or access restrictions;
          </li>
          <li>
            use the Service to process content you are not allowed to process;
            or
          </li>
          <li>
            misrepresent your identity or affiliation in a way that harms others
            or Talkotype.
          </li>
        </ul>
      </section>

      <section>
        <h2>8. Suspension, termination, and export</h2>
        <p>
          We may suspend or terminate access if you violate these Terms, if
          needed to protect the Service or other users, or if required by law.
          You may close your account from account settings (or by contacting{" "}
          <a href="mailto:hello@talkotype.app">hello@talkotype.app</a> if
          self-serve closure is unavailable).
        </p>
        <p>
          Where export features are available, you should download Transcripts
          and other available files before closing your account. After closure
          or deletion, recovery may not be possible.
        </p>
      </section>

      <section>
        <h2>9. Intellectual property in the Service</h2>
        <p>
          Talkotype, including its software, branding, and website content
          (other than Customer Content and Transcripts), remains owned by the
          Operator and its licensors. These Terms do not transfer those rights
          to you other than a limited right to use the Service as permitted.
        </p>
      </section>

      <section>
        <h2>10. Disclaimers</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM
          EXTENT PERMITTED BY LAW, WE DISCLAIM WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
          WARRANT THAT THE SERVICE OR ANY TRANSCRIPT WILL BE UNINTERRUPTED,
          ERROR-FREE, OR SUITABLE FOR A PARTICULAR PURPOSE.
        </p>
        <p>
          Nothing in these Terms limits rights that cannot be limited under
          applicable consumer law.
        </p>
      </section>

      <section>
        <h2>11. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, TALKOTYPE AND THE OPERATOR
          WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
          OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL.
        </p>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR TOTAL LIABILITY ARISING
          OUT OF OR RELATING TO THE SERVICE OR THESE TERMS WILL NOT EXCEED THE
          GREATER OF (A) THE AMOUNTS YOU PAID TO TALKIOTYPE FOR THE SERVICE IN
          THE 12 MONTHS BEFORE THE CLAIM OR (B) USD 50 IF YOU HAVE NOT PAID.
        </p>
        <p>
          Some jurisdictions do not allow certain limitations; in those cases,
          the limitation applies to the fullest extent allowed.
        </p>
      </section>

      <section>
        <h2>12. Indemnity</h2>
        <p>
          You will defend and indemnify the Operator against claims, damages,
          and expenses arising from your Customer Content, your use of the
          Service, or your violation of these Terms or applicable law, except
          to the extent caused by our willful misconduct.
        </p>
      </section>

      <section>
        <h2>13. Changes</h2>
        <p>
          We may update these Terms. The effective date at the top will change
          when we do. For material changes, we will provide additional notice
          where required (for example by email or an in-product notice).
          Continued use after the updated Terms take effect means you accept
          them, except where mandatory law requires a different process.
        </p>
      </section>

      <section>
        <h2>14. Governing law and disputes</h2>
        <p>
          Before filing a formal dispute, contact{" "}
          <a href="mailto:hello@talkotype.app">hello@talkotype.app</a> so we
          can try to resolve the issue. Governing law and venue will be
          confirmed when the Operator’s legal entity is finalized and will be
          stated in an updated version of these Terms. Mandatory consumer
          protections in your country of residence remain unaffected.
        </p>
      </section>

      <section>
        <h2>15. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:hello@talkotype.app">hello@talkotype.app</a>
          <br />
          Privacy questions:{" "}
          <a href="mailto:privacy@talkotype.app">privacy@talkotype.app</a>
        </p>
      </section>
    </LegalDoc>
  );
}
