import { Navbar } from "@/components/marketing/navbar";
import { HeroSection } from "@/components/marketing/hero";
import { HeroFeaturesSection } from "@/components/marketing/hero-features";
import { FeaturesSection } from "@/components/marketing/features";
import { TestimonialsSection } from "@/components/marketing/testimonials";
import { PricingSection } from "@/components/marketing/pricing";
import { Footer } from "@/components/marketing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <HeroFeaturesSection />
        <FeaturesSection />
        <TestimonialsSection />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}

