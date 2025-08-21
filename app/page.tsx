import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Trophy, Target, Code } from "lucide-react";
import Link from "next/link";
import { WhyParticipateSection } from "@/components/03-organisms/why-participate-section";

export const metadata = {
  title: "Earn Rewards Building AI Projects | QED42 AI Bounty Platform",
  description:
    "Join the premier platform where AI developers claim bounties, build innovative projects, and earn rewards. Discover your next AI challenge today.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4 mr-2" />
            Launch Your AI Career Today
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Earn Rewards Building
            <span className="text-purple-600 block">AI Projects</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join the premier platform where AI developers claim bounties, build
            innovative projects, and earn rewards. From machine learning models
            to AI applications - find your next challenge.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={"/project"}>
              <Button
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-3 cursor-pointer"
              >
                Browse Projects
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          {/* <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600">500+</div>
              <div className="text-gray-600">Active Projects</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">$2M+</div>
              <div className="text-gray-600">Total Rewards</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">10K+</div>
              <div className="text-gray-600">Developers</div>
            </div>
          </div> */}
        </div>
      </section>

      {/* Why should you participate? */}
      <WhyParticipateSection />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to start earning rewards for your AI expertise
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. Browse Projects
              </h3>
              <p className="text-gray-600">
                Explore our curated pool of AI projects with clear requirements,
                timelines, and rewards.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Code className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. Claim & Build
              </h3>
              <p className="text-gray-600">
                Claim projects that match your skills and start building
                innovative AI solutions.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. Earn Rewards
              </h3>
              <p className="text-gray-600">
                Submit your completed project and receive your bounty reward
                upon approval.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
