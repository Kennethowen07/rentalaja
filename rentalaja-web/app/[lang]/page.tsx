// Beranda v3 (design-lab/approved/round-1.html, dipilih 25 Okt 2026).
// Unit populer dinaikkan ke tepat di bawah pencarian, sebelum tiga langkah.

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
      <main className="skala-beranda">
        <Hero />
        <SearchCard />
        <PopularUnits />
        <HowItWorks />
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
