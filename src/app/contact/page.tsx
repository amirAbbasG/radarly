import type { Metadata } from "next";
import { ContactPage } from "@/features/contact/contact-page";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { ScrollProgress } from "@/components/layout/scroll-progress";

export const metadata: Metadata = {
  title: "Contact Radarly",
  description:
    "Get in touch with the Radarly team — general questions, press, partnerships, or bug reports.",
  openGraph: {
    title: "Contact Radarly",
    description: "Get in touch with the Radarly team.",
    type: "website",
  },
};

export default function ContactRoute() {
  return (
    <>
      <ScrollProgress />
      <Navbar />
      <ContactPage />
      <Footer />
    </>
  );
}
