import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import { Icon } from "@/components/icons";
import { formatDate, getDictionary, getLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await auth();
  const name = session?.user?.name || "مدیر ارشد سامانه";
  const role = session?.user?.role || "super_admin";

  const locale = await getLocale();
  const dict = getDictionary(locale);

  const stats = [
    {
      title: "دوره‌های فعال و تخصصی",
      value: "۱۲",
      unit: "دوره آموزشی",
      trend: "+۲ دوره این ترم",
      trendPositive: true,
      icon: <Icon.BookOpen className="h-6 w-6" />,
      accent: "from-emerald-500 to-teal-700",
      bgLight: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    },
    {
      title: "دانش‌پژوهان ثبت‌نام‌شده",
      value: "۱۴۸",
      unit: "فراگیر فعال",
      trend: "رشد ۲۴٪ در ماه جاری",
      trendPositive: true,
      icon: <Icon.Users className="h-6 w-6" />,
      accent: "from-sky-500 to-blue-700",
      bgLight: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400",
    },
    {
      title: "ساعات آموزش تعاملی",
      value: "۵۴۰",
      unit: "ساعت محتوا",
      trend: "شاخص رضایت ۹۸٪",
      trendPositive: true,
      icon: <Icon.Clock className="h-6 w-6" />,
      accent: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    },
    {
      title: "گواهی‌های معتبر صادره",
      value: "۶۲",
      unit: "مدرک تاییدشده",
      trend: "دارای هش رمزنگاری‌شده",
      trendPositive: true,
      icon: <Icon.CheckCircle className="h-6 w-6" />,
      accent: "from-violet-500 to-purple-700",
      bgLight: "bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400",
    },
  ];

  const featuredCourses = [
    {
      id: "course-fiqh-101",
      title: "دوره جامع فقه و احکام کاربردی زندگی",
      instructor: "حجةالاسلام دکتر محسنی",
      instructorRole: "استاد حوزه و دانشگاه",
      category: "فقه و معارف اسلامی",
      level: "مقدماتی تا تکمیلی",
      duration: "۱۲ جلسه · ۲۴ ساعت",
      studentsCount: "۶۸ فراگیر",
      rating: "۴.۹",
      image: "/images/course_cover_fiqh_1790957819642.jpg",
      progress: 75,
      status: "درحال برگزاری",
    },
    {
      id: "course-ethics-201",
      title: "مبانی اخلاق، فلسفه و تربیت اسلامی در خانواده",
      instructor: "دکتر فاطمه علوی",
      instructorRole: "پژوهشگر مطالعات خانواده",
      category: "اخلاق و تربیت",
      level: "عمومی و تخصصی",
      duration: "۸ جلسه · ۱۶ ساعت",
      studentsCount: "۵۴ فراگیر",
      rating: "۴.۸",
      image: "/images/course_cover_ethics_1790957831132.jpg",
      progress: 30,
      status: "ظرفیت محدود",
    },
    {
      id: "course-quran-301",
      title: "تدبر در سوره مبارکه واقعه و مفاهیم معرفتی",
      instructor: "استاد سیدرضا موسوی",
      instructorRole: "قاری و مفسر قرآن کریم",
      category: "قرآن و عترت",
      level: "تخصصی مربیان",
      duration: "۱۰ جلسه · ۲۰ ساعت",
      studentsCount: "۴۲ فراگیر",
      rating: "۵.۰",
      image: "/images/dashboard_hero_learning_1790957806674.jpg",
      progress: 0,
      status: "شروع از هفته آینده",
    },
  ];

  const weeklySchedule = [
    {
      day: "شنبه · ساعت ۱۶:۰۰",
      title: "جلسه برخط: احکام خمس و زکات در کسب‌وکار نوین",
      instructor: "حجةالاسلام محسنی",
      type: "کلاس آنلاین",
      activeNow: false,
    },
    {
      day: "دوشنبه · ساعت ۱۸:۳۰",
      title: "کارگاه تعاملی: شیوه‌های نهادینه‌سازی حیا و عفت در نسل نو",
      instructor: "دکتر علوی",
      type: "وبینار تخصصی",
      activeNow: true,
    },
    {
      day: "چهارشنبه · ساعت ۱۷:۰۰",
      title: "حلقه تدبر و گفت‌وگوی تفسیری آیات منتخب",
      instructor: "استاد موسوی",
      type: "مباحثه گروهی",
      activeNow: false,
    },
  ];

  const recentCertificates = [
    {
      id: "CERT-1001-9821",
      name: "حسین ابراهیمی",
      course: "دوره مقدماتی فقه (دمو)",
      date: "امروز، ۱۱:۳۰",
      hash: "4f8a9b2c...8e9f0a",
    },
    {
      id: "CERT-1001-7743",
      name: "زهرا سادات حسینی",
      course: "تربیت اسلامی در بستر خانواده",
      date: "دیروز، ۱۶:۴۵",
      hash: "7a1b3c5e...2d4f6a",
    },
    {
      id: "CERT-1001-5519",
      name: "محمدامین کاظمی",
      course: "فقه و معاملات اقتصادی",
      date: "۳ روز پیش",
      hash: "9c0d2e4f...1a3b5c",
    },
  ];

  return (
    <AppShell user={{ name, role }}>
      {/* ── 1. Hero Welcome Banner ───────────────────────────────── */}
      <section className="relative mb-10 overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-xl dark:border-slate-800">
        <Image
          src="/images/dashboard_hero_learning_1790957806674.jpg"
          alt="فضای یادگیری و معرفت سامانه رویش"
          fill
          priority
          sizes="(max-width: 1200px) 100vw, 1200px"
          className="object-cover object-center opacity-30 mix-blend-luminosity brightness-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-emerald-950/40" />

        <div className="relative z-10 p-6 sm:p-10 lg:p-12">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {formatDate(locale, new Date(), {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="text-emerald-400/60">·</span>
                <span>مرکز فرهنگی تربیتی رویش</span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl lg:text-4xl text-balance">
                {dict.dashboard.greeting} {name}
              </h1>

              <p className="text-sm leading-relaxed text-slate-300 sm:text-base text-balance font-light">
                به سامانه هوشمند مدیریت آموزش و محتوای فرهنگی تربیتی رویش خوش آمدید.
                در این بخش می‌توانید دوره‌ها، روند پیشرفت دانش‌پژوهان و مدارک صادره را مدیریت و پایش نمایید.
              </p>

              {/* Quranic Inscription */}
              <div className="pt-2">
                <blockquote className="border-s-2 border-emerald-400/80 ps-4 text-xs font-serif italic text-emerald-200/90 sm:text-sm">
                  «رَبِّ زِدْنِي عِلْمًا وَأَلْحِقْنِي بِالصَّالِحِينَ»
                  <span className="block mt-0.5 text-[11px] not-italic font-sans text-slate-400">
                    پروردگارا، بر دانش من بیفزای و مرا به شایستگان ملحق فرما.
                  </span>
                </blockquote>
              </div>
            </div>

            {/* Quick CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/courses"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <Icon.BookOpen className="h-5 w-5" />
                <span>مشاهده دوره‌ها</span>
              </Link>

              <Link
                href="/verify"
                className="flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 hover:-translate-y-0.5"
              >
                <Icon.CheckCircle className="h-5 w-5 text-emerald-400" />
                <span>استعلام مدارک</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Performance Stats Grid ────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            <span>شاخص‌های کلیدی عملکرد مرکز</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            به‌روزرسانی لحظه‌ای · ترم جاری
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-l ${item.accent} opacity-80 transition-opacity group-hover:opacity-100`}
                aria-hidden="true"
              />
              <div className="flex items-start justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.bgLight} transition-transform duration-300 group-hover:scale-110 shadow-2xs`}>
                  {item.icon}
                </div>
                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {item.trend}
                </span>
              </div>

              <div className="mt-5">
                <div className="text-3xl font-black tracking-tight text-slate-900 dark:text-white tabular-nums">
                  {item.value}
                </div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.unit}
                </div>
                <div className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                  {item.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Active Learning In-Progress Box ────────────────────── */}
      <section className="mb-12">
        <div className="rounded-3xl border border-emerald-600/30 bg-gradient-to-br from-emerald-900/90 via-emerald-950 to-slate-950 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>درس در حال یادگیری فعال شما</span>
                <span>·</span>
                <span>دوره مقدماتی فقه (دمو)</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                درس ۴ — احکام روزه و شرایط صحت در سفر
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-light leading-relaxed">
                مباحث مربوط به نیت، مبطلات و احکام روزه‌دار مسافر. مدت زمان باقی‌مانده: ۸ دقیقه.
              </p>

              {/* Progress bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs font-medium text-emerald-200 mb-1.5">
                  <span>میزان پیشرفت جلسه</span>
                  <span className="tabular-nums font-bold">۷۵٪ تکمیل شده</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-emerald-950/80 border border-emerald-500/30 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500" style={{ width: "75%" }} />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/courses"
                className="flex items-center gap-2 rounded-2xl bg-white px-6 py-4 text-sm font-black text-emerald-950 shadow-md transition-all hover:bg-emerald-50 hover:scale-105 active:scale-100"
              >
                <span>▶ ادامه پخش و یادگیری</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Featured Courses Grid ─────────────────────────────── */}
      <section className="mb-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Icon.Sparkles className="h-6 w-6 text-emerald-600" />
              <span>دوره‌ها و کارگاه‌های برگزیده مرکز</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              دوره‌های جامع طراحی‌شده برای ارتقای دانش فردی، خانوادگی و تربیتی
            </p>
          </div>
          <Link
            href="/courses"
            className="text-xs font-bold text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
          >
            مشاهده همه دوره‌ها ←
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredCourses.map((course) => (
            <div
              key={course.id}
              className="group flex flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              {/* Cover Image */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                <Image
                  src={course.image}
                  alt={course.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-xs text-white">
                  <span className="font-semibold bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    {course.category}
                  </span>
                  <span className="font-mono text-amber-300 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-lg">
                    ★ {course.rating}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-800 dark:text-white dark:group-hover:text-emerald-400">
                  {course.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                    {course.instructor.slice(0, 1)}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{course.instructor}</span>
                    <span className="block text-[11px] text-slate-400">{course.instructorRole}</span>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                  <span>{course.duration}</span>
                  <span>·</span>
                  <span>{course.studentsCount}</span>
                </div>

                <div className="mt-5 pt-1">
                  <Link
                    href="/courses"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 text-xs font-bold text-slate-800 transition-colors hover:bg-emerald-700 hover:text-white dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-emerald-600"
                  >
                    <span>ورود به دوره و جلسات</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Schedule & Daily Wisdom ───────────────────────────── */}
      <div className="mb-12 grid gap-8 lg:grid-cols-2">
        {/* Weekly Live Timetable */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Icon.Calendar className="h-5 w-5 text-emerald-600" />
              <span>برنامه کلاس‌ها و وبینارهای هفتگی</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              سامانه ارتباط زنده
            </span>
          </div>

          <div className="space-y-3.5">
            {weeklySchedule.map((item, index) => (
              <div
                key={index}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl p-4 transition-all ${
                  item.activeNow
                    ? "border-2 border-emerald-500 bg-emerald-50/70 dark:border-emerald-500 dark:bg-emerald-950/40 shadow-sm"
                    : "border border-slate-100 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-800/40"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <span>{item.day}</span>
                    <span>·</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{item.type}</span>
                    {item.activeNow ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                        ● هم‌اکنون آنلاین
                      </span>
                    ) : null}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    مدرس: {item.instructor}
                  </p>
                </div>

                <button
                  type="button"
                  className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                    item.activeNow
                      ? "bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm hover:scale-105"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {item.activeNow ? "ورود به اتاق زنده" : "یادآوری و جزئیات"}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Daily Wisdom & Contemplation */}
        <section className="flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                <Icon.Sparkles className="h-5 w-5 text-amber-500" />
                <span>کلام نورانی و حکمت روز</span>
              </h2>
              <span className="text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
                نهج‌البلاغه · حکمت ۱۴۷
              </span>
            </div>

            <blockquote className="my-5 rounded-2xl border-s-4 border-emerald-600 bg-emerald-50/40 p-5 dark:border-emerald-500 dark:bg-emerald-950/20">
              <p className="text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-200">
                «النَّاسُ ثَلَاثَةٌ: فَعَالِمٌ رَبَّانِيٌّ، وَمُتَعَلِّمٌ عَلَى سَبِيلِ نَجَاةٍ، وَهَمَجٌ رَعَاعٌ أَتْبَاعُ كُلِّ نَاعِقٍ»
              </p>
              <footer className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-400 font-light">
                مردم سه دسته‌اند: دانشمند خداشناس، دانش‌پژوهی که در راه رستگاری گام برمی‌دارد، و فرومایگانی سرگردان که پیرو هر بانگی می‌شوند.
              </footer>
            </blockquote>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/80 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <span>برنامه ترویج معرفت و اخلاق اسلامی</span>
              <span className="block font-bold text-slate-800 dark:text-slate-200 mt-0.5">مرکز رویش — شعبه ۱۰۱</span>
            </div>
            <Link
              href="/courses"
              className="rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              مجموعه حکمت‌ها
            </Link>
          </div>
        </section>
      </div>

      {/* ── 6. Certificate Verification Live Feed ────────────────── */}
      <section className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Icon.CheckCircle className="h-5 w-5 text-emerald-600" />
              <span>آخرین مدارک و گواهی‌های صادرشده با هش معتبر</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              امکان استعلام آنلاین صحت تمامی گواهی‌ها از طریق شناسه هش یکتا
            </p>
          </div>
          <Link
            href="/verify"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            سامانه استعلام مدارک ←
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800 dark:text-slate-500">
                <th className="pb-3 text-start font-bold">شناسه گواهی</th>
                <th className="pb-3 text-start font-bold">نام و نام خانوادگی</th>
                <th className="pb-3 text-start font-bold">عنوان دوره تکمیل‌شده</th>
                <th className="pb-3 text-start font-bold">تاریخ صدور</th>
                <th className="pb-3 text-start font-bold">هش رمزنگاری</th>
                <th className="pb-3 text-end font-bold">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentCertificates.map((cert) => (
                <tr key={cert.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                    {cert.id}
                  </td>
                  <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {cert.name}
                  </td>
                  <td className="py-3.5 text-slate-600 dark:text-slate-300">
                    {cert.course}
                  </td>
                  <td className="py-3.5 text-slate-500 dark:text-slate-400">
                    {cert.date}
                  </td>
                  <td className="py-3.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                    {cert.hash}
                  </td>
                  <td className="py-3.5 text-end">
                    <Link
                      href="/verify"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 hover:underline"
                    >
                      <span>مشاهده و اصالت‌سنجی</span>
                      <span>↗</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
