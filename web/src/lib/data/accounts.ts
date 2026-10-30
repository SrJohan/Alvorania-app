// Cuentas del modo demo: viven en el navegador (localStorage), no en un servidor.
// La contraseña se guarda derivada con PBKDF2 y sal propia, nunca en claro. En live no se usa: manda Supabase Auth.
const KEY = "gestoria-demo-accounts-v1";
const ITERATIONS = 120_000;

type Account = { fullName: string; salt: string; hash: string };
type Store = Pick<Storage, "getItem" | "setItem">;

const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: ITERATIONS }, key, 256);
  return toB64(new Uint8Array(bits));
}

export function accounts(store: Store) {
  const read = (): Record<string, Account> => {
    try { return JSON.parse(store.getItem(KEY) ?? "{}"); } catch { return {}; }
  };
  const norm = (email: string) => email.trim().toLowerCase();

  return {
    /** Crea la cuenta; devuelve false si ya existe una con ese correo. */
    async register(email: string, fullName: string, password: string): Promise<boolean> {
      const all = read();
      const id = norm(email);
      if (all[id]) return false;
      const salt = crypto.getRandomValues(new Uint8Array(16));
      all[id] = { fullName, salt: toB64(salt), hash: await derive(password, salt) };
      try { store.setItem(KEY, JSON.stringify(all)); } catch { throw new Error("No podemos guardar la cuenta en este navegador."); }
      return true;
    },
    has: (email: string) => norm(email) in read(),
    /** Cambia la contraseña de una cuenta existente; devuelve el nombre, o null si no existe. */
    async setPassword(email: string, password: string): Promise<string | null> {
      const all = read();
      const id = norm(email);
      const a = all[id];
      if (!a) return null;
      const salt = crypto.getRandomValues(new Uint8Array(16));
      all[id] = { ...a, salt: toB64(salt), hash: await derive(password, salt) };
      try { store.setItem(KEY, JSON.stringify(all)); } catch { throw new Error("No podemos guardar la cuenta en este navegador."); }
      return a.fullName;
    },
    /** Devuelve el nombre si el correo y la contraseña coinciden; null en cualquier otro caso. */
    async verify(email: string, password: string): Promise<string | null> {
      const a = read()[norm(email)];
      if (!a) return null;
      return (await derive(password, fromB64(a.salt))) === a.hash ? a.fullName : null;
    },
  };
}
