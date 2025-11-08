import { HeroSection } from "@/components/HeroSection";
import { BuilderSection } from "@/components/BuilderSection";
import { Header } from "@/components/Header";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <BuilderSection />
    </main>
  );
};

export default Index;
