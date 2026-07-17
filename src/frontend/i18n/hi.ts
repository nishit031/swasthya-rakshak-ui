import type { Translation } from "./en";

/** Hindi copy. Mirrors the shape of `en`; any missing key falls back to English. */
export const hi: Translation = {
  brand: "स्वास्थ्य रक्षक",

  nav: {
    home: "होम",
    features: "विशेषताएँ",
    about: "हमारे बारे में",
    login: "लॉग इन",
    register: "शुरू करें",
    language: "EN"
  },

  hero: {
    tagline: "आपका निजी स्वास्थ्य साथी",
    titleLead: "आपके परिवार का स्वास्थ्य,",
    titleHighlight: "एक ही जगह सुरक्षित",
    description:
      "आपके और आपके परिवार के हर पर्चे, लैब रिपोर्ट और मेडिकल रिकॉर्ड को एक शांत, निजी जगह पर रखें। आसान रिमाइंडर, स्पष्ट स्वास्थ्य टाइमलाइन और सरल भाषा में सारांश।",
    ctaPrimary: "मुफ़्त शुरू करें",
    ctaSecondary: "लॉग इन",
    trustedBy: "परिवार हम पर अपने रिकॉर्ड के लिए भरोसा करते हैं",
    floating: {
      records: { title: "सभी रिकॉर्ड एक जगह", description: "पर्चे, रिपोर्ट और विज़िट एक साथ" },
      reminders: { title: "कोई खुराक न छूटे", description: "दवा और अपॉइंटमेंट के सौम्य रिमाइंडर" },
      private: { title: "निजी और सुरक्षित", description: "आपका डेटा हमेशा आपका रहता है" }
    }
  },

  features: {
    heading: "आपके परिवार के स्वास्थ्य की हर ज़रूरत",
    subheading: "मरीज़ों के लिए बनाया गया — सरल, शांत और निजी।",
    items: {
      records: {
        title: "मेडिकल रिकॉर्ड",
        description: "हर परिवार के सदस्य की विज़िट, दस्तावेज़ और इतिहास व्यवस्थित रखें।"
      },
      prescriptions: {
        title: "पर्चे",
        description: "दवाएँ, डॉक्टर और निदान ट्रैक करें ताकि कुछ भी न खोए।"
      },
      labReports: {
        title: "लैब रिपोर्ट",
        description: "टेस्ट के नतीजे एक जगह रखें और उन्हें सरल भाषा में समझें।"
      },
      reminders: {
        title: "रिमाइंडर",
        description: "दवाओं, टेस्ट, अपॉइंटमेंट और टीकाकरण के समय पर रिमाइंडर।"
      },
      family: {
        title: "परिवार के सदस्य",
        description: "माता-पिता, बच्चों और आश्रितों के रिकॉर्ड एक साथ संभालें।"
      },
      ai: {
        title: "सरल सारांश",
        description: "सरल भाषा में सारांश जो आपकी रिपोर्ट समझने में मदद करते हैं।"
      }
    },
    learnMore: "और जानें"
  },

  stats: {
    heading: "पूरे भारत के परिवारों का भरोसा",
    items: {
      families: { label: "परिवार", description: "हमारे साथ स्वास्थ्य संभाल रहे हैं" },
      records: { label: "रिकॉर्ड सुरक्षित", description: "सुरक्षित और व्यवस्थित" },
      reminders: { label: "रिमाइंडर भेजे गए", description: "ताकि कोई खुराक न छूटे" },
      uptime: { label: "अपटाइम", description: "विश्वसनीय, चौबीसों घंटे" }
    }
  },

  testimonials: {
    heading: "मरीज़ों और देखभाल करने वालों का पसंदीदा",
    items: {
      one: {
        quote: "अब मेरे पिता की सभी रिपोर्ट एक जगह हैं। हर विज़िट से पहले फ़ाइलें ढूँढ़ना खत्म।",
        name: "प्रिया शर्मा",
        role: "देखभालकर्ता, पुणे"
      },
      two: {
        quote:
          "दवा के रिमाइंडर मेरी माँ के लिए वरदान हैं। सरल और सौम्य, बिल्कुल जैसा हमें चाहिए था।",
        name: "राहुल वर्मा",
        role: "मरीज़, दिल्ली"
      },
      three: {
        quote:
          "सारांश मेरी लैब रिपोर्ट को ऐसी भाषा में समझाते हैं जो मैं वाकई समझता हूँ। शांत लगता है, क्लिनिकल नहीं।",
        name: "अंजली नायर",
        role: "मरीज़, कोच्चि"
      }
    }
  },

  cta: {
    heading: "आज ही अपने परिवार के स्वास्थ्य की कमान संभालें",
    description: "मुफ़्त शुरुआत। आपके रिकॉर्ड, रिमाइंडर और टाइमलाइन — एक शांत, निजी जगह पर।",
    primary: "अपना मुफ़्त खाता बनाएँ",
    secondary: "लॉग इन"
  },

  footer: {
    tagline: "मरीज़-पहले डिजिटल स्वास्थ्य साथी।",
    product: "उत्पाद",
    company: "कंपनी",
    contact: "संपर्क",
    rights: "सर्वाधिकार सुरक्षित।",
    disclaimer: "स्वास्थ्य रक्षक एक निजी स्वास्थ्य रिकॉर्ड साथी है और चिकित्सा सलाह नहीं देता।"
  },

  auth: {
    login: {
      title: "वापसी पर स्वागत है",
      subtitle: "अपने स्वास्थ्य साथी में लॉग इन करें",
      phone: "मोबाइल नंबर",
      password: "पासवर्ड",
      withPassword: "पासवर्ड से",
      withOtp: "OTP से",
      sendOtp: "OTP भेजें",
      otp: "वन-टाइम पासवर्ड",
      submit: "लॉग इन",
      noAccount: "नए हैं?",
      registerLink: "खाता बनाएँ",
      doctorPrompt: "क्या आप डॉक्टर हैं?",
      doctorLink: "डॉक्टर के रूप में पंजीकरण करें"
    },
    register: {
      title: "अपना खाता बनाएँ",
      subtitle: "अपने परिवार का स्वास्थ्य एक जगह रखना शुरू करें",
      fullName: "पूरा नाम",
      phone: "मोबाइल नंबर",
      password: "पासवर्ड",
      gender: "लिंग",
      genderPlaceholder: "लिंग चुनें",
      genderOptions: { male: "पुरुष", female: "महिला", other: "अन्य" },
      submit: "आगे बढ़ें",
      verifyTitle: "अपना नंबर सत्यापित करें",
      verifySubtitle: "आपके मोबाइल पर भेजा गया कोड दर्ज करें",
      otp: "वन-टाइम पासवर्ड",
      verify: "सत्यापित करें और आगे बढ़ें",
      haveAccount: "पहले से खाता है?",
      loginLink: "लॉग इन"
    },
    doctorRegister: {
      title: "अपना डॉक्टर खाता बनाएँ",
      subtitle: "अपने मरीज़ों से जुड़ें और ऐप में ही पर्चे लिखें",
      fullName: "पूरा नाम",
      specialization: "विशेषज्ञता",
      licenseNumber: "मेडिकल लाइसेंस नंबर",
      clinicName: "क्लिनिक / हॉस्पिटल का नाम",
      patientPrompt: "मरीज़ के रूप में पंजीकरण कर रहे हैं?",
      patientLink: "मरीज़ साइन अप पर जाएँ"
    },
    step: "चरण {current} / {total}"
  },

  dashboard: {
    greetingMorning: "सुप्रभात",
    greetingAfternoon: "नमस्कार",
    greetingEvening: "शुभ संध्या",
    upcoming: "आगामी",
    healthRecords: "स्वास्थ्य रिकॉर्ड",
    quickActions: "त्वरित क्रियाएँ",
    upcomingReminders: "आगामी रिमाइंडर",
    recentActivity: "हाल की गतिविधि",
    viewAll: "सभी देखें",
    fullTimeline: "पूरी टाइमलाइन",
    noReminders: "कोई आगामी रिमाइंडर नहीं।",
    setReminder: "रिमाइंडर सेट करें",
    noActivity: "अभी कोई गतिविधि नहीं।",
    activityHint: "रिकॉर्ड और पर्चे जोड़ने पर घटनाएँ यहाँ दिखेंगी।",
    today: "आज"
  },

  reminders: {
    notification: {
      dueTitle: "रिमाइंडर: {title}",
      dueBody: "{type} · समय: {time}",
      doseBody: "{slot} की खुराक, {food} · समय: {time}",
      instructionsNote: "टिप्पणी: {diagnosis}",
      slot: { morning: "सुबह", afternoon: "दोपहर", evening: "शाम", night: "रात" },
      food: { before: "भोजन से पहले", after: "भोजन के बाद" },
      markDone: "पूर्ण करें",
      taken: "ले लिया",
      dismiss: "खारिज करें"
    },
    tabs: {
      active: "सक्रिय",
      upcoming: "आगामी",
      completed: "पूर्ण"
    },
    acknowledge: "लिया गया चिह्नित करें",
    activeCount: "{n} सक्रिय",
    allCaughtUp: "सब कुछ अद्यतित है",
    pagination: {
      pageOf: "पृष्ठ {page} / {total}",
      previous: "पिछला",
      next: "अगला"
    },
    empty: {
      active: {
        title: "कोई सक्रिय रिमाइंडर नहीं",
        description: "आप पूरी तरह अद्यतित हैं — अभी कुछ भी लंबित नहीं है।"
      },
      upcoming: {
        title: "कोई आगामी रिमाइंडर नहीं",
        description:
          "दवा, अपॉइंटमेंट, जांच और टीकाकरण के लिए रिमाइंडर सेट करें ताकि आप कभी न चूकें।"
      },
      completed: {
        title: "कोई पूर्ण रिमाइंडर नहीं",
        description: "आपके पूर्ण किए गए रिमाइंडर यहां दिखाई देंगे।"
      }
    }
  },

  nav2: {
    dashboard: "डैशबोर्ड",
    family: "परिवार",
    medicalRecords: "मेडिकल रिकॉर्ड",
    prescriptions: "पर्चे",
    labReports: "लैब रिपोर्ट",
    reminders: "रिमाइंडर",
    timeline: "टाइमलाइन",
    profile: "प्रोफ़ाइल",
    add: "जोड़ें",
    signOut: "साइन आउट",
    viewProfile: "प्रोफ़ाइल देखें",
    healthTimeline: "स्वास्थ्य टाइमलाइन",
    myDoctors: "मेरे डॉक्टर",
    myPatients: "मेरे मरीज़",
    patientIntel: "स्वास्थ्य प्रोफ़ाइल",
    companion: "एआई सहायक",
    billing: "योजनाएँ और बिलिंग"
  },

  companion: {
    title: "एआई सहायक",
    subtitle: "अपनी दवाओं, रिपोर्ट और रिकॉर्ड के बारे में पूछें — केवल आपके अपने डेटा पर आधारित।",
    familyMemberSelf: "स्वयं",
    newChat: "नई बातचीत",
    noSessions: "अभी तक कोई बातचीत नहीं।",
    untitledChat: "नई बातचीत",
    inputPlaceholder: "किसी दवा, रिपोर्ट या रिमाइंडर के बारे में पूछें…",
    send: "भेजें",
    generating: "जवाब तैयार किया जा रहा है…",
    disclaimer:
      "यह सहायक आपके रिकॉर्ड में पहले से मौजूद जानकारी का सारांश देता है। यह किसी स्थिति का निदान नहीं करता और आपके डॉक्टर की सलाह का विकल्प नहीं है।",
    empty: {
      title: "अपने एआई सहायक से पूछें",
      description:
        "कोशिश करें “मैं फ़िलहाल कौन सी दवाएँ ले रहा/रही हूँ?” या “मेरी पिछली लैब रिपोर्ट समझाएँ।”"
    }
  },

  patientIntel: {
    title: "स्वास्थ्य प्रोफ़ाइल",
    subtitle: "{n} रिकॉर्ड · {unprocessed} प्रोसेसिंग के लिए लंबित",
    familyMemberAny: "स्वयं",
    provenance: { fact: "तथ्य", pattern: "पैटर्न" },
    empty: {
      title: "आपकी स्वास्थ्य प्रोफ़ाइल अभी खाली है",
      description:
        "कुछ मेडिकल रिकॉर्ड प्रोसेस करें, फिर यह पेज आपकी स्थितियों, दवाओं और देखभाल इतिहास का एक दीर्घकालिक दृश्य बनाएगा।"
    },
    stats: {
      records: "कुल रिकॉर्ड",
      conditions: "सक्रिय स्थितियाँ",
      medications: "ट्रैक की गई दवाएँ",
      followUps: "लंबित फॉलो-अप"
    },
    sections: {
      overview: "स्वास्थ्य अवलोकन",
      timeline: "स्वास्थ्य टाइमलाइन",
      conditions: "सक्रिय स्थितियाँ",
      medications: "दवा इतिहास",
      imaging: "इमेजिंग इतिहास",
      procedures: "प्रक्रिया इतिहास",
      vaccinations: "टीकाकरण इतिहास",
      recentRecords: "हाल के रिकॉर्ड",
      followUps: "लंबित फॉलो-अप",
      insights: "मरीज़ की जानकारियाँ",
      relationships: "रिकॉर्ड संबंध",
      providers: "डॉक्टर",
      facilities: "सुविधाएँ"
    },
    conditions: {
      firstMentioned: "पहली बार उल्लेख",
      lastMentioned: "अंतिम बार उल्लेख",
      mentionedIn: "{n} रिकॉर्ड में उल्लेखित",
      relatedMedications: "संबंधित दवाएँ"
    },
    medications: {
      current: "वर्तमान",
      empty: "अभी तक कोई दवा इतिहास नहीं है।"
    },
    medicationStatus: {
      started: "शुरू की गई",
      changed: "बदली गई",
      dose_modified: "खुराक बदली गई",
      stopped: "बंद की गई",
      current: "वर्तमान",
      discontinued: "बंद कर दी गई",
      unknown: "अज्ञात"
    },
    imaging: {
      empty: "अभी तक कोई इमेजिंग अध्ययन नहीं है।",
      studyCount: "{n} अध्ययन"
    },
    procedures: {
      empty: "अभी तक कोई प्रक्रिया दर्ज नहीं है।"
    },
    vaccinations: {
      empty: "अभी तक कोई टीकाकरण रिकॉर्ड नहीं है।",
      upcoming: "आगामी: {note}, {date} को",
      doseCount: "{n} खुराकें दर्ज"
    },
    followUps: {
      empty: "कोई लंबित फॉलो-अप नहीं — आप पूरी तरह अप टू डेट हैं।"
    },
    insights: {
      empty: "कुछ प्रोसेस किए गए रिकॉर्ड होने पर यहाँ जानकारियाँ दिखेंगी।"
    },
    relationships: {
      empty: "अभी तक कोई जुड़े हुए रिकॉर्ड नहीं हैं।",
      linkCount: "{n} जुड़े रिकॉर्ड जोड़े",
      reason: "कारण: {reason}"
    },
    episodes: {
      eventCount: "{n} घटनाएँ"
    }
  },

  common: {
    loading: "लोड हो रहा है…",
    error: "कुछ गड़बड़ हो गई। कृपया पुनः प्रयास करें।",
    save: "सहेजें",
    cancel: "रद्द करें",
    delete: "हटाएँ",
    edit: "संपादित करें",
    add: "जोड़ें",
    showMore: "और दिखाएं",
    showLess: "कम दिखाएं"
  },

  labReportsAi: {
    summarize: "सारांश बनाएँ",
    extract: "डेटा निकालें",
    summarizing: "पढ़ रहे हैं…",
    extracting: "निकाल रहे हैं…",
    summaryTitle: "सरल सारांश",
    extractedTitle: "निकाले गए मान",
    aiNote: "AI द्वारा तैयार — हमेशा अपने डॉक्टर से पुष्टि करें।",
    consentNeeded: "इसका उपयोग करने के लिए अपनी प्रोफ़ाइल में AI प्रोसेसिंग चालू करें।",
    summaryReady: "सारांश तैयार",
    notAnalyzed: "विश्लेषण नहीं हुआ",
    // Add-report modal
    addTitle: "लैब रिपोर्ट जोड़ें",
    editTitle: "लैब रिपोर्ट संपादित करें",
    addSubtitle: "रिपोर्ट अपलोड करें — AI आपके लिए विवरण भर देगा",
    uploadLabel: "रिपोर्ट फ़ाइल (PDF या फ़ोटो)",
    uploadHint: "हम इसे पढ़कर विवरण अपने आप भर देंगे",
    dropHint: "अपनी फ़ाइल यहाँ छोड़ें",
    fieldTestName: "जाँच का नाम",
    fieldLabName: "लैब का नाम",
    fieldReportDate: "रिपोर्ट की तारीख़",
    forMember: "परिवार के सदस्य के लिए (वैकल्पिक)",
    self: "— स्वयं —",
    save: "रिपोर्ट सहेजें",
    saving: "सहेज रहे हैं…",
    uploading: "अपलोड हो रहा है…",
    // Staged loader — analyze
    stageReading: "आपकी रिपोर्ट पढ़ रहे हैं…",
    stageOcr: "OCR चल रहा है…",
    stageExtracting: "रिपोर्ट की जानकारी निकाल रहे हैं…",
    stageDone: "पूर्ण",
    // Metadata card
    metaTitle: "AI निष्कर्षण",
    parsedOk: "रिपोर्ट सफलतापूर्वक पढ़ी गई",
    parsedPartial: "कुछ फ़ील्ड पूरी तरह नहीं पढ़ी जा सकीं",
    verify: "AI ने यह मान पहचाना है। कृपया जाँच लें।",
    // Confidence
    confidence: "विश्वास",
    confHigh: "उच्च विश्वास",
    confReview: "जाँच सुझाई गई",
    confLow: "कम विश्वास",
    // Summary sections
    secOverall: "समग्र स्थिति",
    secKeyFindings: "मुख्य निष्कर्ष",
    secAbnormal: "असामान्य परिणाम",
    secNormal: "सामान्य परिणाम",
    secFollowUp: "आगे की सलाह",
    disclaimer:
      "यह AI द्वारा तैयार सारांश है, कोई चिकित्सीय निदान नहीं। परिणामों की पुष्टि हमेशा अपने डॉक्टर से करें।",
    generatedAt: "तैयार किया",
    aiConfidence: "AI विश्वास",
    resultNormal: "सामान्य",
    resultReview: "जाँच सुझाई गई",
    noFindings: "कोई असामान्य परिणाम नहीं मिला।",
    // Staged loader — summary
    stageGenerating: "AI सारांश बना रहे हैं…",
    stageAlmost: "लगभग पूरा…",
    // Summary action bar
    actViewOriginal: "मूल देखें",
    thumbnailAlt: "लैब रिपोर्ट पूर्वावलोकन",
    thumbnailAltNamed: "{name} का पूर्वावलोकन",
    thumbnailViewLabel: "रिपोर्ट फ़ाइल देखें",
    viewerOpenExternal: "ब्राउज़र में खोलें",
    viewerZoomIn: "ज़ूम इन",
    viewerZoomOut: "ज़ूम आउट",
    viewerZoomReset: "ज़ूम रीसेट",
    viewerSideSummary: "AI सारांश",
    viewerSideValues: "प्रयोगशाला मान",
    viewerUnsupportedType: "यह फ़ाइल प्रकार ऐप में पूर्वावलोकन नहीं किया जा सकता।",
    actDownloadReport: "रिपोर्ट डाउनलोड करें",
    actDownloadSummary: "सारांश डाउनलोड करें",
    actRegenerate: "फिर से बनाएँ",
    actViewExtracted: "निकाला गया डेटा देखें",
    // Smart errors
    errRead: "हम यह रिपोर्ट अपने आप नहीं पढ़ सके। कृपया विवरण स्वयं भरें।",
    errBlurry: "अपलोड की गई छवि धुंधली लगती है। कृपया अधिक स्पष्ट स्कैन अपलोड करें।",
    // Collapsible summary / tabbed workspace
    viewSummary: "AI सारांश देखें",
    hideSummary: "AI सारांश छिपाएँ",
    viewDetails: "विवरण देखें",
    hideDetails: "विवरण छिपाएँ",
    tabSummary: "AI सारांश",
    tabValues: "प्रयोगशाला मान",
    colTest: "जाँच",
    colResult: "परिणाम",
    colRange: "संदर्भ सीमा",
    colStatus: "स्थिति",
    searchValues: "जाँच खोजें…",
    // Summary generation progress
    genTitle: "AI सारांश बना रहे हैं…",
    stepOcr: "OCR टेक्स्ट पढ़ रहे हैं",
    stepPii: "व्यक्तिगत जानकारी हटा रहे हैं",
    stepAnalyze: "प्रयोगशाला मान विश्लेषण कर रहे हैं",
    stepGenerate: "मेडिकल सारांश बना रहे हैं",
    stepRestore: "सुरक्षित जानकारी पुनर्स्थापित कर रहे हैं",
    // PDF export footer
    pdfFooter:
      "AI द्वारा तैयार सारांश। यह दस्तावेज़ चिकित्सीय निदान नहीं है। कृपया अपने डॉक्टर से परामर्श करें।",
    // Extracted Values dashboard
    verified: "सत्यापित",
    notVerified: "असत्यापित",
    detectedAs: "पहचाना गया",
    unverifiedWarningTitle: "इस मान की पुष्टि नहीं हो सकी",
    unverifiedWarningBody:
      "अपलोड की गई रिपोर्ट में धुंधला टेक्स्ट, कटी हुई सामग्री, या खराब स्कैन गुणवत्ता हो सकती है। कृपया मूल रिपोर्ट देखें।",
    noRangeNote: "इस जाँच के लिए कोई संदर्भ सीमा उपलब्ध नहीं है।",
    noRangePrinted: "सीमा मुद्रित नहीं",
    reference: "संदर्भ",
    extractedSuccess: "सफलतापूर्वक निकाला गया",
    extractedPartial: "कुछ मानों की समीक्षा आवश्यक है",
    extractionQuality: "निष्कर्षण गुणवत्ता",
    extractedDate: "निष्कर्षण तिथि",
    normalValues: "सामान्य मान",
    needsReview: "समीक्षा आवश्यक",
    filterAll: "सभी",
    filterNormal: "सामान्य",
    filterAbnormal: "असामान्य",
    toolbarDownloadPdf: "PDF डाउनलोड करें",
    toolbarExportCsv: "CSV निर्यात करें",
    toolbarCopyValues: "मान कॉपी करें",
    copied: "कॉपी हो गया",
    emptyExtractedTitle: "कोई प्रयोगशाला मान नहीं निकाला जा सका",
    emptyExtractedDesc:
      "कृपया अधिक स्पष्ट, बिना कटी हुई, उच्च-रिज़ॉल्यूशन स्कैन अपलोड करने का प्रयास करें।",
    // बैच क्रियाएँ (मल्टी-सेलेक्ट)
    selectReport: "रिपोर्ट चुनें",
    selectReports: "चुनें",
    exitSelectMode: "हो गया",
    selectedCount: "{count} चयनित",
    bulkSummarize: "सभी का सारांश बनाएँ",
    bulkExtract: "सभी से डेटा निकालें",
    bulkSummarizing: "{total} में से {current} का सारांश बनाया जा रहा है…",
    bulkExtracting: "{total} में से {current} से डेटा निकाला जा रहा है…",
    bulkDeleteConfirm:
      "{count} चयनित रिपोर्ट हटाएं? इससे उनकी फ़ाइलें, AI सारांश और निकाले गए मान स्थायी रूप से हट जाएंगे। इस कार्रवाई को पूर्ववत नहीं किया जा सकता।",
    // वर्शन इतिहास
    historyLabel: "वर्शन इतिहास",
    historyTitle: "वर्शन इतिहास",
    historyVersion: "वर्शन {n}",
    historyCurrent: "वर्तमान",
    historyEmpty: "अभी तक कोई वर्शन इतिहास नहीं है",
    historyEmptyDesc: "इस रिपोर्ट के मान फिर से निकालने के बाद पिछले वर्शन यहाँ दिखाई देंगे।",
    historyNoTests: "इस वर्शन में कोई संरचित मान नहीं है।",
    // शेयर करें
    actShare: "शेयर करें",
    shareText:
      "Swasthya Rakshak से एक लैब रिपोर्ट साझा की जा रही है — यह AI-जनित है, कृपया अपने डॉक्टर से पुष्टि करें।",
    linkCopied: "लिंक कॉपी हो गया",
    // सफलता टोस्ट
    toastSaved: "लैब रिपोर्ट सहेजी गई",
    toastDeleted: "लैब रिपोर्ट हटाई गई",
    toastBulkDeleted: "{count} लैब रिपोर्ट हटाई गईं",
    toastSummaryGenerated: "सारांश तैयार हो गया",
    toastValuesExtracted: "मान निकाले गए",
    toastBulkSummaryGenerated: "{count} सारांश तैयार हो गए",
    toastBulkValuesExtracted: "{count} रिपोर्ट के मान निकाले गए",
    // पेज टैब + रुझान
    tabReports: "रिपोर्ट",
    tabTrends: "रुझान",
    trendsEmptyTitle: "अभी रुझान के लिए पर्याप्त डेटा नहीं है",
    trendsEmptyDesc:
      "जब आपके पास एक ही जाँच (जैसे हीमोग्लोबिन, कोलेस्ट्रॉल) की दो या अधिक रिपोर्ट होंगी, तो वे यहाँ समय के साथ एक चार्ट के रूप में दिखाई देंगी।",
    trendsPointCount: "{count} रिपोर्ट"
  },

  labResult: {
    normal: "सामान्य",
    high: "उच्च",
    low: "निम्न",
    unknown: "—"
  },

  medicalRecordsAi: {
    noRecordsYet: "अभी कोई रिकॉर्ड नहीं",
    documentsStored: "दस्तावेज़ सहेजे गए",
    addRecord: "रिकॉर्ड जोड़ें",
    emptyTitle: "अभी कोई मेडिकल रिकॉर्ड नहीं",
    emptyDesc:
      "डॉक्टर नोट्स, प्रिस्क्रिप्शन, इमेजिंग रिपोर्ट, डिस्चार्ज सारांश और अन्य दस्तावेज़ अपलोड करें — AI उन्हें पढ़कर वर्गीकृत करेगा।",
    // Filters (Phase 7A)
    filters: "फ़िल्टर",
    clearFilters: "फ़िल्टर हटाएं",
    sortLabel: "क्रमबद्ध करें",
    sortNewest: "सबसे नया पहले",
    sortVisitDate: "विज़िट की तारीख",
    sortRecentlyUpdated: "हाल ही में अपडेट",
    filterCategory: "श्रेणी",
    filterDocumentType: "दस्तावेज़ प्रकार",
    filterPhysician: "चिकित्सक",
    filterPhysicianPlaceholder: "चिकित्सक के नाम से खोजें",
    filterFacility: "सुविधा / अस्पताल",
    filterFacilityPlaceholder: "सुविधा के नाम से खोजें",
    filterDateRange: "विज़िट तिथि सीमा",
    filterFrom: "से",
    filterTo: "तक",
    filterConfidence: "निष्कर्षण विश्वास",
    filterProcessed: "प्रोसेसिंग स्थिति",
    filterProcessedYes: "संसाधित",
    filterProcessedNo: "अभी तक संसाधित नहीं",
    filterFamilyMember: "परिवार का सदस्य",
    filterAny: "कोई भी",
    noFilterMatchTitle: "कोई भी रिकॉर्ड इन फ़िल्टर से मेल नहीं खाता",
    noFilterMatchDesc: "अधिक रिकॉर्ड देखने के लिए एक फ़िल्टर हटाएं या सभी साफ़ करें।",
    noProcessedTitle: "अभी तक कोई संसाधित रिकॉर्ड नहीं",
    noProcessedDesc: "AI सारांश और संरचित डेटा देखने के लिए एक रिकॉर्ड प्रोसेस करें।",
    docGroup: {
      clinical: "क्लिनिकल",
      imaging: "इमेजिंग",
      medication: "दवा",
      procedure: "प्रक्रिया",
      administrative: "प्रशासनिक",
      other: "अन्य"
    },
    // Record editing (Phase 7A §5)
    editTitle: "रिकॉर्ड संपादित करें",
    fieldNotes: "टिप्पणियाँ",
    // Saved views (Phase 7A §3)
    saveViewLabel: "यह फ़िल्टर संयोजन सहेजें",
    saveViewPlaceholder: "उदा. हाल की इमेजिंग",
    // Search UX (Phase 7A §4)
    recentSearches: "हाल की खोजें",
    suggestions: "सुझाव",
    // Bulk operations (Phase 7A §9)
    selectRecords: "चुनें",
    exitSelectMode: "हो गया",
    selectedCount: "{count} चयनित",
    bulkProcess: "प्रोसेस करें",
    bulkExport: "फ़ाइलें डाउनलोड करें",
    bulkMove: "स्थानांतरित करें…",
    bulkProcessing: "{total} में से {current} प्रोसेस हो रहा है…",
    bulkDeleteConfirm: "{count} चयनित रिकॉर्ड हटाएं? इसे पूर्ववत नहीं किया जा सकता।",
    // Add-record modal
    addTitle: "मेडिकल रिकॉर्ड जोड़ें",
    addSubtitle: "एक दस्तावेज़ अपलोड करें — AI इसे वर्गीकृत करता है और विवरण भरता है",
    uploadLabel: "दस्तावेज़ फ़ाइल (PDF या फ़ोटो)",
    uploadHint: "हम इसे पढ़ेंगे, दस्तावेज़ का प्रकार पहचानेंगे, और विवरण भरेंगे",
    fieldTitle: "शीर्षक",
    fieldDocumentType: "दस्तावेज़ प्रकार",
    fieldFacility: "सुविधा / अस्पताल",
    fieldPhysician: "चिकित्सक",
    fieldRecordDate: "रिकॉर्ड तिथि",
    forMember: "परिवार के सदस्य के लिए (वैकल्पिक)",
    self: "— स्वयं —",
    save: "रिकॉर्ड सहेजें",
    saving: "सहेजा जा रहा है…",
    uploading: "अपलोड हो रहा है…",
    // Staged loader — classify
    stageReading: "आपका दस्तावेज़ पढ़ा जा रहा है…",
    stageOcr: "OCR चलाया जा रहा है…",
    stageClassifying: "दस्तावेज़ का प्रकार पहचाना जा रहा है…",
    stageDone: "पूर्ण",
    // Metadata card
    metaTitle: "AI वर्गीकरण",
    parsedOk: "दस्तावेज़ सफलतापूर्वक वर्गीकृत किया गया",
    parsedPartial: "कुछ फ़ील्ड आत्मविश्वास से पहचानी नहीं जा सकीं",
    verify: "AI ने यह मान पहचाना है। कृपया सत्यापित करें।",
    typeUnrecognized: "दस्तावेज़ का प्रकार आत्मविश्वास से पहचाना नहीं जा सका। कृपया एक चुनें।",
    // Card
    actViewOriginal: "फ़ाइल देखें",
    actExport: "निर्यात करें",
    notClassified: "वर्गीकृत नहीं",
    // Processing (Phase 2)
    searchPlaceholder: "रिकॉर्ड खोजें…",
    noSearchResults: "आपकी खोज से कोई रिकॉर्ड मेल नहीं खाता",
    process: "दस्तावेज़ प्रोसेस करें",
    processing: "प्रोसेस हो रहा है…",
    regenerate: "पुनः बनाएँ",
    reprocessing: "पुनः प्रोसेस हो रहा है…",
    viewWorkspace: "AI परिणाम देखें",
    hideWorkspace: "AI परिणाम छिपाएँ",
    tabSummary: "सारांश",
    tabSections: "अनुभाग",
    summaryHeading: "सारांश",
    generatedAt: "बनाया गया",
    extractionQuality: "निष्कर्षण गुणवत्ता",
    disclaimer:
      "यह आपके दस्तावेज़ का AI-जनित सारांश है, चिकित्सा निदान नहीं। विवरण की पुष्टि हमेशा अपने स्वास्थ्य सेवा प्रदाता से करें।",
    pdfFooter:
      "AI-जनित सारांश। यह दस्तावेज़ चिकित्सा निदान नहीं है। कृपया अपने स्वास्थ्य सेवा प्रदाता से परामर्श करें।",
    toolbarDownloadPdf: "PDF डाउनलोड करें",
    emptySectionsTitle: "कोई अनुभाग नहीं निकाला जा सका",
    emptySectionsDesc:
      "पुनः प्रोसेस करने का प्रयास करें, या दस्तावेज़ का अधिक स्पष्ट स्कैन अपलोड करें।",
    // Staged loader — process
    stageProcessReading: "आपका दस्तावेज़ पढ़ा जा रहा है…",
    stageProcessExtract: "क्लिनिकल अनुभाग निकाले जा रहे हैं…",
    stageProcessSummary: "सरल भाषा में सारांश लिखा जा रहा है…",
    stageProcessDone: "पूर्ण",
    // Medications (Phase 3)
    tabMedications: "दवाइयाँ",
    medicationsCount: "दवाइयाँ पहचानी गईं",
    colMedication: "दवा",
    colStrength: "शक्ति",
    colDose: "खुराक",
    colFrequency: "आवृत्ति",
    colDuration: "अवधि",
    colStatus: "स्थिति",
    reviewSuggested: "समीक्षा सुझाई गई — कृपया इस दवा की पुष्टि करें।",
    medRoute: "मार्ग",
    medQuantity: "मात्रा",
    medRefills: "रीफ़िल",
    medDates: "आरंभ → समाप्ति",
    medPrn: "आवश्यकतानुसार (PRN)",
    medInstructions: "निर्देश",
    medPrescriber: "लिखने वाले चिकित्सक",
    prnYes: "हाँ",
    prnNo: "नहीं",
    medNoDetail: "इस दवा के लिए कोई अतिरिक्त विवरण नहीं निकाला गया।",
    emptyMedsTitle: "कोई दवा नहीं पहचानी जा सकी",
    emptyMedsDesc:
      "पुनः प्रोसेस करने का प्रयास करें, या दस्तावेज़ का अधिक स्पष्ट स्कैन अपलोड करें।",
    // Staged loader — medication process
    stageProcessMedsExtract: "दवाइयाँ निकाली जा रही हैं…",
    stageProcessMedsSummary: "दवा सारांश लिखा जा रहा है…",
    // Imaging (Phase 4)
    tabFindings: "निष्कर्ष",
    imgModality: "पद्धति",
    imgRegions: "क्षेत्र",
    imgExam: "जाँच",
    imgFindingsCount: "निष्कर्ष",
    imgRecommendationsCount: "सिफ़ारिशें",
    imgRadiologist: "रेडियोलॉजिस्ट",
    imgMeasurements: "माप",
    imgImpression: "इंप्रेशन",
    imgRecommendations: "अनुशंसित फ़ॉलो-अप",
    imgNormalFindings: "सामान्य निष्कर्ष",
    imgInPlainTerms: "सरल शब्दों में",
    imgSource: "रिपोर्ट से",
    colFinding: "निष्कर्ष",
    colLocation: "स्थान",
    colSeverity: "गंभीरता",
    colMeasurement: "माप",
    colConfidence: "विश्वास",
    colAssociatedFinding: "संबंधित निष्कर्ष",
    emptyImgTitle: "कोई संरचित निष्कर्ष नहीं निकाला जा सका",
    emptyImgDesc: "पुनः प्रोसेस करने का प्रयास करें, या रिपोर्ट का अधिक स्पष्ट स्कैन अपलोड करें।",
    // Staged loader — imaging process
    stageProcessImgExtract: "रेडियोलॉजी निष्कर्ष निकाले जा रहे हैं…",
    stageProcessImgSummary: "इमेजिंग सारांश लिखा जा रहा है…",
    // Procedure (Phase 5)
    tabProcedure: "प्रक्रिया",
    procName: "प्रक्रिया",
    procCategory: "श्रेणी",
    procSurgeon: "सर्जन",
    procOutcome: "परिणाम",
    procIndication: "संकेत",
    procAssistants: "सहायक",
    procOperatingRoom: "ऑपरेटिंग रूम",
    procAnesthesia: "एनेस्थीसिया",
    procBodySite: "शारीरिक स्थान",
    procBloodLoss: "अनुमानित रक्त हानि",
    procOverview: "प्रक्रिया अवलोकन",
    procTimeline: "प्रक्रिया टाइमलाइन",
    procDevices: "उपकरण व इम्प्लांट",
    procSpecimens: "नमूने",
    procFindings: "अंतःशल्य निष्कर्ष",
    procComplications: "जटिलताएँ",
    procRecovery: "रिकवरी व फ़ॉलो-अप",
    colDevice: "उपकरण",
    colManufacturer: "निर्माता",
    colModel: "मॉडल",
    colSpecimen: "नमूना",
    colCollectionSite: "संग्रह स्थान",
    colPurpose: "उद्देश्य",
    emptyProcTitle: "कोई प्रक्रिया विवरण नहीं निकाला जा सका",
    emptyProcDesc: "पुनः प्रोसेस करने का प्रयास करें, या रिपोर्ट का अधिक स्पष्ट स्कैन अपलोड करें।",
    // Staged loader — procedure process
    stageProcessProcExtract: "प्रक्रिया विवरण निकाला जा रहा है…",
    stageProcessProcSummary: "प्रक्रिया सारांश लिखा जा रहा है…",
    // Immunization (Phase 6)
    tabImmunizations: "टीके",
    vaccinesCount: "टीके दर्ज",
    colVaccine: "टीका",
    colDoseNumber: "खुराक",
    colDate: "तिथि",
    colProvider: "प्रदाता",
    colNextDue: "अगली देय",
    vacManufacturer: "निर्माता",
    vacLotNumber: "लॉट नंबर",
    vacRoute: "मार्ग",
    vacSite: "स्थान",
    vacNoDetail: "इस टीके के लिए कोई अतिरिक्त विवरण नहीं निकाला गया।",
    emptyVaccinesTitle: "कोई टीका पहचाना नहीं जा सका",
    emptyVaccinesDesc: "पुनः संसाधित करें, या दस्तावेज़ का स्पष्ट स्कैन अपलोड करें।",
    stageProcessImmExtract: "टीके निकाले जा रहे हैं…",
    stageProcessImmSummary: "टीकाकरण सारांश लिखा जा रहा है…",
    // Billing / insurance (Phase 6)
    tabBilling: "बिलिंग",
    billRecordType: "रिकॉर्ड प्रकार",
    billProvider: "प्रदाता",
    billService: "सेवा",
    billCharged: "प्रभारित राशि",
    billPaid: "भुगतान राशि",
    billPayer: "भुगतानकर्ता",
    billStatus: "दावा स्थिति",
    billDenialReason: "अस्वीकृति का कारण",
    billDetails: "बिलिंग विवरण",
    billCodes: "बिलिंग कोड",
    colCode: "कोड",
    colCodeSystem: "प्रणाली",
    colCodeDescription: "विवरण",
    emptyBillingTitle: "कोई बिलिंग विवरण नहीं निकाला जा सका",
    emptyBillingDesc: "पुनः संसाधित करें, या दस्तावेज़ का स्पष्ट स्कैन अपलोड करें।",
    stageProcessBillExtract: "बिलिंग विवरण निकाला जा रहा है…",
    stageProcessBillSummary: "बिलिंग सारांश लिखा जा रहा है…"
  },

  claimStatus: {
    paid: "भुगतान किया गया",
    denied: "अस्वीकृत",
    pending: "लंबित",
    partial: "आंशिक",
    submitted: "प्रस्तुत",
    unknown: "अज्ञात"
  },

  procedureOutcome: {
    successful: "सफल",
    completed: "पूर्ण",
    partial: "आंशिक",
    aborted: "रद्द",
    converted: "परिवर्तित",
    unknown: "अज्ञात"
  },

  medicationStatus: {
    current: "वर्तमान",
    completed: "पूर्ण",
    discontinued: "बंद",
    prn: "आवश्यकतानुसार",
    unknown: "अज्ञात"
  },

  medicalRecordSections: {
    visit_reason: "आने का कारण",
    chief_complaint: "मुख्य शिकायत",
    history_present_illness: "वर्तमान बीमारी का इतिहास",
    assessment: "मूल्यांकन",
    diagnosis: "निदान",
    treatment_plan: "उपचार योजना",
    follow_up: "अनुवर्ती",
    medications: "दवाइयाँ",
    referring_physician: "रेफ़र करने वाले चिकित्सक",
    consulting_physician: "परामर्श चिकित्सक",
    consultation_reason: "परामर्श का कारण",
    findings: "निष्कर्ष",
    recommendations: "सिफ़ारिशें",
    next_steps: "अगले कदम",
    past_medical_history: "पिछला चिकित्सा इतिहास",
    surgical_history: "शल्य चिकित्सा इतिहास",
    family_history: "पारिवारिक इतिहास",
    social_history: "सामाजिक इतिहास",
    allergies: "एलर्जी",
    review_of_systems: "प्रणालियों की समीक्षा",
    physical_examination: "शारीरिक परीक्षण",
    plan: "योजना",
    // Phase 6 clinical extensions
    primary_diagnosis: "प्राथमिक निदान",
    secondary_diagnoses: "द्वितीयक निदान",
    severity: "गंभीरता",
    status: "स्थिति",
    clinical_notes: "नैदानिक टिप्पणियाँ",
    supporting_evidence: "सहायक प्रमाण",
    goals: "लक्ष्य",
    procedures: "प्रक्रियाएँ",
    lifestyle_recommendations: "जीवनशैली संबंधी सिफ़ारिशें",
    monitoring: "निगरानी",
    follow_up_schedule: "अनुवर्ती कार्यक्रम",
    admission_reason: "भर्ती का कारण",
    hospital_course: "अस्पताल में उपचार क्रम",
    final_diagnosis: "अंतिम निदान",
    discharge_medications: "छुट्टी की दवाइयाँ",
    discharge_instructions: "छुट्टी के निर्देश",
    target_specialty: "रेफ़र किया गया (विशेषज्ञता)",
    referral_reason: "रेफ़रल का कारण",
    clinical_background: "नैदानिक पृष्ठभूमि",
    requested_evaluation: "अनुरोधित मूल्यांकन",
    observations: "अवलोकन",
    care_plan: "देखभाल योजना"
  },

  medicalRecordTypes: {
    doctor_note: "डॉक्टर नोट",
    clinician_note: "चिकित्सक नोट",
    consultation_note: "परामर्श नोट",
    history_physical: "इतिहास व शारीरिक परीक्षण",
    diagnosis: "निदान",
    treatment_plan: "उपचार योजना",
    xray_report: "एक्स-रे रिपोर्ट",
    mri_report: "MRI रिपोर्ट",
    ct_report: "CT रिपोर्ट",
    ultrasound_report: "अल्ट्रासाउंड रिपोर्ट",
    prescription: "प्रिस्क्रिप्शन",
    medication_list: "दवा सूची",
    procedure_note: "प्रक्रिया नोट",
    surgery_report: "सर्जरी रिपोर्ट",
    discharge_summary: "डिस्चार्ज सारांश",
    referral_note: "रेफ़रल नोट",
    immunization_record: "टीकाकरण रिकॉर्ड",
    vaccination_record: "वैक्सीनेशन रिकॉर्ड",
    billing_record: "बिलिंग रिकॉर्ड",
    insurance_claim: "बीमा दावा रिकॉर्ड",
    other: "अन्य"
  },

  deleteLabReport: {
    title: "लैब रिपोर्ट हटाएं?",
    body: "क्या आप वाकई इस लैब रिपोर्ट को हटाना चाहते हैं?",
    warning:
      "यह फ़ाइल, AI सारांश और निकाले गए सभी मानों को स्थायी रूप से हटा देता है। इस कार्रवाई को पूर्ववत नहीं किया जा सकता है।",
    confirm: "हाँ, हटाएँ"
  },

  aiConsent: {
    title: "इस रिपोर्ट को पढ़ने में AI की मदद लें?",
    body: "हम आपकी रिपोर्ट का सरल, आसान भाषा में सारांश बनाने के लिए AI का उपयोग करते हैं। प्रोसेसिंग के लिए भेजने से पहले आपका नाम, फ़ोन नंबर और पहचान संख्या जैसे व्यक्तिगत विवरण हटा दिए जाते हैं। AI सारांश आपके डॉक्टर का विकल्प नहीं है। आप इसे कभी भी अपनी प्रोफ़ाइल में बंद कर सकते हैं।",
    allow: "अनुमति दें और जारी रखें",
    notNow: "अभी नहीं",
    sectionTitle: "AI प्रोसेसिंग",
    sectionDesc:
      "AI को अपनी रिपोर्ट का सरल भाषा में सारांश बनाने दें। प्रोसेसिंग से पहले पहचान संबंधी विवरण हटा दिए जाते हैं।",
    enabled: "चालू",
    disabled: "बंद",
    enable: "चालू करें",
    revoke: "बंद करें"
  },

  doctor: {
    dashboard: {
      welcome: "नमस्ते",
      pendingRequests: "प्रतीक्षित अनुरोध",
      prescriptionsWritten: "लिखे गए पर्चे",
      addPatient: "मरीज़ जोड़ें",
      newPrescription: "नया पर्चा"
    },
    patients: {
      addByPhone: "फ़ोन नंबर से मरीज़ जोड़ें",
      addDescription:
        "एक कनेक्शन अनुरोध भेजें। पर्चा लिखने से पहले मरीज़ को इसे स्वीकार करना होगा।",
      sendRequest: "अनुरोध भेजें",
      emptyTitle: "अभी कोई मरीज़ नहीं",
      emptyDescription: "कनेक्शन शुरू करने के लिए मरीज़ को उनके मोबाइल नंबर से जोड़ें।",
      status: {
        pending: "प्रतीक्षित",
        accepted: "जुड़ा हुआ",
        rejected: "अस्वीकृत"
      }
    },
    prescriptions: {
      title: "पर्चे",
      written: "लिखे गए",
      new: "नया पर्चा",
      selectPatient: "मरीज़ चुनें",
      patient: "मरीज़",
      hospitalName: "हॉस्पिटल / क्लिनिक का नाम",
      visitDate: "विज़िट की तारीख़",
      medicines: "दवाएँ",
      diagnosis: "निदान",
      noPatientsTitle: "पहले किसी मरीज़ से जुड़ें",
      noPatientsDescription: "पर्चा लिखने के लिए आपको किसी मरीज़ का स्वीकृत कनेक्शन चाहिए।",
      emptyTitle: "अभी तक कोई पर्चा नहीं लिखा गया",
      todaysQueue: "आज की कतार",
      addToToday: "आज की सूची में जोड़ें",
      searchQueue: "नाम या मरीज़ नंबर से खोजें",
      searchPatients: "नाम या फ़ोन नंबर से मरीज़ खोजें",
      token: "मरीज़",
      prescribe: "पर्चा लिखें",
      noQueueTitle: "आज की कतार में कोई मरीज़ नहीं",
      noQueueDescription: "पर्चा लिखने के लिए किसी जुड़े हुए मरीज़ को आज की कतार में जोड़ें।",
      selectFromQueue: "पर्चा लिखने के लिए आज की कतार से एक मरीज़ चुनें।",
      patientList: "मरीज़ों की सूची",
      addPatient: "मरीज़ जोड़ें",
      addToList: "सूची में जोड़ें",
      date: "तारीख़",
      newPrescription: "नया पर्चा",
      editPrescription: "पर्चा संपादित करें"
    },
    profile: {
      heading: "पेशेवर विवरण",
      specialization: "विशेषज्ञता",
      licenseNumber: "मेडिकल लाइसेंस नंबर",
      clinicName: "क्लिनिक / हॉस्पिटल का नाम"
    }
  },

  medicine: {
    name: "दवा का नाम",
    quantity: "मात्रा",
    quantityPlaceholder: "जैसे 10",
    addMedicine: "दवा जोड़ें",
    remove: "हटाएँ",
    beforeFood: "खाने से पहले",
    afterFood: "खाने के बाद",
    perDay: "{n}/दिन",
    dayCourse: "{n} दिन का कोर्स",
    slots: {
      morning: "सुबह",
      afternoon: "दोपहर",
      evening: "शाम",
      night: "रात"
    }
  },

  patient: {
    myDoctors: {
      connected: "जुड़े हुए",
      pending: "प्रतीक्षित",
      emptyTitle: "अभी कोई डॉक्टर नहीं",
      emptyDescription: "जब कोई डॉक्टर आपको कनेक्शन अनुरोध भेजेगा, तो वह यहाँ दिखेगा।",
      requestsHeading: "प्रतीक्षित अनुरोध",
      connectedHeading: "जुड़े हुए डॉक्टर",
      accept: "स्वीकार करें",
      reject: "अस्वीकार करें",
      connectedBadge: "जुड़ा हुआ"
    },
    prescriptions: {
      prescribedBy: "द्वारा लिखा गया"
    }
  },

  datePicker: {
    months: [
      "जनवरी",
      "फ़रवरी",
      "मार्च",
      "अप्रैल",
      "मई",
      "जून",
      "जुलाई",
      "अगस्त",
      "सितंबर",
      "अक्टूबर",
      "नवंबर",
      "दिसंबर"
    ],
    weekdaysShort: ["र", "सो", "मं", "बु", "गु", "शु", "श"],
    today: "आज",
    clear: "साफ़ करें",
    selectDate: "तारीख़ चुनें",
    prevMonth: "पिछला महीना",
    nextMonth: "अगला महीना",
    selectYear: "वर्ष चुनें",
    selectTime: "समय चुनें"
  },

  subscription: {
    title: "योजनाएँ और बिलिंग",
    subtitle: "अपने परिवार की ज़रूरतों के हिसाब से योजना चुनें।",
    currentPlan: "मौजूदा योजना",
    renewsOn: "{date} को नवीनीकरण होगा",
    cancelAtPeriodEnd: "आपकी योजना {date} के बाद नवीनीकृत नहीं होगी",
    cancel: "योजना रद्द करें",
    cancelConfirm: "आपकी योजना मौजूदा अवधि समाप्त होने तक सक्रिय रहेगी। जारी रखें?",
    subscribe: "सदस्यता लें",
    switchPlan: "इस योजना पर स्विच करें",
    manage: "प्रबंधित करें",
    perMonth: "/माह",
    perMemberMonth: "/सदस्य/माह",
    mostPopular: "सबसे लोकप्रिय",
    checkoutSuccess: "आपकी योजना अब सक्रिय है।",
    checkoutFailed: "हम भुगतान की पुष्टि नहीं कर सके। कृपया फिर से प्रयास करें।",
    mockNotice: "टेस्ट मोड — कोई वास्तविक भुगतान नहीं लिया जाता।",
    plans: {
      free: {
        name: "फ्री",
        tagline: "सभी के लिए मुफ़्त",
        cta: "अपनी स्वास्थ्य यात्रा मुफ़्त में शुरू करें।"
      },
      individual: {
        name: "इंडिविजुअल प्रीमियम",
        tagline: "व्यक्तियों के लिए। आपके लिए उन्नत देखभाल।",
        cta: "अधिक जानकारी चाहने वालों के लिए।"
      },
      family: {
        name: "फैमिली प्रीमियम",
        tagline: "पूरे परिवार के लिए एक योजना।",
        cta: "एक परिवार। एक स्वास्थ्य डैशबोर्ड।"
      }
    },
    features: {
      health_records: "स्वास्थ्य रिकॉर्ड",
      reports_prescriptions: "रिपोर्ट और नुस्खे",
      timeline_basic: "स्वास्थ्य टाइमलाइन",
      basic_insights: "बुनियादी स्वास्थ्य जानकारी",
      reminders_basic: "रिमाइंडर और अलर्ट",
      secure_storage: "सुरक्षित डेटा भंडारण",
      ai_report_explanation: "एआई रिपोर्ट स्पष्टीकरण",
      health_trends: "स्वास्थ्य रुझान और जानकारी",
      timeline_advanced: "उन्नत स्वास्थ्य टाइमलाइन",
      smart_reminders: "स्मार्ट रिमाइंडर",
      priority_support: "प्राथमिकता सहायता",
      advanced_analytics: "उन्नत विश्लेषण",
      family_dashboard: "फैमिली डैशबोर्ड",
      manage_family_members: "परिवार के सदस्य जोड़ें और प्रबंधित करें",
      child_health: "बाल स्वास्थ्य प्रबंधन",
      elderly_care: "बुज़ुर्ग देखभाल प्रबंधन",
      shared_records: "साझा स्वास्थ्य रिकॉर्ड",
      family_health_score: "फैमिली हेल्थ स्कोर",
      caregiver_access: "देखभालकर्ता पहुँच",
      emergency_contacts: "आपातकालीन संपर्क नेटवर्क",
      family_analytics: "फैमिली स्वास्थ्य विश्लेषण"
    },
    gate: {
      title: "यह एक प्रीमियम सुविधा है",
      description: "इसे अनलॉक करने के लिए {plan} पर अपग्रेड करें।",
      cta: "योजनाएँ देखें"
    }
  },

  admin: {
    title: "एडमिन",
    subtitle: "परिचालन नियंत्रण — मरीज़ का स्वास्थ्य डेटा यहाँ कभी नहीं दिखाया जाता।",
    phiNotice:
      'स्वास्थ्य रिकॉर्ड, लैब रिपोर्ट और नुस्खे जानबूझकर एडमिन पैनल से एक्सेस नहीं किए जा सकते। एक रिडैक्टेड, ऑडिटेड पूर्वावलोकन के लिए "यूज़र के रूप में टेस्ट करें" का उपयोग करें।',
    nav: {
      users: "यूज़र",
      subscriptions: "सदस्यताएँ",
      payments: "भुगतान",
      plans: "योजनाएँ",
      audit: "ऑडिट लॉग",
      metrics: "मेट्रिक्स",
      medicines: "दवाइयाँ"
    },
    users: {
      search: "नाम या फ़ोन से खोजें",
      role: "भूमिका",
      status: "स्थिति",
      suspended: "निलंबित",
      active: "सक्रिय",
      suspend: "निलंबित करें",
      reactivate: "पुनः सक्रिय करें",
      impersonate: "यूज़र के रूप में टेस्ट करें",
      impersonateNotice:
        "रिडैक्टेड पूर्वावलोकन — कोई भी प्लेनटेक्स्ट स्वास्थ्य डेटा नहीं दिखाया जाएगा।",
      counts: "{records} रिकॉर्ड · {labs} लैब · {prescriptions} नुस्खे · {family} परिवार के सदस्य"
    },
    metrics: {
      totalUsers: "कुल यूज़र",
      signups30d: "साइनअप (30 दिन)",
      mrr: "मासिक आवर्ती राजस्व",
      activeByPlan: "योजना अनुसार सक्रिय सदस्यताएँ"
    },
    audit: {
      action: "कार्रवाई",
      actor: "करने वाला",
      subject: "विषय",
      when: "कब"
    },
    medicines: {
      title: "दवा सूची",
      subtitle: "साझा, गैर-PHI ज्ञान आधार जो AI दवा उत्तरों को आधार देता है।",
      search: "नाम से खोजें",
      addBtn: "दवा जोड़ें",
      addTitle: "दवा जोड़ें",
      editTitle: "दवा संपादित करें",
      source: "स्रोत",
      allSources: "सभी स्रोत",
      sourceSeed: "सीड",
      sourceAdmin: "एडमिन",
      sourceStub: "स्टब",
      verified: "सत्यापित",
      unverified: "असत्यापित",
      verify: "सत्यापित करें",
      unverify: "असत्यापित करें",
      embed: "एम्बेडिंग बनाएँ",
      embedDisabled: "एम्बेडिंग प्रदाता कॉन्फ़िगर नहीं है।",
      embedded: "एम्बेडिंग बन गई।",
      embeddedNone: "कोई एम्बेडिंग प्रदाता कॉन्फ़िगर नहीं है।",
      fieldName: "नाम",
      fieldGenericName: "जेनेरिक नाम",
      fieldBrandNames: "ब्रांड नाम",
      fieldDosageForms: "खुराक रूप",
      fieldCommonUsage: "सामान्य उपयोग",
      fieldSideEffects: "दुष्प्रभाव",
      fieldInteractions: "पारस्परिक क्रियाएँ",
      fieldWarnings: "चेतावनियाँ",
      fieldContraindications: "प्रतिनिषेध",
      fieldNotes: "टिप्पणियाँ",
      listHint: "एक से अधिक प्रविष्टियाँ अल्पविराम से अलग करें",
      markVerified: "सत्यापित",
      deleteConfirm: "इस दवा को सूची से हटाएँ?",
      emptyTitle: "कोई दवा नहीं मिली",
      emptyDescription: "कोई और खोज आज़माएँ, या सूची में दवा जोड़ें।",
      stubNotice: "नुस्खे से स्वतः बनाई गई — विवरण की समीक्षा कर सत्यापित करें।",
      prev: "पिछला",
      next: "अगला",
      pageOf: "पृष्ठ {current} / {total}"
    }
  }
};
