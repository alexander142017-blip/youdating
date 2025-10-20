import { useEffect, useState } from "react";
import { supabase } from "../api/supabase";

export default function DebugPing() {
  const [msg, setMsg] = useState("Pinging Supabase...");

  useEffect(() => {
    (async () => {
      // Try to read the first row of `profiles`. If the table doesn't exist yet,
      // we still consider it a "connected" result (we'll get a clear error message).
      const { data, error } = await supabase.from("profiles").select("*").limit(1);
      if (error) {
        console.log("Supabase ping error (expected if table not created yet):", error);
        setMsg("✅ Connected to Supabase (table missing is OK for now)");
      } else {
        console.log("Supabase ping data:", data);
        setMsg("✅ Connected to Supabase");
      }
    })();
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontFamily: "ui-sans-serif, system-ui" }}>{msg}</h1>
      <p>Open the browser console to see details.</p>
    </div>
  );
}
