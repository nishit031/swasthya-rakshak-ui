/**
 * English copy for Swasthya Rakshak.
 * Keys are accessed with dot-paths via useTranslation()'s `t("nav.home")`.
 * `hi.ts` mirrors this shape; missing keys fall back to English.
 */
export const en = {
  brand: "Swasthya Rakshak",

  nav: {
    home: "Home",
    features: "Features",
    about: "About",
    login: "Log in",
    register: "Get started",
    language: "हिं"
  },

  hero: {
    tagline: "Your personal health companion",
    titleLead: "Your family's health,",
    titleHighlight: "safe in one place",
    description:
      "Keep every prescription, lab report, and medical record for you and your family in one calm, private place. Simple reminders, a clear health timeline, and easy-to-understand summaries.",
    ctaPrimary: "Get started — it's free",
    ctaSecondary: "Log in",
    trustedBy: "families trust us with their records",
    floating: {
      records: {
        title: "All records, one place",
        description: "Prescriptions, reports and visits together"
      },
      reminders: {
        title: "Never miss a dose",
        description: "Gentle medication & appointment reminders"
      },
      private: { title: "Private & secure", description: "Your data stays yours, always" }
    }
  },

  features: {
    heading: "Everything your family's health needs",
    subheading: "Built for patients first — simple, calm, and private.",
    items: {
      records: {
        title: "Medical Records",
        description:
          "Store visits, documents and history for every family member, neatly organised."
      },
      prescriptions: {
        title: "Prescriptions",
        description: "Track medicines, doctors and diagnoses so nothing gets lost."
      },
      labReports: {
        title: "Lab Reports",
        description: "Keep test results in one place and see them explained simply."
      },
      reminders: {
        title: "Reminders",
        description: "Timely nudges for medicines, tests, appointments and vaccinations."
      },
      family: {
        title: "Family Members",
        description: "Manage health records for parents, children and dependents together."
      },
      ai: {
        title: "Simple Summaries",
        description: "Plain-language summaries that help you understand your reports."
      }
    },
    learnMore: "Learn more"
  },

  stats: {
    heading: "Trusted by families across India",
    items: {
      families: { label: "Families", description: "managing health with us" },
      records: { label: "Records kept", description: "safe and organised" },
      reminders: { label: "Reminders sent", description: "so no dose is missed" },
      uptime: { label: "Uptime", description: "reliable, around the clock" }
    }
  },

  testimonials: {
    heading: "Loved by patients and caregivers",
    items: {
      one: {
        quote:
          "I finally have all my father's reports in one place. No more searching through files before every visit.",
        name: "Priya Sharma",
        role: "Caregiver, Pune"
      },
      two: {
        quote:
          "The medicine reminders are a lifesaver for my mother. Simple and gentle, exactly what we needed.",
        name: "Rahul Verma",
        role: "Patient, Delhi"
      },
      three: {
        quote:
          "The summaries explain my lab reports in language I actually understand. It feels calm, not clinical.",
        name: "Anjali Nair",
        role: "Patient, Kochi"
      }
    }
  },

  cta: {
    heading: "Take charge of your family's health today",
    description:
      "Free to start. Your records, reminders and timeline — all in one calm, private place.",
    primary: "Create your free account",
    secondary: "Log in"
  },

  footer: {
    tagline: "A patient-first digital health companion.",
    product: "Product",
    company: "Company",
    contact: "Contact",
    rights: "All rights reserved.",
    disclaimer:
      "Swasthya Rakshak is a personal health record companion and does not provide medical advice."
  },

  auth: {
    login: {
      title: "Welcome back",
      subtitle: "Log in to your health companion",
      phone: "Mobile number",
      password: "Password",
      withPassword: "Use password",
      withOtp: "Use OTP",
      sendOtp: "Send OTP",
      otp: "One-time password",
      submit: "Log in",
      noAccount: "New here?",
      registerLink: "Create an account",
      doctorPrompt: "Are you a doctor?",
      doctorLink: "Register as a doctor"
    },
    register: {
      title: "Create your account",
      subtitle: "Start keeping your family's health in one place",
      fullName: "Full name",
      phone: "Mobile number",
      password: "Password",
      gender: "Gender",
      genderPlaceholder: "Select gender",
      genderOptions: { male: "Male", female: "Female", other: "Other" },
      submit: "Continue",
      verifyTitle: "Verify your number",
      verifySubtitle: "Enter the code we sent to your mobile",
      otp: "One-time password",
      verify: "Verify & continue",
      haveAccount: "Already have an account?",
      loginLink: "Log in"
    },
    doctorRegister: {
      title: "Create your doctor account",
      subtitle: "Connect with your patients and prescribe in-app",
      fullName: "Full name",
      specialization: "Specialization",
      licenseNumber: "Medical license number",
      clinicName: "Clinic / hospital name",
      patientPrompt: "Registering as a patient?",
      patientLink: "Go to patient sign up"
    },
    step: "Step {current} of {total}"
  },

  dashboard: {
    greetingMorning: "Good morning",
    greetingAfternoon: "Good afternoon",
    greetingEvening: "Good evening",
    upcoming: "upcoming",
    healthRecords: "health records",
    quickActions: "Quick Actions",
    upcomingReminders: "Upcoming Reminders",
    recentActivity: "Recent Activity",
    viewAll: "View all",
    fullTimeline: "Full timeline",
    noReminders: "No upcoming reminders.",
    setReminder: "Set a reminder",
    noActivity: "No activity yet.",
    activityHint: "Events appear as you add records and prescriptions.",
    today: "Today"
  },

  reminders: {
    notification: {
      dueTitle: "Reminder: {title}",
      dueBody: "{type} · scheduled for {time}",
      doseBody: "{slot} dose, {food} · scheduled for {time}",
      instructionsNote: "Note: {diagnosis}",
      slot: { morning: "Morning", afternoon: "Afternoon", evening: "Evening", night: "Night" },
      food: { before: "before food", after: "after food" },
      markDone: "Mark done",
      taken: "Taken",
      dismiss: "Dismiss"
    },
    tabs: {
      active: "Active",
      upcoming: "Upcoming",
      completed: "Completed"
    },
    acknowledge: "Mark as taken",
    activeCount: "{n} active",
    allCaughtUp: "All caught up",
    pagination: {
      pageOf: "Page {page} of {total}",
      previous: "Previous",
      next: "Next"
    },
    empty: {
      active: {
        title: "Nothing active",
        description: "You're all caught up — nothing due right now."
      },
      upcoming: {
        title: "No upcoming reminders",
        description:
          "Set reminders for medications, appointments, tests, and vaccinations so you never miss them."
      },
      completed: {
        title: "No completed reminders",
        description: "Reminders you've finished will show up here."
      }
    }
  },

  nav2: {
    dashboard: "Dashboard",
    family: "Family",
    medicalRecords: "Medical Records",
    prescriptions: "Prescriptions",
    labReports: "Lab Reports",
    reminders: "Reminders",
    timeline: "Timeline",
    profile: "Profile",
    add: "Add",
    signOut: "Sign out",
    viewProfile: "View Profile",
    healthTimeline: "Health Timeline",
    myDoctors: "My Doctors",
    myPatients: "My Patients",
    patientIntel: "Health Profile",
    companion: "AI Companion",
    billing: "Plans & Billing"
  },

  companion: {
    title: "AI Companion",
    subtitle: "Ask about your medicines, reports, and records — grounded only in your own data.",
    familyMemberSelf: "Myself",
    newChat: "New chat",
    noSessions: "No conversations yet.",
    untitledChat: "New conversation",
    inputPlaceholder: "Ask about a medicine, report, or reminder…",
    send: "Send",
    generating: "Generating response…",
    disclaimer:
      "This assistant summarizes information already in your records. It does not diagnose conditions or replace advice from your doctor.",
    empty: {
      title: "Ask your AI Companion",
      description:
        "Try \u201cWhat medicines am I currently on?\u201d or \u201cExplain my last lab report.\u201d"
    }
  },

  patientIntel: {
    title: "Health Profile",
    subtitle: "{n} records · {unprocessed} awaiting processing",
    familyMemberAny: "Myself",
    provenance: { fact: "Fact", pattern: "Pattern" },
    empty: {
      title: "Your health profile is empty",
      description:
        "Process a few medical records and this page will build a longitudinal view of your conditions, medications, and care history."
    },
    stats: {
      records: "Total Records",
      conditions: "Active Conditions",
      medications: "Medications Tracked",
      followUps: "Outstanding Follow-ups"
    },
    sections: {
      overview: "Health Overview",
      timeline: "Health Timeline",
      conditions: "Active Conditions",
      medications: "Medication History",
      imaging: "Imaging History",
      procedures: "Procedure History",
      vaccinations: "Vaccination History",
      recentRecords: "Recent Records",
      followUps: "Outstanding Follow-ups",
      insights: "Patient Insights",
      relationships: "Record Relationships",
      providers: "Providers",
      facilities: "Facilities"
    },
    conditions: {
      firstMentioned: "First mentioned",
      lastMentioned: "Last mentioned",
      mentionedIn: "Mentioned in {n} records",
      relatedMedications: "Related medications"
    },
    medications: {
      current: "Current",
      empty: "No medication history yet."
    },
    medicationStatus: {
      started: "Started",
      changed: "Changed",
      dose_modified: "Dose Modified",
      stopped: "Stopped",
      current: "Current",
      discontinued: "Discontinued",
      unknown: "Unknown"
    },
    imaging: {
      empty: "No imaging studies yet.",
      studyCount: "{n} studies"
    },
    procedures: {
      empty: "No procedures recorded yet."
    },
    vaccinations: {
      empty: "No vaccination records yet.",
      upcoming: "Upcoming: {note} on {date}",
      doseCount: "{n} doses recorded"
    },
    followUps: {
      empty: "No outstanding follow-ups — you're all caught up."
    },
    insights: {
      empty: "Insights will appear here once you have a few processed records."
    },
    relationships: {
      empty: "No linked records yet.",
      linkCount: "{n} linked record pairs",
      reason: "Reason: {reason}"
    },
    episodes: {
      eventCount: "{n} events"
    }
  },

  common: {
    loading: "Loading…",
    error: "Something went wrong. Please try again.",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    add: "Add",
    showMore: "Show more",
    showLess: "Show less"
  },

  labReportsAi: {
    summarize: "Summarize",
    extract: "Extract data",
    summarizing: "Reading…",
    extracting: "Extracting…",
    summaryTitle: "Simple summary",
    extractedTitle: "Extracted values",
    aiNote: "AI-generated — always confirm with your doctor.",
    consentNeeded: "Turn on AI processing in your profile to use this.",
    summaryReady: "Summary ready",
    notAnalyzed: "Not analyzed",
    // Add-report modal
    addTitle: "Add lab report",
    editTitle: "Edit lab report",
    addSubtitle: "Upload a report — AI will fill in the details for you",
    uploadLabel: "Report file (PDF or photo)",
    uploadHint: "We'll read it and fill in the details automatically",
    dropHint: "Drop your file here",
    fieldTestName: "Test name",
    fieldLabName: "Lab name",
    fieldReportDate: "Report date",
    forMember: "For family member (optional)",
    self: "— self —",
    save: "Save report",
    saving: "Saving…",
    uploading: "Uploading…",
    // Staged loader — analyze
    stageReading: "Reading your report…",
    stageOcr: "Running OCR…",
    stageExtracting: "Extracting report information…",
    stageDone: "Done",
    // Metadata card
    metaTitle: "AI Extraction",
    parsedOk: "Report parsed successfully",
    parsedPartial: "Some fields could not be confidently extracted",
    verify: "AI detected this value. Please verify.",
    // Confidence
    confidence: "Confidence",
    confHigh: "High confidence",
    confReview: "Review suggested",
    confLow: "Low confidence",
    // Summary sections
    secOverall: "Overall status",
    secKeyFindings: "Key findings",
    secAbnormal: "Abnormal results",
    secNormal: "Normal results",
    secFollowUp: "Follow-up",
    disclaimer:
      "This is an AI-generated summary, not a medical diagnosis. Always confirm results with your healthcare provider.",
    generatedAt: "Generated",
    aiConfidence: "AI confidence",
    resultNormal: "Normal",
    resultReview: "Review suggested",
    noFindings: "No abnormal results were detected.",
    // Staged loader — summary
    stageGenerating: "Generating AI summary…",
    stageAlmost: "Almost done…",
    // Summary action bar
    actViewOriginal: "View original",
    thumbnailAlt: "Lab report preview",
    thumbnailAltNamed: "Preview of {name}",
    thumbnailViewLabel: "View report file",
    viewerOpenExternal: "Open in browser",
    viewerZoomIn: "Zoom in",
    viewerZoomOut: "Zoom out",
    viewerZoomReset: "Reset zoom",
    viewerSideSummary: "AI Summary",
    viewerSideValues: "Lab Values",
    viewerUnsupportedType: "This file type cannot be previewed in the app.",
    actDownloadReport: "Download report",
    actDownloadSummary: "Download summary",
    actRegenerate: "Regenerate",
    actViewExtracted: "View extracted data",
    // Smart errors
    errRead: "We couldn't read this report automatically. Please fill the details manually.",
    errBlurry: "The uploaded image appears blurry. Try uploading a clearer scan.",
    // Collapsible summary / tabbed workspace
    viewSummary: "View AI Summary",
    hideSummary: "Hide AI Summary",
    viewDetails: "View details",
    hideDetails: "Hide details",
    tabSummary: "AI Summary",
    tabValues: "Lab Values",
    colTest: "Test",
    colResult: "Result",
    colRange: "Reference Range",
    colStatus: "Status",
    searchValues: "Search test…",
    // Summary generation progress
    genTitle: "Generating AI Summary…",
    stepOcr: "Reading OCR text",
    stepPii: "Removing personal information",
    stepAnalyze: "Analyzing laboratory values",
    stepGenerate: "Generating medical summary",
    stepRestore: "Restoring protected information",
    // PDF export footer
    pdfFooter:
      "AI-generated summary. This document is not a medical diagnosis. Please consult your healthcare provider.",
    // Extracted Values dashboard
    verified: "Verified",
    notVerified: "Not Verified",
    detectedAs: "Detected as",
    unverifiedWarningTitle: "Unable to verify this value",
    unverifiedWarningBody:
      "The uploaded report may contain blurred text, cropped content, or poor scan quality. Please review the original report.",
    noRangeNote: "No reference range available for this test.",
    noRangePrinted: "No range printed",
    reference: "Reference",
    extractedSuccess: "Extracted Successfully",
    extractedPartial: "Some values need review",
    extractionQuality: "Extraction Quality",
    extractedDate: "Extraction date",
    normalValues: "Normal Values",
    needsReview: "Needs Review",
    filterAll: "All",
    filterNormal: "Normal",
    filterAbnormal: "Abnormal",
    toolbarDownloadPdf: "Download PDF",
    toolbarExportCsv: "Export CSV",
    toolbarCopyValues: "Copy Values",
    copied: "Copied",
    emptyExtractedTitle: "No laboratory values could be extracted",
    emptyExtractedDesc: "Try uploading a clearer, uncropped, higher-resolution scan of the report.",
    // Batch actions (multi-select)
    selectReport: "Select report",
    selectReports: "Select",
    exitSelectMode: "Done",
    selectedCount: "{count} selected",
    bulkSummarize: "Summarize all",
    bulkExtract: "Extract all",
    bulkSummarizing: "Summarizing {current} of {total}…",
    bulkExtracting: "Extracting {current} of {total}…",
    bulkDeleteConfirm:
      "Delete {count} selected reports? This permanently removes their files, AI summaries, and extracted values. This action cannot be undone.",
    // Version history
    historyLabel: "Version history",
    historyTitle: "Version history",
    historyVersion: "Version {n}",
    historyCurrent: "Current",
    historyEmpty: "No version history yet",
    historyEmptyDesc: "Past versions will appear here after you re-extract this report's values.",
    historyNoTests: "No structured values in this version.",
    // Share
    actShare: "Share",
    shareText:
      "Sharing a lab report from Swasthya Rakshak — AI-generated, please confirm with your doctor.",
    linkCopied: "Link copied",
    // Success toasts
    toastSaved: "Lab report saved",
    toastDeleted: "Lab report deleted",
    toastBulkDeleted: "{count} lab reports deleted",
    toastSummaryGenerated: "Summary generated",
    toastValuesExtracted: "Values extracted",
    toastBulkSummaryGenerated: "{count} summaries generated",
    toastBulkValuesExtracted: "{count} reports' values extracted",
    // Page tabs + Trends
    tabReports: "Reports",
    tabTrends: "Trends",
    trendsEmptyTitle: "Not enough data for trends yet",
    trendsEmptyDesc:
      "Once you have two or more reports with the same test (e.g. Hemoglobin, Cholesterol), they'll show up here as a chart over time.",
    trendsPointCount: "{count} reports"
  },

  labResult: {
    normal: "Normal",
    high: "High",
    low: "Low",
    unknown: "—"
  },

  medicalRecordsAi: {
    noRecordsYet: "No records yet",
    documentsStored: "documents stored",
    addRecord: "Add record",
    emptyTitle: "No medical records yet",
    emptyDesc:
      "Upload doctor notes, prescriptions, imaging reports, discharge summaries, and more — AI will read and classify them for you.",
    // Filters (Phase 7A)
    filters: "Filters",
    clearFilters: "Clear filters",
    sortLabel: "Sort by",
    sortNewest: "Newest first",
    sortVisitDate: "Visit date",
    sortRecentlyUpdated: "Recently updated",
    filterCategory: "Category",
    filterDocumentType: "Document type",
    filterPhysician: "Physician",
    filterPhysicianPlaceholder: "Search by physician name",
    filterFacility: "Facility / hospital",
    filterFacilityPlaceholder: "Search by facility name",
    filterDateRange: "Visit date range",
    filterFrom: "From",
    filterTo: "To",
    filterConfidence: "Extraction confidence",
    filterProcessed: "Processing status",
    filterProcessedYes: "Processed",
    filterProcessedNo: "Not yet processed",
    filterFamilyMember: "Family member",
    filterAny: "Any",
    noFilterMatchTitle: "No records match these filters",
    noFilterMatchDesc: "Try removing a filter or clearing them all to see more records.",
    noProcessedTitle: "No processed records yet",
    noProcessedDesc: "Process a record to see its AI summary and structured data here.",
    docGroup: {
      clinical: "Clinical",
      imaging: "Imaging",
      medication: "Medication",
      procedure: "Procedure",
      administrative: "Administrative",
      other: "Other"
    },
    // Record editing (Phase 7A §5)
    editTitle: "Edit record",
    fieldNotes: "Notes",
    // Saved views (Phase 7A §3)
    saveViewLabel: "Save this filter combination",
    saveViewPlaceholder: "e.g. Recent Imaging",
    // Search UX (Phase 7A §4)
    recentSearches: "Recent searches",
    suggestions: "Suggestions",
    // Bulk operations (Phase 7A §9)
    selectRecords: "Select",
    exitSelectMode: "Done",
    selectedCount: "{count} selected",
    bulkProcess: "Process",
    bulkExport: "Download files",
    bulkMove: "Move to…",
    bulkProcessing: "Processing {current} of {total}…",
    bulkDeleteConfirm: "Delete {count} selected records? This can't be undone.",
    // Add-record modal
    addTitle: "Add Medical Record",
    addSubtitle: "Upload a document — AI classifies it and fills in the details for you",
    uploadLabel: "Document file (PDF or photo)",
    uploadHint: "We'll read it, identify what kind of document it is, and fill in the details",
    fieldTitle: "Title",
    fieldDocumentType: "Document type",
    fieldFacility: "Facility / hospital",
    fieldPhysician: "Physician",
    fieldRecordDate: "Record date",
    forMember: "For family member (optional)",
    self: "— self —",
    save: "Save record",
    saving: "Saving…",
    uploading: "Uploading…",
    // Staged loader — classify
    stageReading: "Reading your document…",
    stageOcr: "Running OCR…",
    stageClassifying: "Identifying document type…",
    stageDone: "Done",
    // Metadata card
    metaTitle: "AI Classification",
    parsedOk: "Document classified successfully",
    parsedPartial: "Some fields could not be confidently identified",
    verify: "AI detected this value. Please verify.",
    typeUnrecognized: "Couldn't confidently identify the document type. Please select one.",
    // Card
    actViewOriginal: "View file",
    actExport: "Export",
    notClassified: "Not classified",
    // Processing (Phase 2)
    searchPlaceholder: "Search records…",
    noSearchResults: "No records match your search",
    process: "Process document",
    processing: "Processing…",
    regenerate: "Regenerate",
    reprocessing: "Reprocessing…",
    viewWorkspace: "View AI results",
    hideWorkspace: "Hide AI results",
    tabSummary: "Summary",
    tabSections: "Sections",
    summaryHeading: "Summary",
    generatedAt: "Generated",
    extractionQuality: "Extraction quality",
    disclaimer:
      "This is an AI-generated summary of your document, not a medical diagnosis. Always confirm details with your healthcare provider.",
    pdfFooter:
      "AI-generated summary. This document is not a medical diagnosis. Please consult your healthcare provider.",
    toolbarDownloadPdf: "Download PDF",
    emptySectionsTitle: "No sections could be extracted",
    emptySectionsDesc: "Try reprocessing, or upload a clearer scan of the document.",
    // Staged loader — process
    stageProcessReading: "Reading your document…",
    stageProcessExtract: "Extracting clinical sections…",
    stageProcessSummary: "Writing a plain-language summary…",
    stageProcessDone: "Done",
    // Medications (Phase 3)
    tabMedications: "Medications",
    medicationsCount: "medications identified",
    colMedication: "Medication",
    colStrength: "Strength",
    colDose: "Dose",
    colFrequency: "Frequency",
    colDuration: "Duration",
    colStatus: "Status",
    reviewSuggested: "Review suggested — please verify this medication.",
    medRoute: "Route",
    medQuantity: "Quantity",
    medRefills: "Refills",
    medDates: "Start → End",
    medPrn: "As needed (PRN)",
    medInstructions: "Instructions",
    medPrescriber: "Prescriber",
    prnYes: "Yes",
    prnNo: "No",
    medNoDetail: "No additional detail was extracted for this medication.",
    emptyMedsTitle: "No medications could be identified",
    emptyMedsDesc: "Try reprocessing, or upload a clearer scan of the document.",
    // Staged loader — medication process
    stageProcessMedsExtract: "Extracting medications…",
    stageProcessMedsSummary: "Writing a medication summary…",
    // Imaging (Phase 4)
    tabFindings: "Findings",
    imgModality: "Modality",
    imgRegions: "Region(s)",
    imgExam: "Exam",
    imgFindingsCount: "Findings",
    imgRecommendationsCount: "Recommendations",
    imgRadiologist: "Radiologist",
    imgMeasurements: "Measurements",
    imgImpression: "Impression",
    imgRecommendations: "Recommended follow-up",
    imgNormalFindings: "Normal findings",
    imgInPlainTerms: "In plain terms",
    imgSource: "From the report",
    colFinding: "Finding",
    colLocation: "Location",
    colSeverity: "Severity",
    colMeasurement: "Measurement",
    colConfidence: "Confidence",
    colAssociatedFinding: "Associated finding",
    emptyImgTitle: "No structured findings could be extracted",
    emptyImgDesc: "Try reprocessing, or upload a clearer scan of the report.",
    // Staged loader — imaging process
    stageProcessImgExtract: "Extracting radiology findings…",
    stageProcessImgSummary: "Writing an imaging summary…",
    // Procedure (Phase 5)
    tabProcedure: "Procedure",
    procName: "Procedure",
    procCategory: "Category",
    procSurgeon: "Surgeon",
    procOutcome: "Outcome",
    procIndication: "Indication",
    procAssistants: "Assistant(s)",
    procOperatingRoom: "Operating room",
    procAnesthesia: "Anesthesia",
    procBodySite: "Body site",
    procBloodLoss: "Estimated blood loss",
    procOverview: "Procedure overview",
    procTimeline: "Procedure timeline",
    procDevices: "Devices & implants",
    procSpecimens: "Specimens",
    procFindings: "Intraoperative findings",
    procComplications: "Complications",
    procRecovery: "Recovery & follow-up",
    colDevice: "Device",
    colManufacturer: "Manufacturer",
    colModel: "Model",
    colSpecimen: "Specimen",
    colCollectionSite: "Collection site",
    colPurpose: "Purpose",
    emptyProcTitle: "No procedure details could be extracted",
    emptyProcDesc: "Try reprocessing, or upload a clearer scan of the report.",
    // Staged loader — procedure process
    stageProcessProcExtract: "Extracting procedure details…",
    stageProcessProcSummary: "Writing a procedure summary…",
    // Immunization (Phase 6)
    tabImmunizations: "Vaccines",
    vaccinesCount: "vaccines recorded",
    colVaccine: "Vaccine",
    colDoseNumber: "Dose",
    colDate: "Date",
    colProvider: "Provider",
    colNextDue: "Next due",
    vacManufacturer: "Manufacturer",
    vacLotNumber: "Lot number",
    vacRoute: "Route",
    vacSite: "Site",
    vacNoDetail: "No additional detail was extracted for this vaccine.",
    emptyVaccinesTitle: "No vaccines could be identified",
    emptyVaccinesDesc: "Try reprocessing, or upload a clearer scan of the document.",
    stageProcessImmExtract: "Extracting vaccines…",
    stageProcessImmSummary: "Writing a vaccination summary…",
    // Billing / insurance (Phase 6)
    tabBilling: "Billing",
    billRecordType: "Record type",
    billProvider: "Provider",
    billService: "Service",
    billCharged: "Amount charged",
    billPaid: "Amount paid",
    billPayer: "Payer",
    billStatus: "Claim status",
    billDenialReason: "Reason for denial",
    billDetails: "Billing details",
    billCodes: "Billing codes",
    colCode: "Code",
    colCodeSystem: "System",
    colCodeDescription: "Description",
    emptyBillingTitle: "No billing details could be extracted",
    emptyBillingDesc: "Try reprocessing, or upload a clearer scan of the document.",
    stageProcessBillExtract: "Extracting billing details…",
    stageProcessBillSummary: "Writing a billing summary…"
  },

  claimStatus: {
    paid: "Paid",
    denied: "Denied",
    pending: "Pending",
    partial: "Partial",
    submitted: "Submitted",
    unknown: "Unknown"
  },

  procedureOutcome: {
    successful: "Successful",
    completed: "Completed",
    partial: "Partial",
    aborted: "Aborted",
    converted: "Converted",
    unknown: "Unknown"
  },

  medicationStatus: {
    current: "Current",
    completed: "Completed",
    discontinued: "Discontinued",
    prn: "As needed",
    unknown: "Unknown"
  },

  medicalRecordSections: {
    visit_reason: "Visit reason",
    chief_complaint: "Chief complaint",
    history_present_illness: "History of present illness",
    assessment: "Assessment",
    diagnosis: "Diagnosis",
    treatment_plan: "Treatment plan",
    follow_up: "Follow-up",
    medications: "Medications",
    referring_physician: "Referring physician",
    consulting_physician: "Consulting physician",
    consultation_reason: "Consultation reason",
    findings: "Findings",
    recommendations: "Recommendations",
    next_steps: "Next steps",
    past_medical_history: "Past medical history",
    surgical_history: "Surgical history",
    family_history: "Family history",
    social_history: "Social history",
    allergies: "Allergies",
    review_of_systems: "Review of systems",
    physical_examination: "Physical examination",
    plan: "Plan",
    // Phase 6 clinical extensions
    primary_diagnosis: "Primary diagnosis",
    secondary_diagnoses: "Secondary diagnoses",
    severity: "Severity",
    status: "Status",
    clinical_notes: "Clinical notes",
    supporting_evidence: "Supporting evidence",
    goals: "Goals",
    procedures: "Procedures",
    lifestyle_recommendations: "Lifestyle recommendations",
    monitoring: "Monitoring",
    follow_up_schedule: "Follow-up schedule",
    admission_reason: "Reason for admission",
    hospital_course: "Hospital course",
    final_diagnosis: "Final diagnosis",
    discharge_medications: "Discharge medications",
    discharge_instructions: "Discharge instructions",
    target_specialty: "Referred to (specialty)",
    referral_reason: "Reason for referral",
    clinical_background: "Clinical background",
    requested_evaluation: "Requested evaluation",
    observations: "Observations",
    care_plan: "Care plan"
  },

  medicalRecordTypes: {
    doctor_note: "Doctor Note",
    clinician_note: "Clinician Note",
    consultation_note: "Consultation Note",
    history_physical: "History & Physical Examination",
    diagnosis: "Diagnosis",
    treatment_plan: "Treatment Plan",
    xray_report: "X-Ray Report",
    mri_report: "MRI Report",
    ct_report: "CT Report",
    ultrasound_report: "Ultrasound Report",
    prescription: "Prescription",
    medication_list: "Medication List",
    procedure_note: "Procedure Note",
    surgery_report: "Surgery Report",
    discharge_summary: "Discharge Summary",
    referral_note: "Referral Note",
    immunization_record: "Immunization Record",
    vaccination_record: "Vaccination Record",
    billing_record: "Billing Record",
    insurance_claim: "Insurance Claim Record",
    other: "Other"
  },

  deleteLabReport: {
    title: "Delete lab report?",
    body: "Are you sure you want to delete this lab report?",
    warning:
      "This permanently removes the file, AI summary, and all extracted values. This action cannot be undone.",
    confirm: "Yes, delete"
  },

  aiConsent: {
    title: "Allow AI to help read this report?",
    body: "We use AI to create a simple, plain-language summary of your report. Personal details like your name, phone number, and ID numbers are removed before anything is sent for processing. AI summaries are not a substitute for your doctor. You can turn this off anytime in your profile.",
    allow: "Allow & continue",
    notNow: "Not now",
    sectionTitle: "AI Processing",
    sectionDesc:
      "Let AI create plain-language summaries of your reports. Identifiers are removed before processing.",
    enabled: "Enabled",
    disabled: "Off",
    enable: "Enable",
    revoke: "Turn off"
  },

  doctor: {
    dashboard: {
      welcome: "Welcome",
      pendingRequests: "Pending Requests",
      prescriptionsWritten: "Prescriptions Written",
      addPatient: "Add Patient",
      newPrescription: "New Prescription"
    },
    patients: {
      addByPhone: "Add patient by phone",
      addDescription:
        "Send a connection request. The patient must approve before you can prescribe to them.",
      sendRequest: "Send request",
      emptyTitle: "No patients yet",
      emptyDescription: "Add a patient by their mobile number to start a connection.",
      status: {
        pending: "Pending",
        accepted: "Connected",
        rejected: "Rejected"
      }
    },
    prescriptions: {
      title: "Prescriptions",
      written: "written",
      new: "New prescription",
      selectPatient: "select a patient",
      patient: "Patient",
      hospitalName: "Hospital / clinic name",
      visitDate: "Visit date",
      medicines: "Medicines",
      diagnosis: "Diagnosis",
      noPatientsTitle: "Connect with a patient first",
      noPatientsDescription:
        "You need an accepted patient connection before you can write a prescription.",
      emptyTitle: "No prescriptions written yet",
      todaysQueue: "Today's queue",
      addToToday: "Add to today",
      searchQueue: "Search by name or patient number",
      searchPatients: "Search patients by name or phone",
      token: "Patient",
      prescribe: "Prescribe",
      noQueueTitle: "No patients in today's queue",
      noQueueDescription: "Add a connected patient to today's queue to start prescribing.",
      selectFromQueue: "Select a patient from today's queue to write a prescription.",
      patientList: "Patient List",
      addPatient: "Add patient",
      addToList: "Add to list",
      date: "Date",
      newPrescription: "New prescription",
      editPrescription: "Edit prescription"
    },
    profile: {
      heading: "Professional Details",
      specialization: "Specialization",
      licenseNumber: "Medical license number",
      clinicName: "Clinic / hospital name"
    }
  },

  medicine: {
    name: "Medicine name",
    quantity: "Quantity",
    quantityPlaceholder: "e.g. 10",
    addMedicine: "Add medicine",
    remove: "Remove",
    beforeFood: "Before food",
    afterFood: "After food",
    perDay: "{n}/day",
    dayCourse: "{n}-day course",
    slots: {
      morning: "Morning",
      afternoon: "Afternoon",
      evening: "Evening",
      night: "Night"
    }
  },

  patient: {
    myDoctors: {
      connected: "connected",
      pending: "pending",
      emptyTitle: "No doctors yet",
      emptyDescription: "When a doctor sends you a connection request, it will show up here.",
      requestsHeading: "Pending Requests",
      connectedHeading: "Connected Doctors",
      accept: "Accept",
      reject: "Reject",
      connectedBadge: "Connected"
    },
    prescriptions: {
      prescribedBy: "Prescribed by"
    }
  },

  datePicker: {
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ],
    weekdaysShort: ["S", "M", "T", "W", "T", "F", "S"],
    today: "Today",
    clear: "Clear",
    selectDate: "Select date",
    prevMonth: "Previous month",
    nextMonth: "Next month",
    selectYear: "Select year",
    selectTime: "Select time"
  },

  subscription: {
    title: "Plans & Billing",
    subtitle: "Choose the plan that fits your family's needs.",
    currentPlan: "Current plan",
    renewsOn: "Renews on {date}",
    cancelAtPeriodEnd: "Your plan will not renew after {date}",
    cancel: "Cancel plan",
    cancelConfirm: "Your plan stays active until the current period ends. Continue?",
    subscribe: "Subscribe",
    switchPlan: "Switch to this plan",
    manage: "Manage",
    perMonth: "/month",
    perMemberMonth: "/member/month",
    mostPopular: "Most popular",
    checkoutSuccess: "Your plan is now active.",
    checkoutFailed: "We couldn't confirm the payment. Please try again.",
    mockNotice: "Test mode — no real payment is charged.",
    plans: {
      free: {
        name: "Free",
        tagline: "Free for everyone",
        cta: "Start your health journey for free."
      },
      individual: {
        name: "Individual Premium",
        tagline: "For individuals. Advanced care for you.",
        cta: "For individuals who want more insights."
      },
      family: {
        name: "Family Premium",
        tagline: "One plan for the whole family.",
        cta: "One Family. One Health Dashboard."
      }
    },
    features: {
      health_records: "Health Records",
      reports_prescriptions: "Reports & Prescriptions",
      timeline_basic: "Health Timeline",
      basic_insights: "Basic Health Insights",
      reminders_basic: "Reminders & Alerts",
      secure_storage: "Secure Data Storage",
      ai_report_explanation: "AI Report Explanations",
      health_trends: "Health Trends & Insights",
      timeline_advanced: "Advanced Health Timeline",
      smart_reminders: "Smart Reminders",
      priority_support: "Priority Support",
      advanced_analytics: "Advanced Analytics",
      family_dashboard: "Family Dashboard",
      manage_family_members: "Add & Manage Family Members",
      child_health: "Child Health Management",
      elderly_care: "Elderly Care Management",
      shared_records: "Shared Health Records",
      family_health_score: "Family Health Score",
      caregiver_access: "Caregiver Access",
      emergency_contacts: "Emergency Contact Network",
      family_analytics: "Family Health Analytics"
    },
    gate: {
      title: "This is a premium feature",
      description: "Upgrade to {plan} to unlock this.",
      cta: "View plans"
    }
  },

  admin: {
    title: "Admin",
    subtitle: "Operational control — patient health data is never shown here.",
    phiNotice:
      'Health records, lab reports and prescriptions are intentionally not accessible from the admin panel. Use "Test as user" for a redacted, audited preview.',
    nav: {
      users: "Users",
      subscriptions: "Subscriptions",
      payments: "Payments",
      plans: "Plans",
      audit: "Audit Log",
      metrics: "Metrics",
      medicines: "Medicines"
    },
    users: {
      search: "Search by name or phone",
      role: "Role",
      status: "Status",
      suspended: "Suspended",
      active: "Active",
      suspend: "Suspend",
      reactivate: "Reactivate",
      impersonate: "Test as user",
      impersonateNotice: "Redacted preview — no plaintext health data will be shown.",
      counts:
        "{records} records · {labs} labs · {prescriptions} prescriptions · {family} family members"
    },
    metrics: {
      totalUsers: "Total users",
      signups30d: "Signups (30d)",
      mrr: "Monthly recurring revenue",
      activeByPlan: "Active subscriptions by plan"
    },
    audit: {
      action: "Action",
      actor: "Actor",
      subject: "Subject",
      when: "When"
    },
    medicines: {
      title: "Medicine Catalog",
      subtitle: "Shared, non-PHI knowledge base used to ground AI medicine answers.",
      search: "Search by name",
      addBtn: "Add medicine",
      addTitle: "Add medicine",
      editTitle: "Edit medicine",
      source: "Source",
      allSources: "All sources",
      sourceSeed: "Seed",
      sourceAdmin: "Admin",
      sourceStub: "Stub",
      verified: "Verified",
      unverified: "Unverified",
      verify: "Verify",
      unverify: "Mark unverified",
      embed: "Generate embedding",
      embedDisabled: "Embeddings provider is not configured.",
      embedded: "Embedding generated.",
      embeddedNone: "No embedding provider configured.",
      fieldName: "Name",
      fieldGenericName: "Generic name",
      fieldBrandNames: "Brand names",
      fieldDosageForms: "Dosage forms",
      fieldCommonUsage: "Common usage",
      fieldSideEffects: "Side effects",
      fieldInteractions: "Interactions",
      fieldWarnings: "Warnings",
      fieldContraindications: "Contraindications",
      fieldNotes: "Notes",
      listHint: "Separate multiple entries with commas",
      markVerified: "Verified",
      deleteConfirm: "Delete this medicine from the catalog?",
      emptyTitle: "No medicines found",
      emptyDescription: "Try a different search, or add a medicine to the catalog.",
      stubNotice: "Auto-created from a prescription — review and verify the details.",
      prev: "Previous",
      next: "Next",
      pageOf: "Page {current} of {total}"
    }
  }
} as const;

/** Recursively widen the literal types of `en` to `string` so `hi` only has to match the shape. */
type Widen<T> = T extends string ? string : { [K in keyof T]: Widen<T[K]> };

export type Translation = Widen<typeof en>;
