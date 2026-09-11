import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Workflow from "@/components/landing/Workflow";
import Capabilities from "@/components/landing/Capabilities";
import Security from "@/components/landing/Security";
import CTA from "@/components/landing/CTA";

export default function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <Problem />
        <Workflow />
        <Capabilities />
        <Security />
        <CTA />
      </main>
    </>
  );
}