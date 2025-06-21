import { NotFoundPage } from "@/components/ui/not-found-page";

export default function ChatNotFoundPage() {
  return (
    <NotFoundPage
      title="Conversation not found"
      description="This conversation doesn't exist or you don't have access to it."
    />
  );
}
