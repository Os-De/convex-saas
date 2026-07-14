import { createFileRoute } from "@tanstack/react-router";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useUploadFiles } from "@xixixao/uploadstuff/react";
import { Button } from "@/ui/button";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "~/convex/_generated/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/documents")(
  {
    component: DashboardDocuments,
    beforeLoad: () => ({
      title: "Documents",
      headerTitle: "Documents",
      headerDescription: "Upload, download and manage your documents.",
    }),
  },
);

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function DashboardDocuments() {
  const { data: documents } = useQuery(
    convexQuery(api.documents.getDocuments, {}),
  );
  const { mutateAsync: saveDocument } = useMutation({
    mutationFn: useConvexMutation(api.documents.saveDocument),
  });
  const { mutateAsync: deleteDocument } = useMutation({
    mutationFn: useConvexMutation(api.documents.deleteDocument),
  });
  const generateUploadUrl = useConvexMutation(api.documents.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFilesRef = useRef<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { startUpload } = useUploadFiles(generateUploadUrl, {
    onUploadComplete: async (uploaded) => {
      const files = selectedFilesRef.current;
      await Promise.all(
        uploaded.map((upload, index) => {
          const file = files[index];
          if (!file) {
            return Promise.resolve();
          }
          return saveDocument({
            fileName: file.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fileId: (upload.response as any).storageId,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
          });
        }),
      );
      selectedFilesRef.current = [];
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setIsUploading(false);
    },
    onUploadError: () => {
      setIsUploading(false);
    },
  });

  return (
    <div className="flex h-full w-full flex-col gap-6">
      {/* Upload */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
        <div className="flex w-full items-start justify-between rounded-lg p-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-medium text-primary">
              Upload a Document
            </h2>
            <p className="text-sm font-normal text-primary/60">
              PDF, Word, Excel, PowerPoint, text and other files are supported.
            </p>
          </div>
          <label
            htmlFor="document_field"
            className="flex cursor-pointer items-center transition active:scale-95"
          >
            <span className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload"}
            </span>
          </label>
          <input
            ref={fileInputRef}
            id="document_field"
            type="file"
            multiple
            className="peer sr-only"
            tabIndex={-1}
            onChange={(event) => {
              if (!event.target.files) {
                return;
              }
              const files = Array.from(event.target.files);
              if (files.length === 0) {
                return;
              }
              selectedFilesRef.current = files;
              setIsUploading(true);
              startUpload(files);
            }}
          />
        </div>
        <div className="flex min-h-14 w-full items-center justify-between rounded-lg rounded-t-none border-t border-border bg-secondary px-6 dark:bg-card">
          <p className="text-sm font-normal text-primary/60">
            You can select multiple files at once. Files are stored in Convex
            storage.
          </p>
        </div>
      </div>

      {/* Documents List */}
      <div className="flex w-full flex-col items-start rounded-lg border border-border bg-card">
        <div className="flex w-full flex-col gap-2 p-6">
          <h2 className="text-xl font-medium text-primary">Your Documents</h2>
          <p className="text-sm font-normal text-primary/60">
            {documents?.length
              ? `${documents.length} document${documents.length === 1 ? "" : "s"} uploaded.`
              : "No documents uploaded yet."}
          </p>
        </div>
        {documents && documents.length > 0 && (
          <div className="flex w-full flex-col border-t border-border">
            {documents.map((document) => (
              <div
                key={document._id}
                className="flex w-full items-center justify-between gap-4 border-b border-border px-6 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 stroke-[1.5px] text-primary/60" />
                  <div className="flex min-w-0 flex-col">
                    <p className="truncate text-sm font-medium text-primary">
                      {document.fileName}
                    </p>
                 