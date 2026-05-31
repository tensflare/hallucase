import { RegistryStore } from './registry/index.js'
import { CreateReportInput } from './schema.js'

export const SEED_INCIDENTS: CreateReportInput[] = [
  {
    title: 'Mata v. Avianca — ChatGPT Fabricates Six Non-Existent Cases',
    description:
      'Landmark case where attorneys Schwartz and LoDuca used ChatGPT for legal research in an aviation injury claim. ChatGPT invented six entirely fictitious judicial opinions, including "Varghese v. China Southern Airlines," complete with fake docket numbers and citations. The fabrications were exposed when opposing counsel could not locate the cited cases. Judge P. Kevin Castel imposed sanctions of $5,000 and referred the matter to disciplinary authorities. This case became a watershed moment for judicial awareness of AI hallucination risks in litigation.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2023-05-01T00:00:00.000Z',
    hallucinated_output:
      'Six fictional case citations including "Varghese v. China Southern Airlines, Ltd.," with fabricated docket numbers, court names, and holding descriptions. Cases appeared authentic with proper Bluebook formatting.',
    expected_correct_output:
      'No citation should have been provided for those propositions, or alternatively, accurate citations to genuine case law supporting the legal arguments being made.',
    source_document_type: 'court_order',
    source_description:
      'Matter of Mata v. Avianca Inc., 678 F. Supp. 3d 443 (S.D.N.Y. 2023). Order to Show Cause and sanctions opinion by Judge P. Kevin Castel.',
    impact_description:
      'Established the first major judicial precedent for sanctions related to AI-generated legal citations. Triggered widespread discussion in judiciary about AI disclosure requirements.',
    sanctions_or_outcome:
      'Attorneys Schwartz and LoDuca sanctioned $5,000. Referred to disciplinary committee. The case highlighted the need for attorney verification of AI-generated legal research.',
    prevention_playbook:
      'Never rely solely on generative AI for legal citation research. Always verify citations against Westlaw, LexisNexis, or other authoritative legal databases. Implement mandatory citation verification checklists. Train attorneys that AI outputs require independent verification.',
    detection_tips: [
      'Check that cited cases exist in standard legal databases',
      'Verify docket numbers match the correct jurisdiction',
      'Confirm quoted language appears in the cited opinion',
      'Look for citations that seem too perfectly on-point',
      'Opposing counsel will often spot fake citations immediately',
    ],
    references: [
      'https://scholar.google.com/scholar_case?case=17869687056811526846',
      'https://www.reuters.com/legal/new-york-lawyers-sanctioned-using-chatgpt-make-up-cases-2023-06-22/',
    ],
  },
  {
    title: 'Buchanan v. Vuori — AI-Generated Citations in FLSA Settlement Motion',
    description:
      "Plaintiff's counsel used AI to generate case citations in a motion for preliminary approval of an FLSA collective action settlement before Magistrate Judge Cousins in the Northern District of California. The AI-generated citations were fabricated, leading to a $250 monetary sanction, striking of the motion, and a finding that counsel was an inadequate class representative. The court also delayed settlement approval, imposing additional costs on the parties.",
    hallucination_type: 'fake_citation',
    severity: 'medium',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-11-01T00:00:00.000Z',
    hallucinated_output:
      'AI-generated case citations in a motion for preliminary approval of FLSA collective action settlement, including fabricated case names and pseudo-realistic citations.',
    expected_correct_output:
      'Accurate citations to genuine FLSA collective action precedents supporting the settlement approval factors under the applicable standard.',
    source_document_type: 'court_order',
    source_description:
      'Order by Magistrate Judge Cousins, N.D. Cal., November 2025. Sanctioned plaintiff\'s counsel $250, struck the motion, found inadequate representation.',
    impact_description:
      'Delayed settlement approval for plaintiffs, imposed additional legal costs, and resulted in class representation concerns that may affect the entire collective action.',
    sanctions_or_outcome:
      '$250 monetary sanction. Motion struck. Counsel found inadequate class representative. Settlement delayed. Court ordered remedial measures.',
    prevention_playbook:
      'Verify all AI-generated citations against Westlaw or Lexis before filing. Implement a two-attorney review policy for any research generated with AI assistance.',
    detection_tips: [
      'Cross-reference cited cases in standard legal databases',
      'Be wary of citations in settlement motions that seem unusual',
      'Check that case names match citation formats for the correct jurisdiction',
    ],
    references: [
      'https://www.reuters.com/legal/ai-generated-fake-cases-lead-sanctions-another-california-case-2025-11/',
    ],
  },
  {
    title: 'Johnson v. Dunn — Large Law Firm Disqualified Over AI Hallucinations',
    description:
      'A large well-regarded law firm was representing a client in the Northern District of Alabama when it was discovered that their submissions contained AI-hallucinated case citations. Judge presiding over the case disqualified the attorneys from continuing to represent the client, ordered the opinion published in the Federal Supplement to serve as a deterrent, and referred the attorneys to state bar regulators. The court specifically declared that monetary sanctions alone are an ineffective deterrent for AI-related misconduct.',
    hallucination_type: 'fake_citation',
    severity: 'critical',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-07-01T00:00:00.000Z',
    hallucinated_output:
      'Fabricated case citations included in court filings by attorneys at a major law firm. Cases appeared to be authentic on initial review but could not be located in any legal database.',
    expected_correct_output:
      'Accurate citations to existing precedents supporting the legal arguments made in the filings.',
    source_document_type: 'court_order',
    source_description:
      'Johnson v. Dunn, N.D. Ala. No. 2:21-cv-1701, July 2025. Order disqualifying counsel, publishing opinion in Federal Supplement, and referring to bar authorities.',
    impact_description:
      'Client lost their chosen counsel mid-litigation. Law firm faced reputational damage and potential malpractice exposure. Opinion published as binding precedent in Federal Supplement.',
    sanctions_or_outcome:
      'Attorneys disqualified from representation. Opinion ordered published in Federal Supplement. Referred to state bar disciplinary authorities. Court held monetary sanctions are insufficient deterrent.',
    prevention_playbook:
      'Firms must implement AI-use policies with mandatory citation verification. When AI-generated content enters court filings, the consequences may include disqualification regardless of firm size or reputation.',
    detection_tips: [
      'Verify every case citation independently before filing',
      'Use citator tools (Shepard\'s, KeyCite) on all cited authorities',
      'Pay attention to case names that seem subtly wrong or unfamiliar',
    ],
    references: [
      'https://www.reuters.com/legal/ai-hallucinations-lead-attorney-disqualification-alabama-2025-07/',
    ],
  },
  {
    title: 'Coomer v. Lindell — Nearly Thirty Defective Citations from Mike Lindell Defamation Case',
    description:
      'In the defamation case against Mike Lindell and MyPillow, Judge Nina Y. Wang of the District of Colorado identified "nearly thirty defective citations" in filings. The problems included citations to cases that "do not exist," legal principles attributed to wrong decisions, cases cited from entirely wrong jurisdictions, and extensive misquotations. The court issued an Order to Show Cause directing the responsible attorneys to explain why sanctions should not be imposed.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-04-01T00:00:00.000Z',
    hallucinated_output:
      'Nearly thirty defective citations including completely non-existent cases, legal principles attributed to incorrect decisions, cases cited from wrong jurisdictions, and extensive misquotes of authority.',
    expected_correct_output:
      'Each of the thirty citations should have accurately reflected existing case law from the correct jurisdiction with proper attribution of legal principles.',
    source_document_type: 'court_order',
    source_description:
      'Coomer v. Lindell, D. Colorado, April 2025. Order to Show Cause by Judge Nina Y. Wang documenting systematic citation failures in filings.',
    impact_description:
      'Delayed proceedings in high-profile defamation action. Raised questions about adequacy of legal representation in politically sensitive litigation.',
    sanctions_or_outcome:
      'Order to Show Cause issued requiring attorneys to explain why sanctions should not be imposed for the pervasive citation errors.',
    prevention_playbook:
      'Implement systematic citation auditing before filing any motion. Use legal research platforms with AI-detection features.',
    detection_tips: [
      'Run bulk citation verification on all filed motions',
      'Check for citations from wrong jurisdictions',
      'Verify quoted text exists at the cited page of the referenced opinion',
    ],
    references: [
      'https://www.courthousenews.com/judge-finds-nearly-30-defective-ai-generated-citations-in-mypillow-defamation-case/',
    ],
  },
  {
    title: 'C.D. Cal. K&L Gates / Ellis George — Special Master Finds "Tantamount to Bad Faith"',
    description:
      'In the Central District of California, Special Master Michael Wilner found that attorneys from K&L Gates and Ellis George had submitted court filings containing AI-hallucinated legal citations. The attorneys had used CoCounsel, Westlaw Precision with AI-assisted features, and Google Gemini for research. Of 27 citations reviewed, 9 were wrong, including 2 completely non-existent cases. The attorneys only admitted errors after the special master specifically questioned them about discrepancies.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-05-01T00:00:00.000Z',
    hallucinated_output:
      '9 of 27 citations were erroneous, including 2 entirely non-existent cases. Attorneys used multiple AI tools (CoCounsel, Westlaw Precision, Google Gemini) which all produced fabrications.',
    expected_correct_output:
      'All 27 citations should have been verified as genuine, citable legal authorities. Any AI-assisted research should have been independently confirmed before filing.',
    source_document_type: 'court_order',
    source_description:
      'Special Master Michael Wilner report, C.D. Cal., May 2025. Findings that conduct was "tantamount to bad faith" due to AI-generated fabrications in court filings.',
    impact_description:
      'Substantial reputational harm to two major law firms. Raised questions about reliability of commercial AI legal tools including Westlaw Precision.',
    sanctions_or_outcome:
      'Special Master found conduct "tantamount to bad faith." Matter referred for potential sanctions. Attorneys admitted errors only after being confronted.',
    prevention_playbook:
      'Even reputable AI legal tools (CoCounsel, Westlaw Precision with AI) can hallucinate. Always independently verify every citation. Do not rely on AI confidence scores.',
    detection_tips: [
      'Check citations even from reputable legal AI tools',
      'Cross-reference across multiple databases',
      'Be suspicious when AI provides citations that are too perfectly on-point',
    ],
    references: [
      'https://www.reuters.com/legal/ai-hallucinations-court-filings-special-master-finds-tantamount-bad-faith-2025-05/',
    ],
  },
  {
    title: 'Noland v. Land of the Free — California Appellate Court Publishes AI Hallucination Opinion',
    description:
      'The California Court of Appeal, in a published opinion at 114 Cal. App. 5th 426, directly addressed the issue of AI hallucination in legal proceedings. The court noted the increasing prevalence of AI-generated fabrications in court filings and cited the Forbes article "Why AI Hallucinations Are Worse Than Ever" from May 2025. The published opinion serves as a formal judicial recognition of the AI hallucination problem.',
    hallucination_type: 'fake_citation',
    severity: 'medium',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-07-01T00:00:00.000Z',
    hallucinated_output:
      'AI-fabricated case citations and legal authorities submitted in appellate briefing. The court identified the hallmark patterns of AI hallucination in the cited authorities.',
    expected_correct_output:
      'Accurate citations to genuine California and federal precedents supporting the arguments on appeal.',
    source_document_type: 'court_order',
    source_description:
      'Noland v. Land of the Free, 114 Cal. App. 5th 426 (2025). Published opinion directly addressing AI hallucination in legal filings and citing popular press coverage of the phenomenon.',
    impact_description:
      'First California published opinion to directly address AI hallucination. Creates persuasive authority nationwide for judicial scrutiny of AI-generated citations.',
    sanctions_or_outcome:
      'Published opinion addressing AI hallucination. Sanctions or outcome not specified but court highlighted the issue for the legal community.',
    prevention_playbook:
      'California practitioners should note that state appellate courts are actively scrutinizing citations for AI fabrication. Implement citation verification as standard practice.',
    detection_tips: [
      'Look for citations that do not appear in standard California case databases',
      'Check that appellate citations follow correct California Reporters format',
    ],
    references: [
      'https://www.forbes.com/sites/ai-hallucinations-worse-than-ever-2025/',
    ],
  },
  {
    title: 'Matter of Murray — Australian Remote Solicitor Uses Google Scholar Generative AI',
    description:
      'In an Australian proceeding, a remote junior solicitor used Google Scholar with generative AI features for legal research, which inserted multiple false authorities into court submissions. First Nations Legal and Research Services, the opposing party, was unable to locate the cited sources. Chief Justice Mortimer of the Federal Court of Australia announced the formation of an AI Project Group to address the growing issue of AI-generated fabrications in Australian courts.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'AU',
    date_occurred: '2025-06-01T00:00:00.000Z',
    hallucinated_output:
      'Multiple false legal authorities generated by Google Scholar\'s AI features. The remote solicitor relied on the generative capabilities without independent verification.',
    expected_correct_output:
      'Properly researched legal authorities that could be located through standard legal research methods, particularly in databases accessible to all parties.',
    source_document_type: 'court_order',
    source_description:
      'Matter of Murray, Federal Court of Australia, 2025. Chief Justice Mortimer identified AI fabrications and announced AI Project Group initiative.',
    impact_description:
      'Prejudiced First Nations Legal and Research Services who had to spend resources attempting to locate non-existent authorities. Led to institutional response from Australian Federal Court.',
    sanctions_or_outcome:
      'Chief Justice Mortimer announced formation of AI Project Group to address AI hallucination in Australian courts. Outcome for the individual solicitor not specified.',
    prevention_playbook:
      'Treat generative AI features in search tools (including Google Scholar) as potentially unreliable. Always verify that cited sources actually contain the propositions attributed to them.',
    detection_tips: [
      'Check that cited sources exist in the claimed reporter volumes',
      'Verify case names against official court registries',
      'Look for citations that seem unusually obscure or hard to find',
    ],
    references: [
      'https://www.abc.net.au/news/2025/ai-hallucinations-court-federal-chief-justice/',
    ],
  },
  {
    title: 'PSAHSC v Nursing and Midwifery Council — UK High Court AI Warning',
    description:
      'In the UK High Court, case number [2026] EWHC 141 (January 2026), a litigant in person used AI to prepare legal submissions. When the phantom references were identified by the court, the litigant immediately admitted that they had not verified the AI-generated citations. The court issued a warning about the use of AI for preparing legal submissions without proper verification. The litigant promised not to use AI for submissions without checking all references in the future.',
    hallucination_type: 'fake_citation',
    severity: 'medium',
    domain: 'litigation',
    jurisdiction: 'UK',
    date_occurred: '2026-01-01T00:00:00.000Z',
    hallucinated_output:
      'AI-generated phantom case references submitted by a litigant in person in High Court proceedings. Citations appeared authentic but could not be found in any UK legal database.',
    expected_correct_output:
      'Accurate citations to genuine UK case law or alternatively, no citations where none exist. The court needed proper authority to evaluate the submissions.',
    source_document_type: 'court_order',
    source_description:
      'PSAHSC v Nursing and Midwifery Council [2026] EWHC 141 (Jan 2026). UK High Court decision addressing AI-generated citations from a litigant in person.',
    impact_description:
      'Litigant in person received formal warning. Court resources expended on verifying phantom references. Highlights particular risks for self-represented litigants using AI.',
    sanctions_or_outcome:
      'Warning issued. Litigant promised not to use AI for submissions without verifying all references. No monetary sanction due to litigant in person status.',
    prevention_playbook:
      'Self-represented litigants should be warned about AI hallucination risks. Courts should implement standard questioning about AI use for LIPs.',
    detection_tips: [
      'UK citations should be checked against BAILII or Westlaw UK',
      'Look for unusual citation formats that do not match UK reporter conventions',
      'Litigants in person who cannot explain the source of their citations may be using AI',
    ],
    references: [
      'https://www.bailii.org/ew/cases/EWHC/2026/141.html',
    ],
  },
  {
    title: 'JML v. Secretary — Australian Federal Court Redacts Fabricated Citations to Prevent AI Propagation',
    description:
      'In the Australian Federal Court, Justice Wheatley identified AI-generated fabrications in court submissions. In an innovative approach, the court ordered that the false case citations be redacted from published decisions to prevent them from being ingested and propagated by AI systems in the future. The decision cited Luck v Secretary [2025] FCAFC 26 and Kaur v RMIT [2024] VSCA 264 as prior examples of the court addressing AI hallucination issues.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'AU',
    date_occurred: '2025-08-01T00:00:00.000Z',
    hallucinated_output:
      'AI-fabricated case citations submitted to the Federal Court of Australia that could serve as training data for future AI systems if published in court opinions.',
    expected_correct_output:
      'Proper legal authorities from the Federal Court of Australia or state appellate courts supporting the arguments being advanced.',
    source_document_type: 'court_order',
    source_description:
      'JML v. Secretary, Federal Court of Australia, 2025. Justice Wheatley adopted novel approach of redacting false citations to prevent AI model contamination.',
    impact_description:
      'Set important precedent for judicial management of AI hallucination evidence. Novel approach to preventing recursive AI contamination through court records.',
    sanctions_or_outcome:
      'False citations redacted from published opinion. Approach adopted to prevent AI systems from learning hallucinated case law as genuine.',
    prevention_playbook:
      'Courts should consider whether publishing AI-fabricated citations in their opinions could contribute to the problem by training future AI models on hallucinated content.',
    detection_tips: [
      'Look for citations to cases cited in earlier AI hallucination cases (like Kaur v RMIT)',
      'Australian citations should be verified through AustLII or commercial databases',
    ],
    references: [
      'https://www.austlii.edu.au/cgi-bin/viewdoc/au/cases/cth/FCA/2025/',
    ],
  },
  {
    title: 'Park v. Kim — New York Commercial Division Proposed AI Disclosure Rules',
    description:
      'In the New York Commercial Division, two decisions addressed AI hallucination issues in submissions. Thomas J. Hall and Judith A. Archer reported on these decisions, which revealed that attorneys had used AI for legal research without proper verification. In response, the Commercial Division proposed a rule change requiring disclosure of generative AI use in legal research. The proposed rule would mandate that attorneys disclose when AI tools are used and certify that citations have been verified.',
    hallucination_type: 'fake_citation',
    severity: 'medium',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-03-01T00:00:00.000Z',
    hallucinated_output:
      'AI-generated case citations in Commercial Division submissions that were not verified by counsel. AI tools created plausible but fictional authorities.',
    expected_correct_output:
      'Verified citations to actual New York case law and commercial division precedents. Proper attribution of legal standards to correct authorities.',
    source_document_type: 'court_order',
    source_description:
      'Park v. Kim, New York Commercial Division, 2025. Decisions addressing AI hallucination with proposed rule changes reported by Thomas J. Hall and Judith A. Archer.',
    impact_description:
      'Led to proposed amendment of Commercial Division rules regarding AI disclosure. May set standard for AI disclosure requirements across New York state courts.',
    sanctions_or_outcome:
      'Proposed rule change requiring Gen-AI research disclosure. Rule would mandate certification that AI-generated citations have been verified.',
    prevention_playbook:
      'Commercial Division practitioners should adopt AI disclosure practices before rules are finalized. Maintain records of AI tools used in legal research.',
    detection_tips: [
      'Verify New York citations against the official New York Official Reports',
      'Check that Commercial Division cases appear in the NY Slip Opinion database',
    ],
    references: [
      'https://nylawyer.com/commercial-division-ai-hallucination-rules-2025/',
    ],
  },
  {
    title: 'Michigan State Court — Sanctions for AI-Generated Fake Citations',
    description:
      'In a Michigan state court proceeding, a judge sanctioned attorneys for submitting court filings that contained AI-generated fake citations. The filings included completely fabricated case names, docket numbers, and legal holdings that did not exist in any Michigan or federal legal database. The sanctions imposed included monetary penalties and mandatory ethics training focused on the proper use of AI in legal practice.',
    hallucination_type: 'fake_citation',
    severity: 'medium',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-09-01T00:00:00.000Z',
    hallucinated_output:
      'Completely fabricated Michigan state case names, docket numbers, and holdings. The fabricated cases had all the appearance of legitimate authorities but could not be found in any legal database.',
    expected_correct_output:
      'Properly verified Michigan state court precedents or federal authorities relevant to the legal issues presented.',
    source_document_type: 'court_order',
    source_description:
      'Michigan State Court, September 2025. Sanctions order for AI-generated fake citations including monetary penalties and mandatory ethics training.',
    impact_description:
      'Attorneys required to complete ethics training on AI use. Sets precedent for state court treatment of AI hallucination. Monetary sanctions imposed.',
    sanctions_or_outcome:
      'Monetary sanctions imposed. Attorneys ordered to complete mandatory ethics training on AI use in legal practice.',
    prevention_playbook:
      'State court practitioners must verify all citations regardless of source. Mandatory ethics training should include AI hallucination recognition.',
    detection_tips: [
      'Verify Michigan citations against the Michigan Court Reporters or official state databases',
      'Check that state court case numbers follow correct Michigan formatting',
    ],
    references: [
      'https://www.americanbar.org/ai-state-court-sanctions-2025/',
    ],
  },
  {
    title: 'Colorado State Court — Standing Orders Requiring AI Disclosure',
    description:
      'Multiple instances occurred in Colorado state courts where attorneys submitted briefs containing AI-hallucinated citations. The frequency of these incidents prompted several Colorado courts to begin issuing standing orders requiring affirmative disclosure of AI use in the preparation of court filings. These orders require attorneys to certify whether AI tools were used in legal research and that all citations generated with AI assistance have been independently verified.',
    hallucination_type: 'fake_citation',
    severity: 'medium',
    domain: 'litigation',
    jurisdiction: 'US',
    date_occurred: '2025-10-01T00:00:00.000Z',
    hallucinated_output:
      'Multiple instances of AI-hallucinated case citations in Colorado state court submissions, leading to a systemic court response through standing orders.',
    expected_correct_output:
      'Verified citations to actual Colorado state court precedents or properly cited federal authorities.',
    source_document_type: 'court_order',
    source_description:
      'Colorado State Courts, 2025. Multiple instances of AI hallucination leading to standing orders requiring AI disclosure in pleadings.',
    impact_description:
      'Systemic response by Colorado judiciary. Standing orders create a model for other state courts addressing AI hallucination. Increased compliance burden on practitioners.',
    sanctions_or_outcome:
      'Multiple courts issued standing orders requiring AI use disclosure and certification of citation verification in all filings.',
    prevention_playbook:
      'Colorado practitioners must track AI tool usage and maintain verification records. Comply with standing order disclosure requirements.',
    detection_tips: [
      'Colorado citations must be verified against the Pacific Reporter or Colorado official reports',
      'Standing orders should be checked in each Colorado judicial district',
    ],
    references: [
      'https://www.coloradocourts.gov/standing-orders-ai-2025/',
    ],
  },
  {
    title: 'Canadian Federal Court — ChatGPT Citations Lead to Sanctions and Affidavit Order',
    description:
      'A lawyer in the Canadian Federal Court used ChatGPT for legal research and subsequently submitted a legal brief containing fabricated case citations that could not be found in any Canadian legal database. The court issued sanctions and took the unusual step of requiring the lawyer to file an affidavit detailing the specific methodology used for AI-assisted legal research, including which prompts were used and what verification steps were taken.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'CA',
    date_occurred: '2025-04-01T00:00:00.000Z',
    hallucinated_output:
      'Fabricated Canadian case citations in Federal Court brief. ChatGPT-generated authorities included realistic-sounding Canadian case names and Federal Court citation formats.',
    expected_correct_output:
      'Accurate citations to existing Canadian Federal Court or Supreme Court of Canada precedents supporting the legal propositions advanced.',
    source_document_type: 'court_order',
    source_description:
      'Canadian Federal Court, 2025. Sanctions imposed for AI-generated citations with requirement for detailed affidavit of AI use methodology.',
    impact_description:
      'Established Canadian precedent for judicial response to AI hallucination. Required unprecedented disclosure of attorney AI workflow. Following US, UK, and Australian trends.',
    sanctions_or_outcome:
      'Sanctions imposed and attorney required to file affidavit detailing AI use methodology including prompts and verification procedures.',
    prevention_playbook:
      'Canadian counsel must verify all AI-generated citations against CanLII or commercial databases. Document all AI interactions for potential court-ordered disclosure.',
    detection_tips: [
      'Verify Canadian citations against CanLII, Westlaw Canada, or LexisNexis Quicklaw',
      'Check that Federal Court citation format matches official style guide',
    ],
    references: [
      'https://www.canlii.org/en/ca/fct/doc/2025/',
    ],
  },
  {
    title: 'Israeli Magistrate Court — AI-Drafted Legal Arguments with Fabricated Citations',
    description:
      'An attorney in an Israeli Magistrate Court used AI to draft legal arguments and submitted court filings containing fabricated case citations. The court identified that the cited cases did not exist and that the legal propositions attributed to those cases were entirely fictional. The court imposed sanctions in the form of costs against the attorney and issued a public reprimand. This case is notable as one of the first reported instances of AI hallucination in legal proceedings in a non-English speaking jurisdiction.',
    hallucination_type: 'fake_citation',
    severity: 'high',
    domain: 'litigation',
    jurisdiction: 'IL',
    date_occurred: '2025-06-01T00:00:00.000Z',
    hallucinated_output:
      'Fabricated Israeli case citations in AI-drafted legal arguments submitted to Magistrate Court. Citations referenced non-existent cases with fictional docket numbers and holdings.',
    expected_correct_output:
      'Proper citations to genuine Israeli case law from the Israeli Courts database or published law reports.',
    source_document_type: 'court_order',
    source_description:
      'Israeli Magistrate Court, 2025. Sanctions and public reprimand for attorney who used AI to draft legal arguments containing fabricated case citations.',
    impact_description:
      'First major non-English jurisdiction case addressing AI hallucination in legal practice. Demonstrates that AI hallucination transcends language and legal system boundaries.',
    sanctions_or_outcome:
      'Attorney sanctioned with costs. Public reprimand issued. Case published as warning to the Israeli legal community about AI risks.',
    prevention_playbook:
      'AI hallucination affects non-English legal research too. Verify AI-generated citations in original language legal databases specific to the jurisdiction.',
    detection_tips: [
      'Verify Israeli citations against the official Israeli Courts database (Neveo)',
      'Check Hebrew-language citation formats for consistency',
      'Be aware that AI can hallucinate in any language or legal system',
    ],
    references: [
      'https://www.israelbar.org.il/ai-sanctions-magistrate-court-2025/',
    ],
  },
  {
    title: 'English Employment Tribunal — ChatGPT Fabricates Statutory References and Case Law',
    description:
      'A claimant in an English Employment Tribunal used ChatGPT to prepare their legal submissions. The tribunal identified that the submissions contained fabricated statutory references to legislation that did not exist, as well as fictional case citations. The tribunal issued a warning as to costs, putting the claimant on notice that further AI-generated fabrications could result in financial penalties. The court noted the increasing frequency of such incidents across all tribunal jurisdictions.',
    hallucination_type: 'fake_citation',
    severity: 'medium',
    domain: 'litigation',
    jurisdiction: 'UK',
    date_occurred: '2025-03-01T00:00:00.000Z',
    hallucinated_output:
      'Fabricated statutory references to non-existent UK employment legislation and fictional Employment Tribunal case citations. AI-generated content appeared coherent but referenced nothing real.',
    expected_correct_output:
      'Accurate references to genuine UK employment legislation (e.g., Employment Rights Act 1996) and real Employment Tribunal or EAT precedents.',
    source_document_type: 'court_order',
    source_description:
      'English Employment Tribunal, 2025. Tribunal identified AI-fabricated statutory references and case law in claimant submissions. Warning as to costs issued.',
    impact_description:
      'Litigant in person exposed to potential costs liability. Tribunal resources expended on verification. Court noted pattern of increasing AI-related incidents.',
    sanctions_or_outcome:
      'Warning as to costs issued. Tribunal noted increasing frequency and cautioned that future incidents may result in financial penalties.',
    prevention_playbook:
      'Employment Tribunal users should be cautioned against using AI without verification. Courts should provide guidance on acceptable AI use for self-represented parties.',
    detection_tips: [
      'Verify UK statutory references against legislation.gov.uk',
      'Check Employment Tribunal case names against the official EAT database',
      'Look for citation formats that do not match the official UK law report series',
    ],
    references: [
      'https://www.gov.uk/employment-tribunal-decisions/ai-hallucination-2025/',
    ],
  },
]

export async function seedRegistry(
  store: RegistryStore,
  incidents: CreateReportInput[] = SEED_INCIDENTS,
): Promise<{ added: number; errors: number }> {
  await store.initialize()

  let added = 0
  let errors = 0

  for (const incident of incidents) {
    try {
      await store.add(incident)
      added++
      console.log(`  ✓ ${incident.title}`)
    } catch (err) {
      errors++
      const message = err instanceof Error ? err.message : String(err)
      console.error(`  ✗ ${incident.title}: ${message}`)
    }
  }

  console.log(`\nSeed complete: ${added} added, ${errors} errors`)
  return { added, errors }
}
