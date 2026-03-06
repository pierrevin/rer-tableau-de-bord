import { redirect } from "next/navigation";

type PageProps = {
  params: { id: string };
};

export default function ArticleEditRedirectPage({ params }: PageProps) {
  const { id } = params;
  redirect(`/articles?view=explorer&article=${encodeURIComponent(id)}`);
}
