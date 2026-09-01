import type { Metadata, Viewport } from "next";
import { Kanit, Roboto } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import "./globals.css";

const kanit = Kanit({
  variable: "--font-kanit",
  subsets: ["thai", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "บันทึกการออกกำลังกายส่วนตัว — เก็บข้อมูลในเบราว์เซอร์",
  appleWebApp: {
    capable: true,
    title: "Workout Tracker",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0d11",
};

const themeScript = `
try {
  var raw = localStorage.getItem('workout-settings');
  var theme = raw ? JSON.parse(raw).state.theme : 'dark';
  document.documentElement.classList.add(theme === 'light' ? 'light' : 'dark');
} catch (e) {
  document.documentElement.classList.add('dark');
}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${kanit.variable} ${roboto.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full bg-background font-sans text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
