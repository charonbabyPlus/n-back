import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SoloGame } from "@/components/game/SoloGame";
import { generateSequence } from "@/game/sequence";
import { Button } from "@/components/ui/button";

export default async function SoloPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const sequence = generateSequence(20, 2);

  return (
    <div className="flex flex-col min-h-screen py-8 px-4">
      <div className="w-full max-w-2xl mx-auto flex items-center">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard">← Back</Link>
        </Button>
      </div>
      <div className="flex flex-col items-center flex-1">
        <h1 className="text-xl font-bold mb-6">Solo Practice</h1>
        <SoloGame initialSequence={sequence} />
      </div>
    </div>
  );
}
