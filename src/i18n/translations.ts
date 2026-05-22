// ─────────────────────────────────────────────────────────────────────────────
// src/i18n/translations.ts
// Flaro – 4 dil: Azərbaycan (az), English (en), Русский (ru), Türkçe (tr)
// ─────────────────────────────────────────────────────────────────────────────

export type Locale = 'az' | 'en' | 'ru' | 'tr'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'az', label: 'AZ', flag: '🇦🇿' },
  { code: 'en', label: 'EN', flag: '🇬🇧' },
  { code: 'ru', label: 'RU', flag: '🇷🇺' },
  { code: 'tr', label: 'TR', flag: '🇹🇷' },
]

// ── Translation shape ─────────────────────────────────────────────────────────
export interface Translations {
  // ── Nav / shared ────────────────────────────────────────────────────────────
  nav: {
    features: string
    pricing: string
    login: string
    getStarted: string
    dashboard: string
  }
  // ── Landing page ─────────────────────────────────────────────────────────────
  landing: {
    badge: string
    heroTitle1: string
    heroHighlight: string
    heroTitle2: string
    heroSubtitle: string
    ctaStart: string
    ctaPricing: string
    featuresTitle: string
    featuresSubtitle: string
    feat1Title: string
    feat1Desc: string
    feat2Title: string
    feat2Desc: string
    feat3Title: string
    feat3Desc: string
    feat4Title: string
    feat4Desc: string
    ctaSectionTitle: string
    ctaSectionDesc: string
    ctaSectionBtn: string
    footerRights: string
  }
  // ── Login page ────────────────────────────────────────────────────────────────
  login: {
    signIn: string
    signUp: string
    signInTitle: string
    signUpTitle: string
    orSignIn: string
    orSignUp: string
    emailPlaceholder: string
    passwordPlaceholder: string
    fullNamePlaceholder: string
    submitSignIn: string
    submitSignUp: string
    processing: string
    emailConfirm: string
  }
  // ── Dashboard page ────────────────────────────────────────────────────────────
  dashboard: {
    myScenes: string
    search: string
    newScene: string
    grid: string
    list: string
    logout: string
    settings: string
    upgrade: string
    noScenes: string
    noScenesHint: string
    loading: string
    refresh: string
    upgradeSuccess: string
    freeLimit: string
    scenesUsed: string
    confirmDelete: string
    rename: string
    duplicate: string
    open: string
    delete: string
    lastEdited: string
    untitled: string
  }
  // ── Editor / TopBar ────────────────────────────────────────────────────────
  editor: {
    untitled: string
    saving: string
    saved: string
    share: string
    present: string
    export: string
    back: string
    aiPanel: string
    zoomIn: string
    zoomOut: string
    fitView: string
    undo: string
    redo: string
  }
  // ── Pricing page ──────────────────────────────────────────────────────────────
  pricing: {
    title: string
    subtitle: string
    free: string
    pro: string
    freePrice: string
    proPrice: string
    perMonth: string
    startFree: string
    upgradePro: string
    currentPlan: string
    mostPopular: string
    sectionCreate: string
    sectionCollab: string
    sectionShare: string
    sectionTeam: string
    yes: string
    no: string
    limited: string
    extended: string
    features: {
      infiniteCanvas: string
      fullTools: string
      unlimitedScenes: string
      autoSync: string
      fastDashboard: string
      generativeAI: string
      presentations: string
      inviteLink: string
      viewOnlyMode: string
      voiceScreen: string
      comments: string
      livePresentations: string
      pngSvgJson: string
      embedLinks: string
      slidePresent: string
      pdfPptx: string
      userAccounts: string
      cloudStorage: string
      workspaceTeams: string
      userManagement: string
    }
  }
  // ── SharedView page ───────────────────────────────────────────────────────────
  sharedView: {
    notFound: string
    notPublic: string
    loading: string
    viewOnly: string
    openFlaro: string
    poweredBy: string
  }
  // ── AuthCallback ───────────────────────────────────────────────────────────
  authCallback: {
    processing: string
  }
  // ── Common ────────────────────────────────────────────────────────────────────
  common: {
    error: string
    cancel: string
    save: string
    create: string
    close: string
    new: string
  }
  // ── Admin ──────────────────────────────────────────────────────────────────────
  admin: {
    navDashboard:      string
    navUsers:          string
    navSubscriptions:  string
    navSettings:       string
    navLogout:         string

    loginTitle:        string
    loginSubtitle:     string
    loginEmail:        string
    loginPassword:     string
    loginSubmit:       string
    loginNotAdmin:     string
    loginTooMany:      string

    statsTotal:        string
    statsPro:          string
    statsFree:         string
    statsNew7d:        string
    statsScenes:       string
    statsActiveSubs:   string
    recentUsers:       string
    recentActivity:    string

    usersTitle:        string
    searchPlaceholder: string
    filterAll:         string
    filterFree:         string
    filterPro:         string
    colName:           string
    colEmail:          string
    colPlan:           string
    colScenes:         string
    colDate:           string
    colActions:        string
    editUser:          string
    deleteUser:        string
    deleteConfirm:     string
    planChanged:       string
    userSaved:         string

    subsTitle:         string
    colStatus:         string
    colStripeId:       string
    colStart:          string
    colEnd:            string
    statusActive:      string
    statusCanceled:    string
    statusPastDue:     string
    makeProBtn:        string
    makeFreeBtn:       string

    settingsTitle:     string
    profileSection:    string
    passwordSection:   string
    currentPassword:   string
    newPassword:       string
    confirmPassword:   string
    passwordChanged:   string
    passwordMismatch:  string
    profileSaved:      string
    sessionSection:    string
    lastLogin:         string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AZERBAIJANI  (az)  — default / əsas dil
// ─────────────────────────────────────────────────────────────────────────────
const az: Translations = {
  nav: {
    features: 'Xüsusiyyətlər',
    pricing: 'Qiymətlər',
    login: 'Daxil ol',
    getStarted: 'Başla',
    dashboard: 'Dashboard',
  },
  landing: {
    badge: 'El çizimi ilə professional diaqramlar',
    heroTitle1: 'Fikirləri',
    heroHighlight: 'çəkin',
    heroTitle2: ', paylaşın, birlikdə işləyin',
    heroSubtitle:
      'Flaro — el çizimi estetikası olan, real-time əməkdaşlıq imkanları ilə təchiz edilmiş ağıllı diaqram yaratma platforması.',
    ctaStart: 'Pulsuz başla',
    ctaPricing: 'Qiymətlər',
    featuresTitle: 'Hər şey bir yerdə',
    featuresSubtitle: 'Flaro ilə fikirlərinizi peşəkar diaqramlara çevirin.',
    feat1Title: 'El çizimi estetikası',
    feat1Desc: 'Canlı, əl ilə çəkilmiş kimi görünən diaqramlar yaradın.',
    feat2Title: 'Real-time əməkdaşlıq',
    feat2Desc: 'Komandanızla eyni vaxtda, eyni kətan üzərində işləyin.',
    feat3Title: 'Generativ AI',
    feat3Desc: 'Sadə mətnlə mürəkkəb diaqramlar yaradın.',
    feat4Title: 'Buludda saxla',
    feat4Desc: 'İşləriniz avtomatik sinxronizasiya olunur.',
    ctaSectionTitle: 'Fikrinizi çizməyə başlayın',
    ctaSectionDesc: 'Pulsuz başlayın, istənilən vaxt təkmilləşdirin.',
    ctaSectionBtn: 'İndi başla',
    footerRights: '© 2025 Flaro. Bütün hüquqlar qorunur.',
  },
  login: {
    signIn: 'Daxil ol',
    signUp: 'Qeydiyyat',
    signInTitle: 'Hesabınıza daxil olun',
    signUpTitle: 'Yeni hesab yaradın',
    orSignIn: 'Mövcud hesabla daxil olun',
    orSignUp: 'Yeni hesab qeydiyyatı',
    emailPlaceholder: 'E-poçt ünvanı',
    passwordPlaceholder: 'Şifrə',
    fullNamePlaceholder: 'Ad Soyad',
    submitSignIn: 'Daxil ol',
    submitSignUp: 'Qeydiyyatdan keç',
    processing: 'Emal edilir...',
    emailConfirm: 'E-poçtunuzu yoxlayın (təsdiq linki göndərildi)!',
  },
  dashboard: {
    myScenes: 'Səhnələrim',
    search: 'Axtar...',
    newScene: 'Yeni səhnə',
    grid: 'Şəbəkə',
    list: 'Siyahı',
    logout: 'Çıxış',
    settings: 'Parametrlər',
    upgrade: 'Pro-ya keç',
    noScenes: 'Hələ heç bir səhnəniz yoxdur',
    noScenesHint: 'Yeni səhnə düyməsini basın və başlayın',
    loading: 'Yüklənir...',
    refresh: 'Yenilə',
    upgradeSuccess: '🎉 Pro plana keçdiniz! Bütün xüsusiyyətlər açıqdır.',
    freeLimit: 'Pulsuz planda 3 səhnə limiti var.',
    scenesUsed: 'səhnə istifadə edilir',
    confirmDelete: 'Bu səhnəni silmək istədiyinizə əminsiniz?',
    rename: 'Adını dəyiş',
    duplicate: 'Kopyala',
    open: 'Aç',
    delete: 'Sil',
    lastEdited: 'Son redaktə',
    untitled: 'Adsız səhnə',
  },
  editor: {
    untitled: 'Adsız',
    saving: 'Saxlanılır...',
    saved: 'Saxlanıldı',
    share: 'Paylaş',
    present: 'Təqdim et',
    export: 'İxrac et',
    back: 'Geri',
    aiPanel: 'AI Panel',
    zoomIn: 'Böyüt',
    zoomOut: 'Kiçilt',
    fitView: 'Ekrana uyğunlaşdır',
    undo: 'Geri al',
    redo: 'Yenidən et',
  },
  pricing: {
    title: 'Sadə, şəffaf qiymətlər',
    subtitle: 'Sizi saxlayan planlar yoxdur. İstənilən vaxt ləğv edin.',
    free: 'Pulsuz',
    pro: 'Pro',
    freePrice: '$0',
    proPrice: '$12',
    perMonth: '/ ay',
    startFree: 'Pulsuz başla',
    upgradePro: 'Pro-ya keç',
    currentPlan: 'Cari plan',
    mostPopular: 'Ən populyar',
    sectionCreate: 'Yarat',
    sectionCollab: 'Əməkdaşlıq',
    sectionShare: 'Paylaş',
    sectionTeam: 'Komanda',
    yes: '✓',
    no: '—',
    limited: 'Məhdud',
    extended: 'Genişləndirilmiş',
    features: {
      infiniteCanvas: 'Sonsuz canvas',
      fullTools: 'Tam redaktə alətləri',
      unlimitedScenes: 'Limitsiz səhnələr',
      autoSync: 'Avtomatik sinxronizasiya',
      fastDashboard: 'Sürətli dashboard',
      generativeAI: 'Generativ AI',
      presentations: 'Təqdimatlar',
      inviteLink: 'Linkə dəvət',
      viewOnlyMode: 'Yalnız görüntü rejimi',
      voiceScreen: 'Səs & ekran paylaşımı',
      comments: 'Şərhlər',
      livePresentations: 'Canlı təqdimatlar',
      pngSvgJson: 'PNG/SVG/JSON ixrac',
      embedLinks: 'Embed/Readonly linklər',
      slidePresent: 'Slayd kimi təqdim',
      pdfPptx: 'PDF & PPTX ixrac',
      userAccounts: 'İstifadəçi hesabları',
      cloudStorage: 'Buludda saxla',
      workspaceTeams: 'Workspace Komandaları',
      userManagement: 'İstifadəçi idarəetməsi',
    },
  },
  sharedView: {
    notFound: 'Səhnə tapılmadı',
    notPublic: 'Bu səhnə ictimai deyil',
    loading: 'Yüklənir...',
    viewOnly: 'Yalnız baxış rejimi',
    openFlaro: 'Flaro-da aç',
    poweredBy: 'Flaro ilə hazırlanıb',
  },
  authCallback: {
    processing: 'Giriş emal edilir...',
  },
  common: {
    error: 'Xəta baş verdi',
    cancel: 'Ləğv et',
    save: 'Saxla',
    create: 'Yarat',
    close: 'Bağla',
    new: 'Yeni',
  },
  admin: {
    navDashboard:      'Dashboard',
    navUsers:          'İstifadəçilər',
    navSubscriptions:  'Abunəliklər',
    navSettings:       'Ayarlar',
    navLogout:         'Çıxış',

    loginTitle:        'Admin Paneli',
    loginSubtitle:     'Yalnız admin hesabları üçün',
    loginEmail:        'Email ünvanı',
    loginPassword:     'Şifrə',
    loginSubmit:       'Daxil ol',
    loginNotAdmin:     'Bu hesab admin deyil',
    loginTooMany:      'Çox cəhd. 15 dəqiqə gözləyin.',

    statsTotal:        'Ümumi İstifadəçi',
    statsPro:          'Pro İstifadəçi',
    statsFree:         'Pulsuz İstifadəçi',
    statsNew7d:        'Son 7 gündə',
    statsScenes:       'Ümumi Scene',
    statsActiveSubs:   'Aktiv Abunəlik',
    recentUsers:       'Son Qeydiyyatlar',
    recentActivity:    'Son Əməliyyatlar',

    usersTitle:        'İstifadəçi İdarəetməsi',
    searchPlaceholder: 'Email və ya ad axtar...',
    filterAll:         'Hamısı',
    filterFree:        'Pulsuz (Free)',
    filterPro:         'Pro',
    colName:           'Ad Soyad',
    colEmail:          'Email',
    colPlan:           'Plan',
    colScenes:         'Səhnələr',
    colDate:           'Qeydiyyat Tarixi',
    colActions:        'Əməliyyatlar',
    editUser:          'İstifadəçini Redaktə Et',
    deleteUser:        'İstifadəçini Sil',
    deleteConfirm:     'Bu əməliyyat geri dönməzdir. Davam etmək istəyirsiniz?',
    planChanged:       'Plan uğurla dəyişdirildi',
    userSaved:         'İstifadəçi məlumatları saxlanıldı',

    subsTitle:         'Abunəlik İdarəetməsi',
    colStatus:         'Status',
    colStripeId:       'Stripe ID',
    colStart:          'Başlama Tarixi',
    colEnd:            'Bitmə Tarixi',
    statusActive:      'Aktiv',
    statusCanceled:    'Ləğv edilib',
    statusPastDue:     'Gecikmədə',
    makeProBtn:        'Pro Et',
    makeFreeBtn:       'Free Et',

    settingsTitle:     'Admin Ayarları',
    profileSection:    'Profil Məlumatları',
    passwordSection:   'Şifrə Dəyişdir',
    currentPassword:   'Cari Şifrə',
    newPassword:       'Yeni Şifrə (min 12 simvol)',
    confirmPassword:   'Təkrar Şifrə',
    passwordChanged:   'Şifrə uğurla dəyişdirildi',
    passwordMismatch:  'Yeni şifrələr uyğun gəlmir',
    profileSaved:      'Profil məlumatları uğurla saxlanıldı',
    sessionSection:    'Sessiya Məlumatları',
    lastLogin:         'Son giriş',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ENGLISH  (en)
// ─────────────────────────────────────────────────────────────────────────────
const en: Translations = {
  nav: {
    features: 'Features',
    pricing: 'Pricing',
    login: 'Sign In',
    getStarted: 'Get Started',
    dashboard: 'Dashboard',
  },
  landing: {
    badge: 'Professional diagrams with a hand-drawn feel',
    heroTitle1: 'Sketch ideas,',
    heroHighlight: 'share',
    heroTitle2: ', collaborate',
    heroSubtitle:
      'Flaro is a smart diagramming platform with a hand-drawn aesthetic and real-time collaboration.',
    ctaStart: 'Start for free',
    ctaPricing: 'Pricing',
    featuresTitle: 'Everything in one place',
    featuresSubtitle: 'Turn your ideas into professional diagrams with Flaro.',
    feat1Title: 'Hand-drawn aesthetic',
    feat1Desc: 'Create diagrams that look alive, as if drawn by hand.',
    feat2Title: 'Real-time collaboration',
    feat2Desc: 'Work with your team simultaneously on the same canvas.',
    feat3Title: 'Generative AI',
    feat3Desc: 'Create complex diagrams from simple text descriptions.',
    feat4Title: 'Cloud storage',
    feat4Desc: 'Your work is automatically synced across all devices.',
    ctaSectionTitle: 'Start sketching your ideas',
    ctaSectionDesc: 'Start for free, upgrade anytime.',
    ctaSectionBtn: 'Get started now',
    footerRights: '© 2025 Flaro. All rights reserved.',
  },
  login: {
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signInTitle: 'Sign in to your account',
    signUpTitle: 'Create your account',
    orSignIn: 'sign in to existing account',
    orSignUp: 'register a new account',
    emailPlaceholder: 'Email address',
    passwordPlaceholder: 'Password',
    fullNamePlaceholder: 'Full Name',
    submitSignIn: 'Sign In',
    submitSignUp: 'Sign Up',
    processing: 'Processing...',
    emailConfirm: 'Check your email for a confirmation link!',
  },
  dashboard: {
    myScenes: 'My Scenes',
    search: 'Search...',
    newScene: 'New Scene',
    grid: 'Grid',
    list: 'List',
    logout: 'Sign Out',
    settings: 'Settings',
    upgrade: 'Upgrade to Pro',
    noScenes: 'No scenes yet',
    noScenesHint: 'Click "New Scene" to get started',
    loading: 'Loading...',
    refresh: 'Refresh',
    upgradeSuccess: '🎉 Upgraded to Pro! All features are now unlocked.',
    freeLimit: 'Free plan is limited to 3 scenes.',
    scenesUsed: 'scenes used',
    confirmDelete: 'Are you sure you want to delete this scene?',
    rename: 'Rename',
    duplicate: 'Duplicate',
    open: 'Open',
    delete: 'Delete',
    lastEdited: 'Last edited',
    untitled: 'Untitled scene',
  },
  editor: {
    untitled: 'Untitled',
    saving: 'Saving...',
    saved: 'Saved',
    share: 'Share',
    present: 'Present',
    export: 'Export',
    back: 'Back',
    aiPanel: 'AI Panel',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    fitView: 'Fit to Screen',
    undo: 'Undo',
    redo: 'Redo',
  },
  pricing: {
    title: 'Simple, transparent pricing',
    subtitle: 'No lock-in plans. Cancel anytime.',
    free: 'Free',
    pro: 'Pro',
    freePrice: '$0',
    proPrice: '$12',
    perMonth: '/ month',
    startFree: 'Start for free',
    upgradePro: 'Upgrade to Pro',
    currentPlan: 'Current plan',
    mostPopular: 'Most popular',
    sectionCreate: 'Create',
    sectionCollab: 'Collaborate',
    sectionShare: 'Share',
    sectionTeam: 'Team',
    yes: '✓',
    no: '—',
    limited: 'Limited',
    extended: 'Extended',
    features: {
      infiniteCanvas: 'Infinite canvas',
      fullTools: 'Full editing tools',
      unlimitedScenes: 'Unlimited scenes',
      autoSync: 'Auto sync',
      fastDashboard: 'Fast dashboard',
      generativeAI: 'Generative AI',
      presentations: 'Presentations',
      inviteLink: 'Invite by link',
      viewOnlyMode: 'View-only mode',
      voiceScreen: 'Voice & screen sharing',
      comments: 'Comments',
      livePresentations: 'Live presentations',
      pngSvgJson: 'PNG/SVG/JSON export',
      embedLinks: 'Embed/Readonly links',
      slidePresent: 'Present as slides',
      pdfPptx: 'PDF & PPTX export',
      userAccounts: 'User accounts',
      cloudStorage: 'Cloud storage',
      workspaceTeams: 'Workspace teams',
      userManagement: 'User management',
    },
  },
  sharedView: {
    notFound: 'Scene not found',
    notPublic: 'This scene is not public',
    loading: 'Loading...',
    viewOnly: 'View-only mode',
    openFlaro: 'Open in Flaro',
    poweredBy: 'Powered by Flaro',
  },
  authCallback: {
    processing: 'Processing sign-in...',
  },
  common: {
    error: 'Something went wrong',
    cancel: 'Cancel',
    save: 'Save',
    create: 'Create',
    close: 'Close',
    new: 'New',
  },
  admin: {
    navDashboard:      'Dashboard',
    navUsers:          'Users',
    navSubscriptions:  'Subscriptions',
    navSettings:       'Settings',
    navLogout:         'Log Out',

    loginTitle:        'Admin Panel',
    loginSubtitle:     'Only for admin accounts',
    loginEmail:        'Email Address',
    loginPassword:     'Password',
    loginSubmit:       'Log In',
    loginNotAdmin:     'This account is not an admin',
    loginTooMany:      'Too many attempts. Wait 15 minutes.',

    statsTotal:        'Total Users',
    statsPro:          'Pro Users',
    statsFree:         'Free Users',
    statsNew7d:        'In last 7 days',
    statsScenes:       'Total Scenes',
    statsActiveSubs:   'Active Subscriptions',
    recentUsers:       'Recent Registrations',
    recentActivity:    'Recent Actions',

    usersTitle:        'User Management',
    searchPlaceholder: 'Search email or name...',
    filterAll:         'All',
    filterFree:         'Free',
    filterPro:         'Pro',
    colName:           'Full Name',
    colEmail:          'Email',
    colPlan:           'Plan',
    colScenes:         'Scenes',
    colDate:           'Registration Date',
    colActions:        'Actions',
    editUser:          'Edit User',
    deleteUser:        'Delete User',
    deleteConfirm:     'This operation is irreversible. Do you want to continue?',
    planChanged:       'Plan changed successfully',
    userSaved:         'User details saved',

    subsTitle:         'Subscription Management',
    colStatus:         'Status',
    colStripeId:       'Stripe ID',
    colStart:          'Start Date',
    colEnd:            'End Date',
    statusActive:      'Active',
    statusCanceled:    'Canceled',
    statusPastDue:     'Past Due',
    makeProBtn:        'Make Pro',
    makeFreeBtn:       'Make Free',

    settingsTitle:     'Admin Settings',
    profileSection:    'Profile Information',
    passwordSection:   'Change Password',
    currentPassword:   'Current Password',
    newPassword:       'New Password (min 12 chars)',
    confirmPassword:   'Confirm Password',
    passwordChanged:   'Password changed successfully',
    passwordMismatch:  'New passwords do not match',
    profileSaved:      'Profile details saved successfully',
    sessionSection:    'Session Details',
    lastLogin:         'Last login',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// RUSSIAN  (ru)
// ─────────────────────────────────────────────────────────────────────────────
const ru: Translations = {
  nav: {
    features: 'Возможности',
    pricing: 'Цены',
    login: 'Войти',
    getStarted: 'Начать',
    dashboard: 'Дэшборд',
  },
  landing: {
    badge: 'Профессиональные диаграммы от руки',
    heroTitle1: 'Рисуйте идеи,',
    heroHighlight: 'делитесь',
    heroTitle2: ', работайте вместе',
    heroSubtitle:
      'Flaro — умная платформа для создания диаграмм с эстетикой ручного рисунка и совместной работой в реальном времени.',
    ctaStart: 'Начать бесплатно',
    ctaPricing: 'Цены',
    featuresTitle: 'Всё в одном месте',
    featuresSubtitle: 'Превратите ваши идеи в профессиональные диаграммы с Flaro.',
    feat1Title: 'Эстетика от руки',
    feat1Desc: 'Создавайте диаграммы, выглядящие живо, как нарисованные вручную.',
    feat2Title: 'Совместная работа',
    feat2Desc: 'Работайте с командой одновременно на одном холсте.',
    feat3Title: 'Генеративный AI',
    feat3Desc: 'Создавайте сложные диаграммы из простого текстового описания.',
    feat4Title: 'Облачное хранение',
    feat4Desc: 'Ваша работа автоматически синхронизируется на всех устройствах.',
    ctaSectionTitle: 'Начните рисовать идеи',
    ctaSectionDesc: 'Начните бесплатно, обновляйтесь в любое время.',
    ctaSectionBtn: 'Начать сейчас',
    footerRights: '© 2025 Flaro. Все права защищены.',
  },
  login: {
    signIn: 'Войти',
    signUp: 'Регистрация',
    signInTitle: 'Войдите в аккаунт',
    signUpTitle: 'Создайте аккаунт',
    orSignIn: 'войти в существующий аккаунт',
    orSignUp: 'зарегистрировать новый аккаунт',
    emailPlaceholder: 'Адрес эл. почты',
    passwordPlaceholder: 'Пароль',
    fullNamePlaceholder: 'Имя и фамилия',
    submitSignIn: 'Войти',
    submitSignUp: 'Зарегистрироваться',
    processing: 'Обработка...',
    emailConfirm: 'Проверьте почту — отправлена ссылка для подтверждения!',
  },
  dashboard: {
    myScenes: 'Мои сцены',
    search: 'Поиск...',
    newScene: 'Новая сцена',
    grid: 'Сетка',
    list: 'Список',
    logout: 'Выйти',
    settings: 'Настройки',
    upgrade: 'Перейти на Pro',
    noScenes: 'Сцен пока нет',
    noScenesHint: 'Нажмите «Новая сцена», чтобы начать',
    loading: 'Загрузка...',
    refresh: 'Обновить',
    upgradeSuccess: '🎉 Перешли на Pro! Все функции разблокированы.',
    freeLimit: 'Бесплатный план ограничен 3 сценами.',
    scenesUsed: 'сцен использовано',
    confirmDelete: 'Вы уверены, что хотите удалить эту сцену?',
    rename: 'Переименовать',
    duplicate: 'Дублировать',
    open: 'Открыть',
    delete: 'Удалить',
    lastEdited: 'Последнее изменение',
    untitled: 'Без названия',
  },
  editor: {
    untitled: 'Без названия',
    saving: 'Сохранение...',
    saved: 'Сохранено',
    share: 'Поделиться',
    present: 'Презентация',
    export: 'Экспорт',
    back: 'Назад',
    aiPanel: 'AI Панель',
    zoomIn: 'Увеличить',
    zoomOut: 'Уменьшить',
    fitView: 'По экрану',
    undo: 'Отменить',
    redo: 'Повторить',
  },
  pricing: {
    title: 'Простые, прозрачные цены',
    subtitle: 'Без привязки к плану. Отмена в любое время.',
    free: 'Бесплатно',
    pro: 'Pro',
    freePrice: '$0',
    proPrice: '$12',
    perMonth: '/ мес.',
    startFree: 'Начать бесплатно',
    upgradePro: 'Перейти на Pro',
    currentPlan: 'Текущий план',
    mostPopular: 'Самый популярный',
    sectionCreate: 'Создание',
    sectionCollab: 'Совместная работа',
    sectionShare: 'Экспорт',
    sectionTeam: 'Команда',
    yes: '✓',
    no: '—',
    limited: 'Ограничено',
    extended: 'Расширенно',
    features: {
      infiniteCanvas: 'Бесконечный холст',
      fullTools: 'Полный набор инструментов',
      unlimitedScenes: 'Неограниченные сцены',
      autoSync: 'Автосинхронизация',
      fastDashboard: 'Быстрый дэшборд',
      generativeAI: 'Генеративный AI',
      presentations: 'Презентации',
      inviteLink: 'Приглашение по ссылке',
      viewOnlyMode: 'Режим просмотра',
      voiceScreen: 'Голос и демонстрация экрана',
      comments: 'Комментарии',
      livePresentations: 'Живые презентации',
      pngSvgJson: 'Экспорт PNG/SVG/JSON',
      embedLinks: 'Embed/Readonly ссылки',
      slidePresent: 'Презентация слайдов',
      pdfPptx: 'Экспорт PDF & PPTX',
      userAccounts: 'Аккаунты пользователей',
      cloudStorage: 'Облачное хранение',
      workspaceTeams: 'Рабочие команды',
      userManagement: 'Управление пользователями',
    },
  },
  sharedView: {
    notFound: 'Сцена не найдена',
    notPublic: 'Эта сцена не является публичной',
    loading: 'Загрузка...',
    viewOnly: 'Режим просмотра',
    openFlaro: 'Открыть в Flaro',
    poweredBy: 'Создано с помощью Flaro',
  },
  authCallback: {
    processing: 'Обработка входа...',
  },
  common: {
    error: 'Произошла ошибка',
    cancel: 'Отмена',
    save: 'Сохранить',
    create: 'Создать',
    close: 'Закрыть',
    new: 'Новый',
  },
  admin: {
    navDashboard:      'Панель управления',
    navUsers:          'Пользователи',
    navSubscriptions:  'Подписки',
    navSettings:       'Настройки',
    navLogout:         'Выйти',

    loginTitle:        'Панель администратора',
    loginSubtitle:     'Только для учетных записей администратора',
    loginEmail:        'Адрес электронной почты',
    loginPassword:     'Пароль',
    loginSubmit:       'Войти',
    loginNotAdmin:     'Этот аккаунт не является администратором',
    loginTooMany:      'Слишком много попыток. Подождите 15 минут.',

    statsTotal:        'Всего пользователей',
    statsPro:          'Пользователи Pro',
    statsFree:         'Бесплатные пользователи',
    statsNew7d:        'За последние 7 дней',
    statsScenes:       'Всего сцен',
    statsActiveSubs:   'Активные подписки',
    recentUsers:       'Последние регистрации',
    recentActivity:    'Последние действия',

    usersTitle:        'Управление пользователями',
    searchPlaceholder: 'Поиск по email или имени...',
    filterAll:         'Все',
    filterFree:         'Бесплатные',
    filterPro:         'Pro',
    colName:           'Имя Фамилия',
    colEmail:          'Email',
    colPlan:           'План',
    colScenes:         'Сцены',
    colDate:           'Дата регистрации',
    colActions:        'Действия',
    editUser:          'Редактировать пользователя',
    deleteUser:        'Удалить пользователя',
    deleteConfirm:     'Это действие необратимо. Хотите продолжить?',
    planChanged:       'План успешно изменен',
    userSaved:         'Данные пользователя сохранены',

    subsTitle:         'Управление подписками',
    colStatus:         'Status',
    colStripeId:       'Stripe ID',
    colStart:          'Дата начала',
    colEnd:            'Дата окончания',
    statusActive:      'Активна',
    statusCanceled:    'Отменена',
    statusPastDue:     'Просрочена',
    makeProBtn:        'Сделать Pro',
    makeFreeBtn:       'Сделать Free',

    settingsTitle:     'Настройки администратора',
    profileSection:    'Информация профиля',
    passwordSection:   'Изменить пароль',
    currentPassword:   'Текущий пароль',
    newPassword:       'Новый пароль (минимум 12 символов)',
    confirmPassword:   'Подтвердите пароль',
    passwordChanged:   'Пароль успешно изменен',
    passwordMismatch:  'Новые пароли не совпадают',
    profileSaved:      'Данные профиля успешно сохранены',
    sessionSection:    'Информация о сеансе',
    lastLogin:         'Последний вход',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// TURKISH  (tr)
// ─────────────────────────────────────────────────────────────────────────────
const tr: Translations = {
  nav: {
    features: 'Özellikler',
    pricing: 'Fiyatlar',
    login: 'Giriş Yap',
    getStarted: 'Başla',
    dashboard: 'Panel',
  },
  landing: {
    badge: 'El çizimi estetiğiyle profesyonel diyagramlar',
    heroTitle1: 'Fikirleri',
    heroHighlight: 'çiz',
    heroTitle2: ', paylaş, birlikte çalış',
    heroSubtitle:
      'Flaro — el çizimi estetiğine ve gerçek zamanlı iş birliğine sahip akıllı bir diyagram platformu.',
    ctaStart: 'Ücretsiz başla',
    ctaPricing: 'Fiyatlar',
    featuresTitle: 'Her şey bir arada',
    featuresSubtitle: 'Flaro ile fikirlerinizi profesyonel diyagramlara dönüştürün.',
    feat1Title: 'El çizimi estetiği',
    feat1Desc: 'El ile çizilmiş gibi görünen, canlı diyagramlar oluşturun.',
    feat2Title: 'Gerçek zamanlı iş birliği',
    feat2Desc: 'Ekibinizle aynı anda, aynı tuval üzerinde çalışın.',
    feat3Title: 'Üretken AI',
    feat3Desc: 'Basit metinle karmaşık diyagramlar oluşturun.',
    feat4Title: 'Bulut depolama',
    feat4Desc: 'Çalışmalarınız tüm cihazlarda otomatik eşitlenir.',
    ctaSectionTitle: 'Fikirlerinizi çizmeye başlayın',
    ctaSectionDesc: 'Ücretsiz başlayın, istediğiniz zaman yükseltin.',
    ctaSectionBtn: 'Hemen başla',
    footerRights: '© 2025 Flaro. Tüm hakları saklıdır.',
  },
  login: {
    signIn: 'Giriş Yap',
    signUp: 'Kayıt Ol',
    signInTitle: 'Hesabınıza giriş yapın',
    signUpTitle: 'Yeni hesap oluşturun',
    orSignIn: 'mevcut hesaba giriş yap',
    orSignUp: 'yeni hesap oluştur',
    emailPlaceholder: 'E-posta adresi',
    passwordPlaceholder: 'Şifre',
    fullNamePlaceholder: 'Ad Soyad',
    submitSignIn: 'Giriş Yap',
    submitSignUp: 'Kayıt Ol',
    processing: 'İşleniyor...',
    emailConfirm: 'E-postanızı kontrol edin — onay linki gönderildi!',
  },
  dashboard: {
    myScenes: 'Sahnelerim',
    search: 'Ara...',
    newScene: 'Yeni Sahne',
    grid: 'Izgara',
    list: 'Liste',
    logout: 'Çıkış Yap',
    settings: 'Ayarlar',
    upgrade: "Pro'ya Geç",
    noScenes: 'Henüz sahne yok',
    noScenesHint: 'Başlamak için "Yeni Sahne"ye tıklayın',
    loading: 'Yükleniyor...',
    refresh: 'Yenile',
    upgradeSuccess: "🎉 Pro'ya geçtiniz! Tüm özellikler açık.",
    freeLimit: 'Ücretsiz plan 3 sahne ile sınırlıdır.',
    scenesUsed: 'sahne kullanıldı',
    confirmDelete: 'Bu sahneyi silmek istediğinizden emin misiniz?',
    rename: 'Yeniden Adlandır',
    duplicate: 'Kopyala',
    open: 'Aç',
    delete: 'Sil',
    lastEdited: 'Son düzenleme',
    untitled: 'Adsız sahne',
  },
  editor: {
    untitled: 'Adsız',
    saving: 'Kaydediliyor...',
    saved: 'Kaydedildi',
    share: 'Paylaş',
    present: 'Sunum Yap',
    export: 'Dışa Aktar',
    back: 'Geri',
    aiPanel: 'AI Panel',
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    fitView: 'Ekrana Sığdır',
    undo: 'Geri Al',
    redo: 'Yeniden Yap',
  },
  pricing: {
    title: 'Basit, şeffaf fiyatlar',
    subtitle: 'Bağlayıcı plan yok. İstediğiniz zaman iptal edin.',
    free: 'Ücretsiz',
    pro: 'Pro',
    freePrice: '$0',
    proPrice: '$12',
    perMonth: '/ ay',
    startFree: 'Ücretsiz başla',
    upgradePro: "Pro'ya geç",
    currentPlan: 'Mevcut plan',
    mostPopular: 'En popüler',
    sectionCreate: 'Oluştur',
    sectionCollab: 'İş Birliği',
    sectionShare: 'Paylaş',
    sectionTeam: 'Ekip',
    yes: '✓',
    no: '—',
    limited: 'Sınırlı',
    extended: 'Genişletilmiş',
    features: {
      infiniteCanvas: 'Sonsuz tuval',
      fullTools: 'Tam düzenleme araçları',
      unlimitedScenes: 'Sınırsız sahne',
      autoSync: 'Otomatik eşitleme',
      fastDashboard: 'Hızlı panel',
      generativeAI: 'Üretken AI',
      presentations: 'Sunumlar',
      inviteLink: 'Bağlantıyla davet',
      viewOnlyMode: 'Yalnızca görüntüleme modu',
      voiceScreen: 'Ses & ekran paylaşımı',
      comments: 'Yorumlar',
      livePresentations: 'Canlı sunumlar',
      pngSvgJson: 'PNG/SVG/JSON dışa aktarma',
      embedLinks: 'Embed/Readonly bağlantılar',
      slidePresent: 'Slayt olarak sun',
      pdfPptx: 'PDF & PPTX dışa aktarma',
      userAccounts: 'Kullanıcı hesapları',
      cloudStorage: 'Bulut depolama',
      workspaceTeams: 'Çalışma alanı ekipleri',
      userManagement: 'Kullanıcı yönetimi',
    },
  },
  sharedView: {
    notFound: 'Sahne bulunamadı',
    notPublic: 'Bu sahne herkese açık değil',
    loading: 'Yükleniyor...',
    viewOnly: 'Yalnızca görüntüleme modu',
    openFlaro: "Flaro'da aç",
    poweredBy: 'Flaro tarafından oluşturuldu',
  },
  authCallback: {
    processing: 'Giriş işleniyor...',
  },
  common: {
    error: 'Bir şeyler ters gitti',
    cancel: 'İptal',
    save: 'Kaydet',
    create: 'Oluştur',
    close: 'Kapat',
    new: 'Yeni',
  },
  admin: {
    navDashboard:      'Panel',
    navUsers:          'Kullanıcılar',
    navSubscriptions:  'Abonelikler',
    navSettings:       'Ayarlar',
    navLogout:         'Çıkış Yap',

    loginTitle:        'Admin Paneli',
    loginSubtitle:     'Sadece yönetici hesapları için',
    loginEmail:        'E-posta Adresi',
    loginPassword:     'Şifre',
    loginSubmit:       'Giriş Yap',
    loginNotAdmin:     'Bu hesap yönetici değil',
    loginTooMany:      'Çok fazla deneme. 15 dakika bekleyin.',

    statsTotal:        'Toplam Kullanıcı',
    statsPro:          'Pro Kullanıcı',
    statsFree:         'Ücretsiz Kullanıcı',
    statsNew7d:        'Son 7 günde',
    statsScenes:       'Toplam Sahne',
    statsActiveSubs:   'Aktif Abonelikler',
    recentUsers:       'Son Üyelikler',
    recentActivity:    'Son İşlemler',

    usersTitle:        'Kullanıcı Yönetimi',
    searchPlaceholder: 'E-posta veya ad ara...',
    filterAll:         'Tümü',
    filterFree:         'Ücretsiz',
    filterPro:         'Pro',
    colName:           'Ad Soyad',
    colEmail:          'E-posta',
    colPlan:           'Plan',
    colScenes:         'Sahneler',
    colDate:           'Kayıt Tarihi',
    colActions:        'İşlemler',
    editUser:          'Kullanıcıyı Düzenle',
    deleteUser:        'Kullanıcıyı Sil',
    deleteConfirm:     'Bu işlem geri alınamaz. Devam etmek istiyor musunuz?',
    planChanged:       'Plan başarıyla değiştirildi',
    userSaved:         'Kullanıcı bilgileri kaydedildi',

    subsTitle:         'Abonelik Yönetimi',
    colStatus:         'Durum',
    colStripeId:       'Stripe ID',
    colStart:          'Başlangıç Tarihi',
    colEnd:            'Bitiş Tarihi',
    statusActive:      'Aktif',
    statusCanceled:    'İptal Edildi',
    statusPastDue:     'Gecikmiş',
    makeProBtn:        'Pro Yap',
    makeFreeBtn:       'Ücretsiz Yap',

    settingsTitle:     'Yönetici Ayarları',
    profileSection:    'Profil Bilgileri',
    passwordSection:   'Şifre Değiştir',
    currentPassword:   'Mevcut Şifre',
    newPassword:       'Yeni Şifre (min 12 karakter)',
    confirmPassword:   'Şifre Tekrarı',
    passwordChanged:   'Şifre başarıyla değiştirildi',
    passwordMismatch:  'Yeni şifreler eşleşmiyor',
    profileSaved:      'Profil bilgileri başarıyla kaydedildi',
    sessionSection:    'Oturum Bilgileri',
    lastLogin:         'Son giriş',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────
export const translations: Record<Locale, Translations> = { az, en, ru, tr }
