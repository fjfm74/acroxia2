import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // 1. Buscar contratos expirados (expires_at < now)
    const { data: expiredContracts, error: fetchError } = await supabase
      .from("contracts")
      .select("id, file_path, user_id, file_name")
      .lt("expires_at", now.toISOString());

    if (fetchError) throw fetchError;

    if (!expiredContracts || expiredContracts.length === 0) {
      console.log("No hay contratos expirados para eliminar");
      return new Response(
        JSON.stringify({ 
          message: "No hay contratos expirados para eliminar", 
          deleted: 0,
          timestamp: now.toISOString()
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Encontrados ${expiredContracts.length} contratos expirados`);

    let deletedCount = 0;
    const errors: string[] = [];

    for (const contract of expiredContracts) {
      try {
        // 2. Eliminar archivo de Storage
        if (contract.file_path) {
          const { error: storageError } = await supabase.storage
            .from("contracts")
            .remove([contract.file_path]);
          
          if (storageError) {
            console.warn(`Error eliminando archivo ${contract.file_path}:`, storageError.message);
            // Continuamos aunque falle el storage (el archivo puede no existir)
          }
        }

        // 3. Eliminar resultados de análisis asociados
        const { error: analysisError } = await supabase
          .from("analysis_results")
          .delete()
          .eq("contract_id", contract.id);

        if (analysisError) {
          console.warn(`Error eliminando análisis de contrato ${contract.id}:`, analysisError.message);
        }

        // 4. Eliminar el contrato
        const { error: deleteError } = await supabase
          .from("contracts")
          .delete()
          .eq("id", contract.id);

        if (deleteError) {
          throw deleteError;
        }

        deletedCount++;
        console.log(`Contrato ${contract.id} (${contract.file_name}) eliminado correctamente`);

      } catch (err: unknown) {
        const errorMsg = `Error con contrato ${contract.id}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    const summary = {
      message: "Cleanup de contratos completado",
      deleted: deletedCount,
      total: expiredContracts.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: now.toISOString()
    };

    console.log("Resumen:", JSON.stringify(summary));

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error en cleanup-contracts:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
