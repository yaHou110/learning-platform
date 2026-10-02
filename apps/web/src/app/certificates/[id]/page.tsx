import Link from "next/link";
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { catalog, credentials, learning, identity } from "@learning-platform/core/api";
import AppShell from "@/components/AppShell";
import CertificateActions from "./CertificateActions";
import { formatDate, getLocale } from "@/lib/i18n";
import type { Certificate } from "@learning-platform/core/api";

export const dynamic = "force-dynamic";

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const locale = await getLocale();
  const { id: paramId } = await params;
  const { tenantId, id: userId, role } = session.user;

  // Check if paramId is a certificate ID or enrollment ID
  let cert: Certificate | null = await credentials.getCertificate(paramId);
  let enrollmentId = cert?.enrollmentId ?? paramId;

  if (!cert) {
    cert = await credentials.getCertificateByEnrollment(enrollmentId);
  }

  // If no certificate exists yet, check if the enrollment is completed and issue it
  if (!cert) {
    const enrollments = await learning.listEnrollments(tenantId, { userId });
    const enrollment = enrollments.find((e) => e.id === enrollmentId || e.courseId === enrollmentId);
    if (!enrollment) {
      // Check if user is admin
      if (role === "super_admin" || role === "center_admin") {
        const allEnrollments = await learning.listEnrollments(tenantId);
        const anyEnrollment = allEnrollments.find((e) => e.id === enrollmentId);
        if (anyEnrollment && anyEnrollment.status === "completed") {
          const issued = await credentials.issueCertificate(anyEnrollment.id);
          cert = await credentials.getCertificate(issued.id);
          enrollmentId = anyEnrollment.id;
        }
      }
      if (!cert) notFound();
    } else {
      enrollmentId = enrollment.id;
      // Auto-issue if completed
      if (enrollment.status === "completed") {
        const issued = await credentials.issueCertificate(enrollment.id);
        cert = await credentials.getCertificate(issued.id);
      } else {
        // Not completed yet
        notFound();
      }
    }
  }

  if (!cert) notFound();

  // Load course and student details
  const course = await catalog.getCourse(tenantId, cert.courseId, { includeNonPublished: true });
  const student = (await identity.getUserById(tenantId, cert.userId)) ?? {
    displayName: session.user.name,
    nationalId: "۱۲۳۴۵۶۷۸۹۱",
  };

  const verifyUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/verify?hash=${encodeURIComponent(cert.certificateHash)}`;
  const issueDateStr = formatDate(locale, cert.issueDate, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <AppShell user={{ name: session.user.name, role }}>
      <div className="print:hidden mb-4">
        <Link
          href={`/courses/${cert.courseId}`}
          className="text-sm font-medium text-emerald-700 hover:underline inline-flex items-center gap-1.5"
        >
          <span className="rtl:rotate-180">←</span>
          <span>بازگشت به صفحه دوره</span>
        </Link>
      </div>

      {/* Main Certificate Display Canvas */}
      <div className="mx-auto max-w-4xl">
        <div
          id="certificate-print-area"
          className="relative overflow-hidden rounded-3xl border-8 border-double border-amber-600/70 bg-gradient-to-b from-amber-50/70 via-white to-emerald-50/40 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 p-8 sm:p-12 shadow-xl print:shadow-none print:border-8 print:m-0"
        >
          {/* Ornamental corner accents */}
          <div className="absolute top-3 start-3 text-amber-600/40 text-2xl select-none" aria-hidden="true">
            ❖
          </div>
          <div className="absolute top-3 end-3 text-amber-600/40 text-2xl select-none" aria-hidden="true">
            ❖
          </div>
          <div className="absolute bottom-3 start-3 text-amber-600/40 text-2xl select-none" aria-hidden="true">
            ❖
          </div>
          <div className="absolute bottom-3 end-3 text-amber-600/40 text-2xl select-none" aria-hidden="true">
            ❖
          </div>

          {/* Basmalah */}
          <div className="text-center">
            <p className="font-serif text-lg sm:text-xl font-semibold text-emerald-900 dark:text-emerald-300 tracking-wider">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <div className="mx-auto mt-2 h-0.5 w-24 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
          </div>

          {/* Institution Header */}
          <div className="mt-6 text-center">
            <span className="inline-block rounded-full bg-emerald-100 dark:bg-emerald-950 px-3.5 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              مرکز فرهنگی تربیتی رویش
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              گواهی‌نامه رسمی پایان دوره آموزشی
            </h1>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              پلتفرم جامع آموزش معارف و دروس حوزوی
            </p>
          </div>

          {/* Certificate Body */}
          <div className="mt-8 sm:mt-10 text-center leading-loose">
            <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300">
              بدین‌وسیله گواهی می‌شود دانش‌پژوه گرامی
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-400">
              {student.displayName}
            </p>
            {student.nationalId ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                کد ملی: <span className="font-mono font-semibold">{student.nationalId}</span>
              </p>
            ) : null}

            <p className="mt-6 text-base sm:text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
              با عنایت پروردگار متعال و تلاش شایسته علمی، دوره آموزشی
            </p>

            <div className="mt-3 inline-block rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 px-6 py-2.5">
              <span className="text-lg sm:text-xl font-bold text-gray-950 dark:text-gray-100">
                « {course?.title ?? "دوره تخصصی"} »
              </span>
            </div>

            <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
              را با موفقیت و احراز شرایط علمی و آموزشی به پایان رسانده و این مدرک به عنوان گواه معتبر پایان دوره به ایشان اعطا می‌گردد.
            </p>
          </div>

          {/* Signatures & Seal */}
          <div className="mt-12 pt-8 border-t border-dashed border-gray-300 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-start">
              <div className="text-xs text-gray-500 dark:text-gray-400">تاریخ صدور:</div>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5">{issueDateStr}</div>
              <div className="text-[11px] text-gray-400 mt-1">
                شماره مدرک: <span className="font-mono">{cert.id.slice(0, 18)}</span>
              </div>
            </div>

            {/* Emblem Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-double border-amber-600 bg-amber-50 dark:bg-gray-800 text-amber-700 dark:text-amber-400 shadow-inner">
                <div className="text-center">
                  <div className="text-xs font-black">ممهور شد</div>
                  <div className="text-[9px] font-medium text-emerald-800 dark:text-emerald-400">مرکز رویش</div>
                </div>
              </div>
              <span className="mt-1 text-[10px] text-gray-400">مهر دیجیتال مرکز</span>
            </div>

            <div className="text-center sm:text-end">
              <div className="text-xs text-gray-500 dark:text-gray-400">وضعیت اعتبار:</div>
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-0.5">
                <span>✓</span>
                <span>دارای اصالت و فعال</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-1 max-w-[200px] truncate font-mono">
                هش: {cert.certificateHash.slice(0, 16)}...
              </div>
            </div>
          </div>
        </div>

        {/* Client Print & Share Actions */}
        <CertificateActions verifyUrl={verifyUrl} hash={cert.certificateHash} />
      </div>
    </AppShell>
  );
}
