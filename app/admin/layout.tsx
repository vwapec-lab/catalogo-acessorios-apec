import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("id, nome, email, perfil, ativo")
    .eq("auth_id", user.id)
    .maybeSingle();

  const acessoPermitido =
    !usuarioError &&
    usuario &&
    usuario.ativo === true &&
    (usuario.perfil === "admin" || usuario.perfil === "superadmin");

  if (!acessoPermitido) {
    redirect("/login");
  }

  return <>{children}</>;
}