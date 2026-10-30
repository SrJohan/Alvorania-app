import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DirectionalTransition } from "@/components/site/directional-transition";
import { PostArticle } from "@/components/blog/post-article";
import { Skeleton } from "@/components/ui/display";
import { effectiveStyle } from "@/lib/blog";
import { globalStyle, publishedPost, publishedPosts } from "@/server/blog-read";

// Con Cache Components hace falta al menos un parámetro: sin posts, uno de relleno que acaba en 404.
// Los posts publicados después se generan al primer acceso y quedan en caché.
export async function generateStaticParams() {
  const slugs = (await publishedPosts()).map((p) => ({ slug: p.slug }));
  return slugs.length ? slugs : [{ slug: "__sin-posts__" }];
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const post = await publishedPost((await params).slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    openGraph: { type: "article", title: post.title, description: post.excerpt || undefined, publishedTime: post.publishedAt ?? undefined, images: post.coverUrl ? [post.coverUrl] : undefined },
  };
}

async function Post({ params }: { params: PageProps<"/blog/[slug]">["params"] }) {
  const [post, global] = await Promise.all([params.then((p) => publishedPost(p.slug)), globalStyle()]);
  if (!post) notFound();
  return <PostArticle post={post} style={effectiveStyle(post.style, global)} />;
}

export default function BlogPostPage({ params }: PageProps<"/blog/[slug]">) {
  return (
    <DirectionalTransition>
    <Suspense fallback={<div className="mx-auto max-w-content space-y-6 px-4 pt-12" aria-busy="true"><Skeleton className="h-6 w-40" /><Skeleton className="h-24 w-full max-w-2xl" /><Skeleton className="h-80 w-full" /></div>}>
      <Post params={params} />
    </Suspense>
    </DirectionalTransition>
  );
}
