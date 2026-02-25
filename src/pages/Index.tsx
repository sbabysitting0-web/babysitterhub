import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import BabysittersSection from "@/components/landing/BabysittersSection";
import SafetySection from "@/components/landing/SafetySection";
import ReviewsSection from "@/components/landing/ReviewsSection";
import AppSection from "@/components/landing/AppSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="landing-dark min-h-screen">
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <FeaturesSection />
        <BabysittersSection />
        <SafetySection />
        <ReviewsSection />
        <AppSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
