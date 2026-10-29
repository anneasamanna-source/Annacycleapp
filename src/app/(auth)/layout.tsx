import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 py-6">
      <Link href="/" aria-label="ANNA CYCLE">
        <Logo />
      </Link>
      <main id="main" className="flex flex-1 items-center py-10">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
