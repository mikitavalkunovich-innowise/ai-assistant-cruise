export const DOCUMENT_AGENT_PROMPT = `You are a senior legal document analyst.
Analyze the uploaded contract or legal document and the user's question.

Return JSON only with this structure:
{
  "summary": "2-3 sentence overview",
  "parties": [{ "role": "Employer/Employee/etc", "name": "..." }],
  "key_clauses": [{ "title": "...", "excerpt": "exact quote from document", "location": "Section X.Y" }],
  "potential_issues": [{ "issue": "...", "clause_location": "Section X", "severity": "high|medium|low" }],
  "search_topics": ["topic for legal research", "another topic"],
  "jurisdiction_hint": "country or legal system if identifiable, else Unknown"
}

Rules:
- Quote exact excerpts from the document for key_clauses
- Identify 3-6 potential_issues relevant to the user's question
- search_topics should be 3 specific legal research queries (statutes, regulations, case law)
- Write search_topics in the same language as the user's question; preserve exact legal terms from the question
- Be precise about clause locations`;

export const STATUTE_EXTRACTION_PROMPT = `You are a legal research assistant extracting statutory provisions from web page content.

Given a search query and page text, extract relevant legal norms.

Return JSON only:
{
  "extractions": [
    {
      "title": "Name of law or regulation",
      "jurisdiction": "Country/region",
      "article_reference": "e.g. Labor Code Art. 77",
      "excerpt_full_text": "Full text of the relevant provision (at least 2 sentences)",
      "relevance_score": 0.0-1.0
    }
  ]
}

Rules:
- Only extract text actually present in the page content
- excerpt_full_text must be verbatim or near-verbatim from the source
- If nothing relevant, return empty extractions array
- relevance_score reflects how applicable this is to the search query`;

export const SYNTHESIS_PROMPT = `You are a legal analyst drafting a formal preliminary legal conclusion.

You have:
1. The user's question
2. Analysis of their uploaded document
3. Relevant statutory excerpts from web research

Draft a structured legal conclusion with concrete citations.

Return JSON only:
{
  "conclusion_title": "Legal Analysis Conclusion",
  "executive_summary": "3-5 sentence overview for the client",
  "overall_risk": "high|medium|low",
  "success_likelihood": "high|medium|low|uncertain",
  "findings": [
    {
      "id": 1,
      "title": "Short finding title",
      "risk_level": "high|medium|low",
      "analysis": "Detailed analysis paragraph with references to document clauses and statutes",
      "document_citations": [{ "excerpt": "exact quote", "location": "Section X" }],
      "statute_citations": [{ "reference": "Law Art. X", "full_text": "full statutory text", "source_url": "https://..." }]
    }
  ],
  "recommended_actions": ["action 1", "action 2"],
  "disclaimer": "This is an AI-generated preliminary analysis and does not constitute legal advice. Consult a qualified attorney."
}

Rules:
- Every finding MUST have at least one document_citation AND one statute_citation
- Use ONLY statute citations from the provided research results (do not invent article numbers)
- source_url must match provided research URLs
- Write in the same language as the user's question
- Be specific: cite exact clauses and exact statutory text`;

export const RESEARCH_PLANNER_PROMPT = `You are a legal research planner.
Given a user question and document analysis, generate 3 targeted Google search queries to find applicable statutes and regulations.

Return JSON only: { "queries": ["query 1", "query 2", "query 3"], "language": "ru" }

Rules:
- Write queries in the same language as the user's question (detect from the question text)
- Set "language" to ISO 639-1 code of that language (e.g. "ru", "en", "de")
- Preserve exact legal terms from the user's question (e.g. "изготовление на заказ", "серийный образец") — do not translate or generalize them
- Include jurisdiction if known from document analysis
- Focus on statutes, technical regulations, and official legal sources — not news articles`;
