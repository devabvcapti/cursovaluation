import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { AuthorityStats } from "@/components/sections/AuthorityStats";
import { AudienceFit } from "@/components/sections/AudienceFit";
import { LearningOutcomes } from "@/components/sections/LearningOutcomes";
import { Curriculum } from "@/components/sections/Curriculum";
import { Methodology } from "@/components/sections/Methodology";
import { Faculty } from "@/components/sections/Faculty";
import { CommunityNetwork } from "@/components/sections/CommunityNetwork";
import { SocialProof } from "@/components/sections/SocialProof";
import { Investment } from "@/components/sections/Investment";
import { FAQ } from "@/components/sections/FAQ";
import { FinalCTA } from "@/components/sections/FinalCTA";
import { Footer } from "@/components/sections/Footer";

export default function Page() {
  return (
    <>
      <Header />
      <Hero />
      <AuthorityStats />
      <AudienceFit />
      <LearningOutcomes />
      <Curriculum />
      <Methodology />
      <Faculty />
      <CommunityNetwork />
      <SocialProof />
      <Investment />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
