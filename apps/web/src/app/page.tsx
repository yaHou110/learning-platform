import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<JSX.Element> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <main dir="rtl" lang="fa" className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-2xl font-bold">پلتفرم یادگیری خانواده حوزوی</h1>
      <p className="text-sm text-gray-600">
        خوش آمدید، {session.user.name} ({session.user.role})
      </p>
      <p className="mt-4 text-sm text-gray-500">
        این صفحه placeholder است. داشبورد واقعی در جلسات بعدی اضافه می‌شود.
      </p>
    </main>
  );
}
