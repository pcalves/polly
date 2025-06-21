import { Doc } from "../../convex/_generated/dataModel";

export type ExportData = {
  conversation: Doc<"conversations">;
  messages: Doc<"messages">[];
};

export function exportAsJSON(data: ExportData): string {
  return JSON.stringify(
    {
      conversation: {
        title: data.conversation.title,
        createdAt: new Date(data.conversation.createdAt).toISOString(),
        updatedAt: new Date(data.conversation.updatedAt).toISOString(),
      },
      messages: data.messages.map(message => ({
        role: message.role,
        content: message.content,
        reasoning: message.reasoning,
        model: message.model,
        provider: message.provider,
        useWebSearch: message.useWebSearch,
        attachments: message.attachments,
        citations: message.citations,
        createdAt: new Date(message.createdAt).toISOString(),
        metadata: message.metadata,
      })),
    },
    null,
    2
  );
}

export function exportAsMarkdown(data: ExportData): string {
  const { conversation, messages } = data;

  let markdown = `# ${conversation.title}\n\n`;
  markdown += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
  markdown += `**Updated:** ${new Date(conversation.updatedAt).toLocaleString()}\n\n`;
  markdown += `---\n\n`;

  for (const message of messages) {
    if (message.role === "system" || message.role === "context") continue;

    const timestamp = new Date(message.createdAt).toLocaleString();
    const roleEmoji = message.role === "user" ? "👤" : "🤖";
    const roleName = message.role === "user" ? "User" : "Assistant";

    markdown += `## ${roleEmoji} ${roleName}\n`;
    markdown += `*${timestamp}*\n\n`;

    if (message.model) {
      markdown += `**Model:** ${message.model}`;
      if (message.provider) {
        markdown += ` (${message.provider})`;
      }
      markdown += `\n\n`;
    }

    if (message.attachments && message.attachments.length > 0) {
      markdown += `**Attachments:**\n`;
      for (const attachment of message.attachments) {
        markdown += `- ${attachment.name} (${attachment.type})\n`;
      }
      markdown += `\n`;
    }

    if (message.reasoning) {
      markdown += `### Reasoning\n\n`;
      markdown += `${message.reasoning}\n\n`;
    }

    markdown += `${message.content}\n\n`;

    if (message.citations && message.citations.length > 0) {
      markdown += `**Sources:**\n`;
      for (let i = 0; i < message.citations.length; i++) {
        const citation = message.citations[i];
        markdown += `${i + 1}. [${citation.title}](${citation.url})\n`;
        if (citation.snippet) {
          markdown += `   > ${citation.snippet}\n`;
        }
      }
      markdown += `\n`;
    }

    markdown += `---\n\n`;
  }

  return markdown;
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFilename(title: string, format: "json" | "md"): string {
  const sanitized = title
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  const timestamp = new Date().toISOString().split("T")[0];
  return `${sanitized}-${timestamp}.${format}`;
}
