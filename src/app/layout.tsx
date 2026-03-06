import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'
import Navbar from '@/components/Navbar'
import CartDrawer from "@/components/CartDrawer";
import { CustomerNotificationContainer } from "@/components/CustomerNotifications";
import ScrollSequence from '@/components/ScrollSequence'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Abhiruchi Restaurant\'s',
  description: 'Where Every Grain Tells a Royal Story.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="bg-transparent flex flex-col min-h-screen text-[#F8F9FA] relative pb-20 md:pb-0">
        <AppProvider>
          <ScrollSequence />
          <Navbar />
          <CartDrawer />
          <CustomerNotificationContainer />
          <main className="flex-1 mt-20">{children}</main>
        </AppProvider>
      </body>
    </html>
  )
}
