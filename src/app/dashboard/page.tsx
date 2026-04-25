import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function Dashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <span className="text-sm text-muted-foreground">{session.user.name}</span>
      </div>
      <Link
        href="/game"
        className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted transition-colors"
      >
        <div>
          <p className="font-medium">N-back Multiplayer</p>
          <p className="text-sm text-muted-foreground">
            Play competitive N-back with friends
          </p>
        </div>
        <span className="text-muted-foreground">→</span>
      </Link>
    </div>
  );
}
