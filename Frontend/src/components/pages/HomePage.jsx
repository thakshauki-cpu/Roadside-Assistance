import HomeHeader from "../home/HomeHeader";
import HeroSection from "../home/Herosection";
import HowItWorks from "../home/Howit works";
import ServicesSection from "../home/ServicesSection";
import WhySection from "../home/WhySection";
import CallToAction from "../home/CallToAction";  
import "../styles/home.css";

function HomePage() {
  return (
    <>
      <div>
      <HomeHeader />
      <HeroSection />
      <HowItWorks />
      <ServicesSection />
      <WhySection />
      <CallToAction />
    </div>
    </>
  );
}

export default HomePage;
