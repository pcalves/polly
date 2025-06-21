import { useState, useCallback } from "react";
import { Attachment } from "@/types";
import { isFileTypeSupported } from "@/lib/model-capabilities";
import {
  useConvexFileUpload,
  FileUploadProgress,
} from "@/hooks/use-convex-file-upload";
import { useNotificationDialog } from "@/hooks/use-notification-dialog";

import { AIModel } from "@/types";

interface UseFileUploadProps {
  currentModel?: AIModel;
  conversationId?: string;
}

export function useFileUpload({
  currentModel,
  conversationId,
}: UseFileUploadProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, FileUploadProgress>
  >(new Map());

  const { uploadFile } = useConvexFileUpload();
  const notificationDialog = useNotificationDialog();

  const processTextFiles = useCallback((textFiles: Attachment[]) => {
    if (textFiles.length === 0) return "";

    const textFileContents = textFiles
      .map(file => {
        const extension = file.name.split(".").pop()?.toLowerCase();
        const language =
          extension &&
          [
            "js",
            "ts",
            "jsx",
            "tsx",
            "py",
            "java",
            "c",
            "cpp",
            "cs",
            "go",
            "rs",
            "php",
            "rb",
            "swift",
            "kt",
            "scala",
            "sh",
            "sql",
            "html",
            "css",
            "scss",
            "sass",
            "less",
            "vue",
            "svelte",
            "json",
            "xml",
            "yaml",
            "yml",
          ].includes(extension)
            ? extension === "tsx"
              ? "typescript"
              : extension === "jsx"
                ? "javascript"
                : extension === "py"
                  ? "python"
                  : extension === "cs"
                    ? "csharp"
                    : extension === "rs"
                      ? "rust"
                      : extension === "rb"
                        ? "ruby"
                        : extension === "kt"
                          ? "kotlin"
                          : extension === "sh"
                            ? "bash"
                            : extension
            : "";

        return `**${file.name}:**\n\`\`\`${language}\n${file.content}\n\`\`\``;
      })
      .join("\n\n");

    return textFileContents;
  }, []);

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        const maxSize = 20 * 1024 * 1024; // 20MB limit

        if (file.size > maxSize) {
          notificationDialog.notify({
            title: "File Too Large",
            description: `File ${file.name} is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`,
            type: "error",
          });
          continue;
        }

        const fileSupport = isFileTypeSupported(file.type, currentModel);

        if (!fileSupport.supported) {
          notificationDialog.notify({
            title: "Unsupported File Type",
            description: `File ${file.name} is not supported by the current model. ${
              !currentModel
                ? "Please select a model first."
                : "Try selecting a different model that supports this file type."
            }`,
            type: "error",
          });
          continue;
        }

        try {
          const fileKey = file.name + file.size;

          setUploadProgress(
            prev =>
              new Map(
                prev.set(fileKey, {
                  file,
                  progress: 0,
                  status: "pending",
                })
              )
          );

          if (fileSupport.category === "text") {
            const textContent = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsText(file);
            });

            const attachment: Attachment = {
              type: "text",
              url: "",
              name: file.name,
              size: file.size,
              content: textContent,
            };

            newAttachments.push(attachment);
            setUploadProgress(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileKey);
              return newMap;
            });
          } else {
            const attachment = await uploadFile(
              file,
              conversationId,
              progress => {
                setUploadProgress(prev => new Map(prev.set(fileKey, progress)));
              }
            );

            newAttachments.push(attachment);
            setUploadProgress(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileKey);
              return newMap;
            });
          }
        } catch (error) {
          console.error(`Failed to process file ${file.name}:`, error);
          notificationDialog.notify({
            title: "File Upload Failed",
            description: `Failed to upload file ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`,
            type: "error",
          });

          const fileKey = file.name + file.size;
          setUploadProgress(prev => {
            const newMap = new Map(prev);
            newMap.delete(fileKey);
            return newMap;
          });
        }
      }

      setAttachments(prev => [...prev, ...newAttachments]);

      // Show success toast for uploaded files
      if (newAttachments.length > 0) {
        const { toast } = await import("sonner");
        toast.success(
          `File${newAttachments.length > 1 ? "s" : ""} uploaded successfully`,
          {
            description: `${newAttachments.length} file${newAttachments.length > 1 ? "s" : ""} ready to use in your conversation.`,
          }
        );
      }
    },
    [notificationDialog, currentModel, uploadFile, conversationId]
  );

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const buildMessageContent = useCallback(
    (input: string) => {
      const textFiles = attachments.filter(att => att.type === "text");
      const textFileContents = processTextFiles(textFiles);

      return input.trim()
        ? textFileContents
          ? `${input.trim()}\n\n${textFileContents}`
          : input.trim()
        : textFileContents;
    },
    [attachments, processTextFiles]
  );

  const getBinaryAttachments = useCallback(() => {
    return attachments.filter(att => att.type !== "text");
  }, [attachments]);

  return {
    attachments,
    uploadProgress,
    handleFileUpload,
    removeAttachment,
    clearAttachments,
    buildMessageContent,
    getBinaryAttachments,
    notificationDialog,
  };
}
