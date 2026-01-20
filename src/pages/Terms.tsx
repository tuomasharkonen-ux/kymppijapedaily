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
            Terms and Conditions
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

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">4. Data Collection</h2>
            <p className="text-muted-foreground">
              We collect and store the following information: your email address, game results (throws count, 
              winning numbers, dates played), earned badges, and credits. This data is used solely to provide 
              the game service and is not shared with third parties.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">5. Intellectual Property</h2>
            <p className="text-muted-foreground">
              All content, design, and functionality of Kymppijape Daily are the property of the game operator. 
              You may not copy, modify, or distribute any part of the game without permission.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">6. Disclaimer</h2>
            <p className="text-muted-foreground">
              Kymppijape Daily is provided "as is" for entertainment purposes only. There are no real monetary 
              prizes or rewards. Credits and badges earned in the game have no real-world value. We make no 
              guarantees about service availability or data preservation.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">7. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these terms at any time. Continued use of the service after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">8. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these terms or the service, please reach out to Tuomas via{" "}
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
          <Link to="/terms" className="hover:underline">Terms and Conditions</Link>
        </footer>
      </div>
    </div>
  );
};

export default Terms;
