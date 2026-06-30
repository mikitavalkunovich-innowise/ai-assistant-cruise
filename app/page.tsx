import Link from "next/link";
import { Shield, Users, ArrowRight, Anchor, Zap, Globe, FileCheck } from "lucide-react";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-16 text-center">
        <div className="mb-4 flex justify-center">
          <Anchor className="h-12 w-12 text-ncl-blue" />
        </div>
        <h1 className="mb-4 text-4xl font-bold text-ncl-navy">
          Norwegian Cruise Lines
          <br />
          <span className="text-ncl-blue">AI Assistant Prototype</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-600">
          Interactive demo of two AI-powered assistants — migrated from Microsoft Copilot
          to OpenAI GPT. Click either product to explore.
        </p>
      </div>

      <div className="mb-12 grid gap-6 md:grid-cols-2">
        <Link href="/compliance" className="group card hover:border-ncl-blue hover:shadow-lg transition-all">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ncl-navy/10">
            <Shield className="h-6 w-6 text-ncl-navy" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Compliance Auditor</h2>
          <p className="mb-4 text-sm text-gray-600 leading-relaxed">
            Autonomous regulatory monitoring (Agent 1A), SAP training compliance (Agent 1B),
            and Q&A with citations from regulation documents (Agent 2).
          </p>
          <ul className="mb-6 space-y-1 text-sm text-gray-500">
            <li className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-amber-500" /> Real RSS feeds: IMO, USCG, CDC VSP</li>
            <li className="flex items-center gap-2"><FileCheck className="h-3.5 w-3.5 text-green-500" /> Q&A with source citations</li>
            <li className="flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-red-500" /> Training overdue dashboard</li>
          </ul>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-ncl-blue group-hover:gap-2 transition-all">
            Open Compliance Auditor <ArrowRight className="h-4 w-4" />
          </span>
        </Link>

        <Link href="/hr" className="group card hover:border-ncl-blue hover:shadow-lg transition-all">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ncl-blue/10">
            <Users className="h-6 w-6 text-ncl-blue" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">HR Policy & Knowledge Hub</h2>
          <p className="mb-4 text-sm text-gray-600 leading-relaxed">
            Instant HR answers in 30+ languages, policy search with citations,
            and guided onboarding checklist for new hires.
          </p>
          <ul className="mb-6 space-y-1 text-sm text-gray-500">
            <li className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-blue-500" /> Multilingual responses</li>
            <li className="flex items-center gap-2"><FileCheck className="h-3.5 w-3.5 text-green-500" /> Policy answers with citations</li>
            <li className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-purple-500" /> Onboarding checklist</li>
          </ul>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-ncl-blue group-hover:gap-2 transition-all">
            Open HR Hub <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>

      <div className="card bg-ncl-light">
        <h3 className="mb-3 font-semibold text-ncl-navy">Demo Script (5 minutes)</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li><strong>1.</strong> Compliance → Monitor → &ldquo;Run Scan Now&rdquo; → see AI-classified regulatory alerts</li>
          <li><strong>2.</strong> Compliance → Q&A → ask &ldquo;What are USPH galley inspection requirements?&rdquo;</li>
          <li><strong>3.</strong> Compliance → Training → preview Teams notification to manager</li>
          <li><strong>4.</strong> HR Hub → login as <code className="rounded bg-white px-1">newhire@ncl.demo</code> → onboarding checklist</li>
          <li><strong>5.</strong> HR Hub → ask leave policy in any language</li>
          <li><strong>6.</strong> Upload → add a PDF to either knowledge base</li>
        </ol>
        <p className="mt-3 text-xs text-gray-500">
          Demo accounts: officer@ncl.demo / newhire@ncl.demo / employee@ncl.demo — password: demo123
        </p>
      </div>
    </div>
  );
}
