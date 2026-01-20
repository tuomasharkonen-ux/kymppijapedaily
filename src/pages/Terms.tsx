import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>

        <article className="prose prose-sm dark:prose-invert max-w-none">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Terms and Conditions & Privacy Policy
          </h1>

          <p className="text-muted-foreground mb-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">1. Service Description</h2>
            <p className="text-muted-foreground">
              Kymppijape Daily is a free-to-play online dice game provided for entertainment purposes only. 
              The game allows users to play one daily game and track their progress over time.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">2. Account Requirements</h2>
            <p className="text-muted-foreground">
              To save your game progress, earn badges, and appear on leaderboards, you must create an account 
              using a valid email address and password. You are responsible for maintaining the confidentiality 
              of your account credentials.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">3. User Conduct</h2>
            <p className="text-muted-foreground">
              You agree to play the game fairly and not use any automated tools, scripts, or exploits to 
              manipulate game results or gain unfair advantages. Violation of this policy may result in 
              account suspension or termination.
            </p>
          </section>

          {/* Privacy & Data Protection Sections */}
          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Controller</h2>
            <p className="text-muted-foreground">
              The data controller responsible for your personal data is Tuomas Härkönen. For any data-related 
              inquiries, you can contact Tuomas via{" "}
              <a 
                href="https://www.linkedin.com/in/harkonentuomas/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                LinkedIn
              </a>.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Legal Basis for Processing</h2>
            <p className="text-muted-foreground mb-2">
              We process your personal data based on the following legal grounds under GDPR:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Contractual necessity:</strong> To provide the game service, save your progress, and manage your account.</li>
              <li><strong>Legitimate interests:</strong> To improve the game experience and maintain service security.</li>
              <li><strong>Consent:</strong> Where applicable, such as for optional features or communications.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Data We Collect</h2>
            <p className="text-muted-foreground mb-2">
              We collect and process the following categories of personal data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Account data:</strong> Email address and password (securely hashed, never stored in plain text).</li>
              <li><strong>Game data:</strong> Number of throws per game, winning numbers, and dates played.</li>
              <li><strong>Progress data:</strong> Earned badges, credits balance, and game statistics.</li>
              <li><strong>Technical data:</strong> Basic browser and device information necessary for functionality.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Your Data Rights (GDPR)</h2>
            <p className="text-muted-foreground mb-2">
              Under the General Data Protection Regulation (GDPR), you have the following rights:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Right to Access:</strong> Request a copy of your personal data we hold.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data. You can delete your account and all associated data at any time using the "Delete account" option in the game.</li>
              <li><strong>Right to Data Portability:</strong> Request your data in a structured, machine-readable format.</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of how we process your data.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Right to Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              To exercise any of these rights, please contact Tuomas via{" "}
              <a 
                href="https://www.linkedin.com/in/harkonentuomas/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                LinkedIn
              </a>. We will respond to your request within 30 days.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Data Retention</h2>
            <p className="text-muted-foreground mb-2">
              We retain your personal data for the following periods:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Account data:</strong> Retained until you delete your account.</li>
              <li><strong>Game records:</strong> Retained as long as your account exists.</li>
              <li><strong>Badges and credits:</strong> Retained as long as your account exists.</li>
              <li><strong>After account deletion:</strong> All personal data is permanently removed within 30 days.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">9. Third-Party Services</h2>
            <p className="text-muted-foreground mb-2">
              We use the following third-party service providers to operate the game:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Lovable Cloud:</strong> Provides hosting, database infrastructure, and authentication services.</li>
            </ul>
            <p className="text-muted-foreground mt-2">
              We do not sell, rent, or share your personal data with third parties for marketing purposes.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">10. International Data Transfers</h2>
            <p className="text-muted-foreground">
              Your data may be processed on servers located outside of the European Economic Area (EEA). 
              Where such transfers occur, we ensure appropriate safeguards are in place to protect your 
              personal data in accordance with GDPR requirements.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">11. Cookies & Local Storage</h2>
            <p className="text-muted-foreground mb-2">
              We use minimal browser storage for essential functionality:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><strong>Session data:</strong> Required for authentication and maintaining your logged-in state.</li>
              <li><strong>No third-party tracking:</strong> We do not use any third-party tracking or analytics cookies.</li>
              <li><strong>No advertising:</strong> We do not use any advertising cookies or trackers.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">12. Data Security</h2>
            <p className="text-muted-foreground mb-2">
              We implement appropriate technical and organizational measures to protect your personal data:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Passwords are securely hashed and never stored in plain text.</li>
              <li>All data is transmitted over secure HTTPS connections.</li>
              <li>Database access is protected by row-level security policies.</li>
              <li>Regular security updates and monitoring are performed.</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">13. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, design, and functionality of Kymppijape Daily are the property of the game operator. 
              You may not copy, modify, or distribute any part of the game without permission.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">14. Disclaimer</h2>
            <p className="text-muted-foreground">
              Kymppijape Daily is provided "as is" for entertainment purposes only. There are no real monetary 
              prizes or rewards. Credits and badges earned in the game have no real-world value. We make no 
              guarantees about service availability or data preservation.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">15. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the service after 
              changes constitutes acceptance of the new terms. Significant changes will be communicated 
              to registered users via email where possible.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">16. Right to Lodge a Complaint</h2>
            <p className="text-muted-foreground">
              If you believe your data protection rights have been violated, you have the right to lodge 
              a complaint with a supervisory authority in the EU member state of your residence, place of 
              work, or place of the alleged infringement.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">17. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms, privacy matters, or the service, please reach out to Tuomas via{" "}
              <a 
                href="https://www.linkedin.com/in/harkonentuomas/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                LinkedIn
              </a>.
            </p>
          </section>
        </article>

        <footer className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground">
          <Link to="/terms" className="hover:underline">Terms and Conditions & Privacy Policy</Link>
        </footer>
      </div>
    </div>
  );
};

export default Terms;
