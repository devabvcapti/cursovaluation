"use client";

import { useState } from "react";
import { Header } from "@/components/sections/Header";
import { Footer } from "@/components/sections/Footer";
import { Section } from "@/components/ui/Section";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PaymentStep } from "@/components/checkout/PaymentStep";

interface Pedido {
  pedidoId: string;
  valorCobrado: number;
  email: string;
}

export default function InscricaoPage() {
  const [pedido, setPedido] = useState<Pedido | null>(null);

  return (
    <>
      <Header />
      <Section tone="navy">
        <div className="mx-auto w-full max-w-5xl px-6 lg:px-10">
          {pedido ? (
            <PaymentStep
              pedidoId={pedido.pedidoId}
              valorCobrado={pedido.valorCobrado}
              email={pedido.email}
            />
          ) : (
            <CheckoutForm onPedidoCreated={setPedido} />
          )}
        </div>
      </Section>
      <Footer />
    </>
  );
}
