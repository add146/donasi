import Header from "../components/Header";
import Hero from "../components/Hero";
import ImpactStats from "../components/ImpactStats";
import Campaigns from "../components/Campaigns";
import Stories from "../components/Stories";
import Gallery from "../components/Gallery";
import HowItWorks from "../components/HowItWorks";
import Footer from "../components/Footer";
import AppPromo from "../components/AppPromo";
import ArticlesSection from "../components/home/ArticlesSection";
import PartnershipTeaser from "../components/PartnershipTeaser";


export default function PublicHome() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ImpactStats />
        <Campaigns />
        <ArticlesSection />
        <Stories />
        <Gallery />
        <HowItWorks />
        <PartnershipTeaser />
        <AppPromo />
      </main>
      <Footer />
    </>
  );
}
