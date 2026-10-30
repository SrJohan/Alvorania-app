import { Suspense } from "react";
import { PostEditor } from "@/components/blog/post-editor";
import { Skeleton } from "@/components/ui/display";

// El editor lee el id de la URL en el cliente; con Cache Components eso tiene que ir dentro de <Suspense>.
export default function BlogPostEditorPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-5xl space-y-4 p-4 md:p-8" aria-busy="true"><Skeleton className="h-10 w-64" /><Skeleton className="h-96 w-full" /></div>}>
      <PostEditor />
    </Suspense>
  );
}
