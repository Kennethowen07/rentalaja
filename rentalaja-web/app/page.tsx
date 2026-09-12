// Landing page v2. Urutan section mengikuti README
// "SCREEN UTAMA — Landing Page v2" dari atas ke bawah.

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import SearchCard from "@/components/SearchCard";
import HowItWorks from "@/components/HowItWorks";
import PopularUnits from "@/components/PopularUnits";
import WhyUs from "@/components/WhyUs";
import Testimonials from "@/components/Testimonials";
import ServiceAreas from "@/components/ServiceAreas";
import ProviderCta from "@/components/ProviderCta";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <SearchCard />
        <HowItWorks />
        <PopularUnits />
        <WhyUs />
        <Testimonials />
        <ServiceAreas />
        <ProviderCta />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
