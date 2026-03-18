import { createClient, SupabaseClient } from "@supabase/supabase-js";

export const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function supabaseQuery<T>(
  fn: (client: SupabaseClient) => PromiseLike<{ data: T | null; error: { message: string } | null }>
): Promise<T> {
  const { data, error } = await fn(supabaseAdmin);
  if (error) throw new Error(error.message);
  return data as T;
}
