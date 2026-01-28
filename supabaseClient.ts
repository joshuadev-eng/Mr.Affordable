
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pewkxgyjcyiyuaormhrh.supabase.co';
const supabaseAnonKey = 'sb_publishable_TC3s8mxCSNwiUTPd00xN_A_vAcVaBys';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
