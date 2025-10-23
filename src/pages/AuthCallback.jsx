import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../api/supabase";

export default function AuthCallback() {
  const nav = useNavigate();
  useEffect(() => {
    (async () => {
      await supabase.auth.getSession();
      setTimeout(() => nav("/", { replace: true }), 100);
    })();
  }, [nav]);
  return (
    <div className="min-h-screen grid place-items-center">
      <p className="text-sm text-gray-600">Signing you in…</p>
    </div>
  );
}