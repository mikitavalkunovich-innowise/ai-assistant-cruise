"use client";

import { useState, useEffect } from "react";
import { Chat } from "@/components/Chat";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

export default function HRPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isNewHire, setIsNewHire] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        const session = data.session;
        if (session) {
          setUserEmail(session.email);
          setIsNewHire(session.role === "newhire");
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ncl-navy">HR Policy & Knowledge Hub</h1>
        <p className="text-sm text-gray-500">
          Agent — instant HR answers in your language, grounded in NCL policy documents
        </p>
      </div>

      <div className={`grid gap-6 ${isNewHire ? "lg:grid-cols-3" : "lg:grid-cols-1"}`}>
        <div className={isNewHire ? "lg:col-span-2" : ""}>
          <div className="card h-[calc(100vh-14rem)] overflow-hidden p-0">
            <Chat
              kb="hr"
              placeholder="Ask any HR question — leave, benefits, conduct, onboarding..."
              suggestions={[
                "How many annual leave days do I get?",
                "What is the sick leave policy?",
                "¿Cuántos días de vacaciones tengo?",
                "What should I do on my first day?",
                "How do I report harassment?",
              ]}
            />
          </div>
        </div>

        {isNewHire && userEmail && (
          <div>
            <OnboardingChecklist userEmail={userEmail} />
          </div>
        )}

        {!userEmail && (
          <div className="card border-dashed border-ncl-blue/30 bg-ncl-blue/5 text-center">
            <p className="text-sm text-gray-600">
              <a href="/login" className="font-medium text-ncl-blue hover:underline">
                Login as newhire@ncl.demo
              </a>{" "}
              to see the onboarding checklist
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
