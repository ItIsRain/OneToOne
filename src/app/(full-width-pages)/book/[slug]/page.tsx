import { BookingPageLayout } from "@/components/booking/BookingPageLayout";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  return <BookingPageLayout slug={slug} />;
}
