const toPlainObject = (value) => {
  if (!value) return {};
  return typeof value.toObject === "function" ? value.toObject() : value;
};

const serializePublicAuthor = (author, fallbackName = "Reader") => {
  const value = toPlainObject(author);
  const displayName = [value.firstName, value.lastName].filter(Boolean).join(" ").trim()
    || String(fallbackName || "Reader").trim()
    || "Reader";
  return { displayName };
};

const serializePublicComment = (comment) => {
  const value = toPlainObject(comment);
  return {
    body: value.body,
    createdAt: value.createdAt,
    author: serializePublicAuthor(value.authorId, value.authorName),
  };
};

const serializeAdminComment = (comment) => {
  const value = toPlainObject(comment);
  const article = toPlainObject(value.articleId);

  return {
    id: String(value._id || value.id),
    body: value.body,
    status: value.status,
    authorName: value.authorName || "Reader",
    articleId: article?._id || article?.id
      ? { id: String(article._id || article.id), title: article.title, slug: article.slug }
      : undefined,
    isPinned: Boolean(value.isPinned),
    isDeleted: Boolean(value.isDeleted),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
};

module.exports = { serializePublicAuthor, serializePublicComment, serializeAdminComment };
