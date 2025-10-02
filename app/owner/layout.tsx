// app/owner/layout.tsx (server)
import { currentUser } from "@clerk/nextjs/server";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  const enforce = process.env.ENFORCE_OWNER === "true";
//   if (enforce && user?.publicMetadata?.platformRole !== "owner") {
//     return <div className="p-6">Forbidden</div>;
//   }
  return <>{children}</>;
}
