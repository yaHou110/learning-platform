"use server";

import { auth, signOut } from "@/auth";
import { learning } from "@learning-platform/core/api";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

export async function enrollCourseAction(courseId: string): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  await learning.enroll(session.user.tenantId, session.user.id, courseId);
  revalidatePath("/courses");
}
