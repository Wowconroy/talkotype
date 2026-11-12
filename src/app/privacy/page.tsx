import type { Metadata } from "next";
import Link from "next/link";
import { LegalDoc } from "@/components/legal-doc";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Talkotype — how account data, recordings, and transcripts are collected, accessed, stored, and deleted.",
};

const EFFECTIVE = "November 12, 2026";

export default function PrivacyPage() {
  return (
    <LegalDoc title="Privacy Policy" effectiveDate={EFFECTIVE}>
      <section>
        <h2>1. Introduction</h2>
        <p>
          This Privacy Policy explains how Talkotype (“Talkotype,” “we,” “us,”
          or “our”) handles personal information when you use{" "}
          <a href="https://talkotype.app">talkotype.app</a> and related
          services (the “Service”).
        </p>
        <p>
          Talkotype is a service that turns uploaded audio and video into
          editable transcripts. This Policy treats <strong>recordings and
          transcripts</strong> separately from ordinary <strong>account and
          website data</strong>, because recordings often contain other
          people’s personal information.
        </p>
        <p>
          The Service is operated by the business that controls talkotype.app
          (the “Operator”). The Operator’s full legal name and address will be
          confirmed and published in an updated version of this Policy.
        </p>
        <p>
          Related terms of use appear in our{" "}
          <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>

      <section>
        <h2>2. What this Policy covers today</h2>
        <p>
          As of the effective date, the public website and account screens are
          live. File upload and cloud transcription are not fully available in
          the product yet. Until those features process customer files, we do
          not receive your audio or video for transcription.
        </p>
        <p>
          Sections below that describe recordings, transcripts, and
          transcription providers apply when you use upload and transcription
          features. We will update this Policy (and any upload notice in the
          product) before those features process customer recordings, including
          naming storage and transcription providers and verified retention
          settings.
        </p>
      </section>

      <section>
        <h2>3. Data we collect and why</h2>

        <h3>3.1 Account and contact data</h3>
        <ul>
          <li>
            <strong>What:</strong> email address, display name, password (stored
            in a hashed form for email signup), and sign-in method.
          </li>
          <li>
            <strong>Source:</strong> you, when you register or update settings.
          </li>
          <li>
            <strong>Purpose:</strong> create and secure your account, provide
            the Service, send service-related messages you enable.
          </li>
          <li>
            <strong>Current implementation note:</strong> account and session
            data for the early product may be stored in your browser
            (localStorage) until a cloud identity system is connected.
          </li>
        </ul>

        <h3>3.2 Recordings (Customer Content)</h3>
        <ul>
          <li>
            <strong>What:</strong> audio or video files you upload, and metadata
            such as filename, duration, format, and upload time.
          </li>
          <li>
            <strong>Source:</strong> you (and anyone whose voice or image appears
            in the file).
          </li>
          <li>
            <strong>Purpose:</strong> produce Transcripts, show them in your
            account, support export, and troubleshoot issues you report.
          </li>
        </ul>

        <h3>3.3 Transcripts</h3>
        <ul>
          <li>
            <strong>What:</strong> text generated from your recordings, including
            optional speaker labels, timestamps, and edits you make.
          </li>
          <li>
            <strong>Source:</strong> derived from your recordings by automated
            processing; edits from you.
          </li>
          <li>
            <strong>Purpose:</strong> deliver the core Service and exports you
            request.
          </li>
        </ul>

        <h3>3.4 Usage, device, and support data</h3>
        <ul>
          <li>
            <strong>What:</strong> plan type, approximate usage against Free-plan
            limits, notification preferences, basic diagnostic logs, and
            messages you send to support.
          </li>
          <li>
            <strong>Source:</strong> your use of the Service and correspondence.
          </li>
          <li>
            <strong>Purpose:</strong> operate limits, improve reliability,
            respond to requests, and protect the Service.
          </li>
        </ul>

        <h3>3.5 Billing data</h3>
        <ul>
          <li>
            <strong>What:</strong> when paid billing is enabled, payment method
            details handled by a payment processor, invoices, and subscription
            status.
          </li>
          <li>
            <strong>Source:</strong> you and the payment processor.
          </li>
          <li>
            <strong>Purpose:</strong> charge for paid plans and keep records
            required for accounting and tax.
          </li>
          <li>
            <strong>Current status:</strong> paid checkout is not fully enabled;
            we do not store full card numbers on Talkotype servers when a
            processor is used.
          </li>
        </ul>

        <h3>3.6 Analytics</h3>
        <p>
          We may use privacy-respectful analytics or hosting metrics (for
          example through our website host) to understand traffic and
          reliability. We do not sell your recordings or transcripts for
          advertising.
        </p>

        <h3>3.7 Lawful bases (where GDPR/UK GDPR applies)</h3>
        <p>Depending on the activity, we rely on:</p>
        <ul>
          <li>
            <strong>Contract</strong> — to provide the Service you request;
          </li>
          <li>
            <strong>Legitimate interests</strong> — to secure and improve the
            Service, prevent abuse, and understand aggregate usage, balanced
            against your rights;
          </li>
          <li>
            <strong>Consent</strong> — where required (for example certain
            marketing emails or optional cookies); and
          </li>
          <li>
            <strong>Legal obligation</strong> — where we must keep records or
            respond to lawful requests.
          </li>
        </ul>
      </section>

      <section>
        <h2>4. Who can access recordings and transcripts</h2>
        <ul>
          <li>
            <strong>You (account holder):</strong> full access to items in your
            account, subject to plan features.
          </li>
          <li>
            <strong>Team members:</strong> only if we offer shared workspaces or
            sharing links and you grant access.
          </li>
          <li>
            <strong>Talkotype staff:</strong> may access Customer Content only as
            needed to operate the Service, fix issues you report, comply with
            law, or enforce our Terms — not for unrelated browsing.
          </li>
          <li>
            <strong>Service providers:</strong> hosting, storage, transcription,
            email, and payment providers process data only to provide their
            services to us, under contractual restrictions.
          </li>
        </ul>
        <p>
          <strong>Verified today:</strong> the website is hosted by{" "}
          <strong>Vercel</strong>. Transcription and media-storage providers
          are not yet connected for customer uploads. When they are, we will
          name them here or in a subprocessor list.
        </p>
        <p>
          If you are a business customer and Talkotype processes personal data
          on your instructions, we act as a processor for that Customer Content.
          A data processing agreement (DPA) can be provided when cloud
          processing is live and you request it.
        </p>
      </section>

      <section>
        <h2>5. Storage, retention, and deletion</h2>
        <p>
          The following table reflects verified practice today and the rules
          that will apply once upload/transcription features process files.
          Periods marked “to be confirmed at launch” will be replaced with exact
          values before those features go live.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <thead>
              <tr>
                <th>Data type</th>
                <th>Where it lives (verified / planned)</th>
                <th>Retention / deletion</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Website pages and app UI</td>
                <td>Vercel (verified)</td>
                <td>Deployed while the Service is offered</td>
              </tr>
              <tr>
                <td>Account/session data (early product)</td>
                <td>Your browser localStorage (verified)</td>
                <td>
                  Until you clear site data, use Delete Account in settings, or
                  we migrate you to cloud accounts
                </td>
              </tr>
              <tr>
                <td>Original recordings</td>
                <td>
                  Not ingested yet; will be stored with a designated storage
                  provider when upload launches
                </td>
                <td>
                  Kept while needed to provide the Service or until you delete
                  them / close the account; any shorter auto-expiry will be
                  shown at upload and listed here
                </td>
              </tr>
              <tr>
                <td>Temporary / derived audio</td>
                <td>Not created yet</td>
                <td>
                  Deleted when no longer needed for the job, subject to short
                  processing windows used by providers
                </td>
              </tr>
              <tr>
                <td>Transcripts</td>
                <td>
                  Not stored in cloud yet; planned account-linked storage when
                  the feature launches
                </td>
                <td>
                  Kept until you delete them or close the account, unless a
                  different period is shown in-product
                </td>
              </tr>
              <tr>
                <td>Operational logs</td>
                <td>Hosting/provider logs as applicable</td>
                <td>
                  Retained for security and reliability for a limited period,
                  then deleted or aggregated
                </td>
              </tr>
              <tr>
                <td>Backups</td>
                <td>Provider backups when cloud storage is enabled</td>
                <td>
                  Roll off on the provider’s backup cycle after deletion from
                  primary storage
                </td>
              </tr>
              <tr>
                <td>Copies at a transcription provider</td>
                <td>None today</td>
                <td>
                  Will follow that provider’s contract and settings (including
                  any zero-retention option we enable); details will be
                  published before use
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          <strong>Manual deletion:</strong> when delete controls exist, removing
          a recording or transcript removes it from primary account storage.{" "}
          <strong>Account closure:</strong> we delete or anonymize account data
          and associated Customer Content from primary systems within a
          reasonable period, except where we must keep limited records (for
          example invoices once billing is live). Backup copies may persist
          until they expire.
        </p>
        <p>
          Claims such as “originals are deleted after seven days” or use of a
          specific provider (for example Cloudflare R2 or AssemblyAI) are{" "}
          <strong>not</strong> current Talkotype policy unless and until
          implemented and described here.
        </p>
      </section>

      <section>
        <h2>6. AI training and human review</h2>
        <p>
          Talkotype’s product intent is to process your recordings to create
          Transcripts for your account, not to sell your content or use it as
          open training data for unrelated models.
        </p>
        <p>
          We do <strong>not</strong> currently send customer recordings to a
          transcription provider. Before we do, we will document in this Policy:
        </p>
        <ul>
          <li>whether Talkotype uses Customer Content to train Talkotype models;</li>
          <li>
            whether the transcription provider is contractually barred from
            training on your content; and
          </li>
          <li>
            whether humans may review audio or text (for example for abuse
            review or when you ask for support).
          </li>
        </ul>
        <p>
          Until those settings are verified, assume only automated processing
          needed to provide the Service will occur, and staff access will be
          limited as described in Section 4.
        </p>
      </section>

      <section>
        <h2>7. Transfers, cookies, and similar technologies</h2>
        <h3>7.1 Locations</h3>
        <p>
          The website is served via Vercel’s global network. Exact storage
          regions for recordings and transcripts will be listed when cloud
          processing launches. If personal data is transferred internationally,
          we will use appropriate safeguards required by applicable law (such as
          standard contractual clauses where relevant).
        </p>

        <h3>7.2 Cookies and local storage</h3>
        <p>
          We use browser storage to keep you signed in and to remember account
          preferences in the early product. Hosting providers may set cookies
          needed for security and performance. We will update this section if we
          add additional analytics cookies that require consent.
        </p>
      </section>

      <section>
        <h2>8. Your rights and choices</h2>
        <p>
          Depending on where you live, you may have rights to access, correct,
          delete, or export personal information, to object to or restrict
          certain processing, and to withdraw consent where processing is
          consent-based.
        </p>
        <p>
          You can update some account details and notification preferences in{" "}
          <Link href="/account">Account Settings</Link>, and you can use Delete
          Account there for the current self-serve flow. For privacy requests,
          email{" "}
          <a href="mailto:privacy@talkotype.app">privacy@talkotype.app</a>. We
          may need to verify your request.
        </p>
        <p>
          If you are in the EEA, UK, or Switzerland, you may also complain to
          your local data protection authority.
        </p>
      </section>

      <section>
        <h2>9. Children</h2>
        <p>
          The Service is not directed to children under 16 (or the higher age
          required in your country). We do not knowingly collect personal
          information from children below that age. If you believe we have,
          contact us and we will take appropriate steps.
        </p>
      </section>

      <section>
        <h2>10. Changes</h2>
        <p>
          We may update this Policy. The effective date will change when we do.
          For material changes that affect recordings or transcripts, we will
          provide additional notice where required.
        </p>
      </section>

      <section>
        <h2>11. Contact</h2>
        <p>
          Privacy contact:{" "}
          <a href="mailto:privacy@talkotype.app">privacy@talkotype.app</a>
          <br />
          General contact:{" "}
          <a href="mailto:hello@talkotype.app">hello@talkotype.app</a>
          <br />
          Website:{" "}
          <a href="https://talkotype.app">https://talkotype.app</a>
        </p>
      </section>
    </LegalDoc>
  );
}
