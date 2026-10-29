import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/site/legal-page";

export const metadata: Metadata = { title: "Política de cookies" };

export default function Cookies() {
  return (
    <LegalPage current="/cookies" title="Política de cookies">
      <LegalSection title="1. Qué son">
        <p>Las cookies son pequeños archivos que un sitio guarda en tu navegador para recordar cosas, por ejemplo que has iniciado sesión.</p>
      </LegalSection>

      <LegalSection title="2. Las que usamos">
        <p>
          Solo usamos cookies técnicas, necesarias para que el servicio funcione. No usamos cookies de publicidad ni de analítica, así que no te pedimos que las aceptes.
        </p>
        <ul>
          <li><strong>Sesión de acceso:</strong> mantiene tu sesión abierta cuando entras con el enlace que te enviamos por correo. Caduca cuando cierras sesión o pasado un tiempo sin usar la cuenta.</li>
        </ul>
        <p>
          En la versión de demostración, el estado de tu caso se guarda en el almacenamiento local de tu navegador, que no se envía a ningún servidor.
        </p>
      </LegalSection>

      <LegalSection title="3. Cookies de terceros">
        <p>
          Al pagar, te llevamos a la pasarela de Stripe, que puede usar sus propias cookies para procesar el pago y prevenir el fraude. Se rigen por la política de Stripe, no por la nuestra.
        </p>
      </LegalSection>

      <LegalSection title="4. Cómo gestionarlas">
        <p>
          Puedes borrar o bloquear las cookies desde los ajustes de tu navegador. Si bloqueas la de sesión, no podrás iniciar sesión.
        </p>
        <p>
          Si en el futuro añadimos cookies que no sean técnicas, actualizaremos esta página y te pediremos tu consentimiento antes de usarlas. Más información sobre cómo tratamos tus datos en la{" "}
          <Link href="/privacidad">política de privacidad</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
