import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, V } from "@/components/site/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Condiciones del servicio" };

export default function Condiciones() {
  return (
    <LegalPage current="/condiciones" title="Condiciones del servicio">
      <LegalSection title="1. Quiénes somos y qué ofrecemos">
        <p>
          {LEGAL.brand} es un servicio de <V v={LEGAL.company} /> (CIF <V v={LEGAL.taxId} />). Te ayudamos a preparar y presentar tu declaración de la renta y otros trámites fiscales con la
          revisión de un asesor. Estas condiciones regulan el uso del servicio. Al crear tu cuenta y contratar, las aceptas.
        </p>
      </LegalSection>

      <LegalSection title="2. Tu cuenta">
        <p>Entras con un enlace que te enviamos por correo, sin contraseña. Eres responsable de tu correo y de lo que se haga con tu cuenta. Avísanos si crees que alguien más ha entrado.</p>
      </LegalSection>

      <LegalSection title="3. Qué incluye el servicio">
        <ul>
          <li><strong>Cálculo gratuito,</strong> sin tarjeta, con las respuestas que nos das.</li>
          <li><strong>Revisión de un asesor,</strong> con nombre y número de colegiado, al contratar un plan.</li>
          <li><strong>Presentación ante la Agencia Tributaria</strong> solo después de que el asesor apruebe tu declaración y tú la apruebes de forma expresa. Nada se presenta sin tu confirmación.</li>
        </ul>
        <p>Qué cubre cada plan está en la página de <Link href="/precios">precios</Link>.</p>
      </LegalSection>

      <LegalSection title="4. Lo que nos pedimos mutuamente">
        <p>
          Tú te comprometes a darnos datos y documentos veraces y completos, y a responder a tu asesor a tiempo. Nosotros nos comprometemos a tratar tu caso con la diligencia de un profesional y a
          avisarte si falta algo para presentar dentro de plazo. Si los datos que nos das no son correctos, el resultado puede cambiar y no respondemos de las consecuencias que eso tenga.
        </p>
      </LegalSection>

      <LegalSection title="5. Precio y pago">
        <p>
          El precio que ves antes de pagar es el total, con IVA incluido, y no cambia después: no hay suplementos. Si tu asesor descubre algo que no nos contaste y cambia el plan que necesitas,
          te avisamos antes de cobrar nada y puedes desistir con la devolución completa.
        </p>
        <p>El pago se hace con tarjeta a través de Stripe. Recibirás la factura por correo.</p>
      </LegalSection>

      <LegalSection title="6. Renovación y cancelación">
        <p>
          Los planes son anuales y se renuevan automáticamente. Te avisamos 15 días antes de cada renovación. Puedes cancelar en un clic desde la pantalla de suscripción de tu cuenta;
          el plan sigue activo hasta el final del periodo ya pagado y no se renueva.
        </p>
      </LegalSection>

      <LegalSection title="7. Desistimiento">
        <p>
          Si eres consumidor, tienes derecho a desistir del contrato en 14 días naturales desde que lo contratas, sin dar explicaciones, conforme al texto refundido de la Ley General para la Defensa de los
          Consumidores y Usuarios. Si pides que empecemos a prestar el servicio durante ese plazo, deberás pagar la parte proporcional de lo ya prestado, y si el servicio se ha ejecutado por completo
          con tu consentimiento previo, el derecho de desistimiento se pierde. Para ejercerlo, escribe a <V v={LEGAL.email} />.
        </p>
      </LegalSection>

      <LegalSection title="8. Responsabilidad">
        <p>
          El cálculo previo a la revisión es orientativo. No garantizamos un resultado concreto, como una devolución de una cantidad determinada, porque depende de tus datos y de la decisión de la
          Administración. Nuestra responsabilidad como profesionales se rige por la ley y por la póliza indicada en el <Link href="/aviso-legal">aviso legal</Link>.
        </p>
      </LegalSection>

      <LegalSection title="9. Tus datos">
        <p>Cómo tratamos tus datos está en la <Link href="/privacidad">política de privacidad</Link>.</p>
      </LegalSection>

      <LegalSection title="10. Cambios en las condiciones">
        <p>Si cambiamos estas condiciones, te avisaremos con antelación suficiente. Los cambios no afectan a lo que ya hayas contratado salvo que la ley lo exija o te beneficien.</p>
      </LegalSection>

      <LegalSection title="11. Ley aplicable y reclamaciones">
        <p>
          Estas condiciones se rigen por la ley española. Puedes reclamarnos escribiendo a <V v={LEGAL.email} />. Si eres consumidor, serán competentes los juzgados de tu domicilio y, en los demás casos,
          los de <V v={LEGAL.courts} />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
