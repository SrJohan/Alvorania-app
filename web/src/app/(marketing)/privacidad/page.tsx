import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, V } from "@/components/site/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function Privacidad() {
  return (
    <LegalPage current="/privacidad" title="Política de privacidad">
      <LegalSection title="1. Quién es el responsable">
        <p>
          El responsable del tratamiento de tus datos es <V v={LEGAL.company} /> (CIF <V v={LEGAL.taxId} />), con domicilio en <V v={LEGAL.address} />. Puedes escribirnos a <V v={LEGAL.email} />.
        </p>
      </LegalSection>

      <LegalSection title="2. Qué datos tratamos">
        <ul>
          <li><strong>Identificativos:</strong> tu nombre y tu correo electrónico.</li>
          <li><strong>Fiscales:</strong> las respuestas del cuestionario (comunidad, estado civil, año de nacimiento, ingresos, retenciones, hijos, vivienda, deducciones) y los documentos que subes, como cartas de Hacienda o justificantes.</li>
          <li><strong>Económicos:</strong> tu plan, tus pagos y tus facturas. Los datos de la tarjeta los gestiona Stripe; nosotros no los vemos ni los guardamos.</li>
          <li><strong>Comunicaciones:</strong> los mensajes con tu asesor.</li>
          <li><strong>Técnicos:</strong> los mínimos para mantener tu sesión y evitar abusos, como los límites de uso.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para qué y con qué base legal">
        <ul>
          <li><strong>Prestarte el servicio</strong> que contratas: calcular, revisar y presentar tu declaración. Base: la ejecución del contrato (art. 6.1.b del RGPD).</li>
          <li><strong>Presentarla ante la Agencia Tributaria en tu nombre,</strong> solo cuando la apruebas. Base: tu consentimiento y el mandato que nos das (art. 6.1.a).</li>
          <li><strong>Cumplir obligaciones legales,</strong> como la facturación y la conservación de documentos fiscales (art. 6.1.c).</li>
          <li><strong>Mantener la seguridad del servicio</strong> y prevenir el fraude y el abuso. Base: nuestro interés legítimo (art. 6.1.f).</li>
          <li><strong>Enviarte avisos del servicio,</strong> como el pago, la aprobación, la presentación y la renovación. Base: la ejecución del contrato.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Datos de salud">
        <p>
          Si indicas que tienes una discapacidad reconocida, tratamos un dato de salud. Lo usamos únicamente para aplicar los mínimos y las deducciones que te corresponden, y solo con tu consentimiento explícito
          (art. 9.2.a del RGPD). Puedes no indicarlo; en ese caso, no se aplicarán esos importes.
        </p>
      </LegalSection>

      <LegalSection title="5. Quién recibe tus datos">
        <p>Solo acceden a tu caso tu asesor y el personal autorizado, y queda registro de esos accesos. Para prestar el servicio usamos estos proveedores, que tratan datos por nuestra cuenta con el contrato que exige el RGPD:</p>
        <ul>
          <li>Supabase: base de datos, acceso a tu cuenta y almacenamiento de documentos.</li>
          <li>Stripe: pagos y suscripciones.</li>
          <li>Resend: envío de correos del servicio.</li>
          <li>Vercel: alojamiento de la web.</li>
        </ul>
        <p>Cuando apruebas la presentación, tu declaración se envía a la Agencia Tributaria. No vendemos tus datos ni los cedemos a otros para sus propios fines.</p>
      </LegalSection>

      <LegalSection title="6. Transferencias internacionales">
        <p>
          <V v="Madrid - España" />
        </p>
      </LegalSection>

      <LegalSection title="7. Cuánto tiempo los guardamos">
        <p>Mientras tengas la cuenta. Si pides eliminarla, cancelamos tu suscripción y borramos tus datos personales a los 30 días.</p>
        <p>
          Las facturas y las declaraciones presentadas se conservan durante el tiempo que exige la normativa fiscal y mercantil. En ese caso, tu perfil queda anonimizado y tu acceso, bloqueado.
        </p>
      </LegalSection>

      <LegalSection title="8. Tus derechos">
        <p>
          Puedes acceder a tus datos, rectificarlos, suprimirlos, oponerte a su tratamiento, limitarlo y pedir su portabilidad. Desde la pantalla de suscripción de tu cuenta puedes descargar tus datos y eliminar tu cuenta.
          Para cualquier otra petición, escribe a <V v={LEGAL.email} />.
        </p>
        <p>
          Si crees que no hemos tratado tus datos como debemos, puedes reclamar ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" rel="noopener noreferrer">aepd.es</a>).
        </p>
      </LegalSection>

      <LegalSection title="9. Decisiones automatizadas">
        <p>
          El cálculo inicial de tu declaración es automático, pero siempre lo revisa un asesor y nada se presenta sin tu aprobación expresa. No tomamos decisiones que te afecten únicamente de forma automatizada.
        </p>
      </LegalSection>

      <LegalSection title="10. Seguridad">
        <p>
          Las conexiones van cifradas, tus documentos se guardan en un almacenamiento privado y solo se descargan con enlaces temporales, y el acceso del personal a tu caso queda registrado.
        </p>
      </LegalSection>

      <LegalSection title="11. Cookies y cambios">
        <p>
          Para saber qué cookies usamos, consulta la <Link href="/cookies">política de cookies</Link>. Si cambiamos esta política de forma relevante, te lo diremos por correo o en la web antes de que se aplique.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
