import { Navbar } from "@/frontend/components/layout/Navbar";
import { Footer } from "@/frontend/components/layout/Footer";
import { HeroSection } from "./HeroSection";
import { FeatureSection } from "./FeatureSection";
import { StatsSection } from "./StatsSection";
import { TestimonialSection } from "./TestimonialSection";
import { CallToAction } from "./CallToAction";
import { RedirectIfAuthed } from "./RedirectIfAuthed";

/**
 * Public landing page. Marketing content is server-rendered for instant paint;
 * already-logged-in visitors are bounced to the dashboard by RedirectIfAuthed.
 */
export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <RedirectIfAuthed />
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <FeatureSection />
        <StatsSection />
        <TestimonialSection />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
