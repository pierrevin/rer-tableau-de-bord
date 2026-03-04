-- CreateTable
CREATE TABLE "ArticleBloc" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "contenu" TEXT,
    "url" TEXT,

    CONSTRAINT "ArticleBloc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArticleBloc_articleId_idx" ON "ArticleBloc"("articleId");

-- CreateIndex
CREATE INDEX "ArticleBloc_articleId_ordre_idx" ON "ArticleBloc"("articleId", "ordre");

-- AddForeignKey
ALTER TABLE "ArticleBloc" ADD CONSTRAINT "ArticleBloc_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
