import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata={title:"StockOS — Inventory & Ecommerce",description:"Inventory, purchase, sales, warehouse and ecommerce management"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}