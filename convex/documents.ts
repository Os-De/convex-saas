import { mutation, query } from "@cvx/_generated/server";
import { auth } from "@cvx/auth";
import { asyncMap } from "convex-helpers";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveDocument = mutation({
  args: {
    fileName: v.string(),
    fileId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    await ctx.db.insert("documents", {
      userId,
      fileName: args.fileName,
      fileId: args.fileId,
      mimeType: args.mimeType,
      size: args.size,
    });
    return null;
  },
});

export const getDocuments = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      return [];
    }
    const documents = await ctx.db
      .query("documents")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return asyncMap(documents, async (document) => ({
      ...document,
      url: await ctx.storage.getUrl(document.fileId),
    }));
  },
});

export const deleteDocument = mutation({
  args: {
    documentId: v.id("documents"),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("User not found");
    }
    const document = await ctx.db.get(args.documentId);
    if (!document || document.userId !== userId) {
      throw new Error("Document not found");
    }
    await ctx.storage.delete(document.fileId);
    await ctx.db.delete(args.documentId);
    return null;
  },
});
