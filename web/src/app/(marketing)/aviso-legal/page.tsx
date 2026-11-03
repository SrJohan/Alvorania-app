import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection, V } from "@/components/site/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso legal" };

export default function AvisoLegal() {
  return (
    <LegalPage current="/aviso-legal" title="Aviso legal">
      <LegalSection title="1. Titular del sitio">
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de servicios de la sociedad de la información y de comercio electrónico, se informa de que este sitio web, {LEGAL.brand},
          es titularidad de <V v={LEGAL.company} />, con CIF <V v={LEGAL.taxId} /> y domicilio social en <V v={LEGAL.address} />.
        </p>
        <p>Datos registrales: <V v={LEGAL.registry} />.</p>
        <p>Correo de contacto: <V v={LEGAL.email} />. Teléfono: <V v={LEGAL.phone} />.</p>
      </LegalSection>

      <LegalSection title="2. Objeto">
        <p>
          Este sitio ofrece información y acceso a servicios fiscales digitales: el cálculo de la declaración de la renta, su revisión por un asesor, su presentación ante la Agencia Tributaria
          cuando tú la apruebas, y otros trámites que se detallan en la sección de trámites. Las condiciones de contratación están en las{" "}
          <Link href="/condiciones">condiciones del servicio</Link>.
        </p>
      </LegalSection>

      <LegalSection title="3. Uso del sitio">
        <p>Al usar el sitio te comprometes a:</p>
        <ul>
          <li>hacerlo conforme a la ley, a la buena fe y a este aviso;</li>
          <li>facilitar datos veraces y mantenerlos actualizados;</li>
          <li>no intentar acceder a cuentas ajenas ni a zonas restringidas, ni sobrecargar o dañar el servicio.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Propiedad intelectual e industrial">
        <p>
          Los textos, el diseño, el código, el logotipo y demás signos distintivos de este sitio son titularidad de <V v={LEGAL.company} /> o se usan con la autorización de sus titulares.
          No se pueden reproducir, distribuir ni transformar sin permiso previo y por escrito, salvo en los casos que permita la ley.
        </p>
      </LegalSection>

      <LegalSection title="5. Contenido y responsabilidad">
        <p>
          La información de este sitio es de carácter general y no sustituye el asesoramiento personalizado. El cálculo que te mostramos antes de la revisión de un asesor es orientativo.
          Hacemos lo posible por que el servicio esté disponible y la información sea correcta, pero no respondemos de interrupciones ni de errores ajenos a nuestra diligencia.
        </p>
        <p>Si el sitio enlaza a páginas de terceros, no controlamos su contenido y no respondemos de él.</p>
      </LegalSection>

      <LegalSection title="6. Profesionales">
        <p>
          Cada declaración la revisa un asesor cuyo nombre y número de colegiado ves en tu caso. 
        </p>
      </LegalSection>

      <LegalSection title="7. Legislación y jurisdicción">
        <p>
          Este aviso se rige por la legislación española. Si eres consumidor, serán competentes los juzgados de tu domicilio, conforme a la normativa de consumidores. En los demás casos,
          los juzgados de <V v={LEGAL.courts} />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
