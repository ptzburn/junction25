"use client";

import {
  ChevronUp,
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { CodeDashLogo } from "@/components/code-dash-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const quickLinks = [
  { label: "Image or text AI order", href: "/image-order" },
  { label: "\"I'm busy\" order", href: "/googlecalendar" },
  { label: "OnlyFood Feed", href: "/onlyfood-feed" },
  { label: "Order History", href: "/orders" },
  { label: "Categories", href: "/categories" },
  { label: "Collections", href: "/collections" },
];

const companyLinks = [
  { label: "About CodeDash", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "Blog", href: "/blog" },
  { label: "Gift Cards", href: "/gift-cards" },
];

const supportLinks = [
  { label: "Help Center", href: "/help" },
  { label: "Safety", href: "/safety" },
  { label: "Contact Us", href: "/contact" },
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/codedash", label: "Facebook" },
  { icon: Instagram, href: "https://instagram.com/codedash", label: "Instagram" },
  { icon: Twitter, href: "https://twitter.com/codedash", label: "Twitter" },
  { icon: Youtube, href: "https://youtube.com/codedash", label: "YouTube" },
];

export function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Simple scroll handler
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      setShowBackToTop(window.scrollY > 600);
    });
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl px-4 py-12">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand Column */}
            <div className="flex flex-col gap-4 lg:col-span-2">
              <div className="flex items-center gap-2">
                <CodeDashLogo className="h-8 w-8" />
                <span className="text-xl font-bold tracking-tight">CodeDash</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                AI-powered food delivery that reads your mind, your calendar, and your cravings — in Helsinki and beyond.
              </p>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Helsinki, Finland</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  <Clock className="mr-1 h-3 w-3" />
                  24/7
                </Badge>
              </div>

              <div className="flex gap-3 mt-4">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <Button
                    key={label}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full"
                    asChild
                  >
                    <Link href={href} target="_blank" aria-label={label}>
                      <Icon className="h-4 w-4" />
                    </Link>
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <ul className="space-y-2.5">
                {quickLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2.5">
                {companyLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support & Legal */}
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2.5">
                {supportLinks.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-6">
              <span>© 2025 CodeDash Oy. All rights reserved.</span>
              <div className="hidden sm:flex items-center gap-4">
                <Link href="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                +358 50 123 4567
              </Button>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                hello@codedash.fi
              </Button>
            </div>
          </div>
        </div>

        {/* Back to Top Button */}
        <Button
          variant="outline"
          size="icon"
          className={`
            fixed bottom-6 right-6 z-50 rounded-full shadow-lg transition-all duration-300
            ${showBackToTop ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}
          `}
          onClick={scrollToTop}
          aria-label="Back to top"
        >
          <ChevronUp className="h-5 w-5" />
        </Button>
      </footer>
    </>
  );
}
