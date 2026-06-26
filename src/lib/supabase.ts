import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Inicialização resiliente para evitar tela branca caso as variáveis de ambiente estejam ausentes no build
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      console.warn('Supabase: credenciais ausentes no .env. Inicializando cliente mockado para evitar tela branca.');
      const createMock = (): any => {
        const mockFn = () => mockProxy;
        const mockProxy: any = new Proxy(mockFn, {
          get(target, prop) {
            if (prop === 'then') {
              // Permite que o mock se comporte como uma Promise e resolva de forma limpa
              return (resolve: any) => resolve({ data: [], error: null, ok: false, message: 'Supabase não configurado.' });
            }
            // Suporta chamadas de métodos aninhados como supabase.functions.invoke()
            if (prop === 'invoke') {
              return () => Promise.resolve({ data: { ok: false, message: 'Serviço temporariamente indisponível.' }, error: new Error('Supabase não configurado.') });
            }
            return mockProxy;
          }
        });
        return mockProxy;
      };
      return createMock();
    })();
