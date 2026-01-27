import { BasketProvider } from "./contexts/basket";

export default function TablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BasketProvider>{children}</BasketProvider>;
}
