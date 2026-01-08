import LegalPageLayout from "@/components/legal/LegalPageLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Mail, Clock, AlertCircle } from "lucide-react";

const Desistimiento = () => {
  const handleDownloadForm = () => {
    const formContent = `FORMULARIO DE DESISTIMIENTO
(Este formulario debe cumplimentarse y enviarse solo si desea desistir del contrato)

A la atención de:
ACROXIA TECH S.L.
Email: legal@acroxia.com

Por la presente comunico que desisto del contrato de prestación del siguiente servicio:

- Tipo de servicio contratado: ____________________________
- Fecha de contratación: ____________________________
- Plan contratado: ____________________________

DATOS DEL CONSUMIDOR:

- Nombre y apellidos: ____________________________
- Dirección: ____________________________
- Email registrado en ACROXIA: ____________________________
- Teléfono (opcional): ____________________________

SOLICITO:
☐ El reembolso del importe pagado
☐ La cancelación inmediata del servicio

Método de reembolso preferido:
☐ Mismo método de pago utilizado
☐ Transferencia bancaria a: IBAN ____________________________

Declaro que:
- He contratado el servicio hace menos de 14 días naturales.
- Entiendo que si he utilizado el servicio (realizado análisis de contratos), podría aplicarse una reducción proporcional del reembolso.

Firma: ____________________________

Fecha: ____________________________

Lugar: ____________________________

---
INSTRUCCIONES DE ENVÍO:
1. Cumplimente todos los campos marcados con líneas.
2. Firme y feche el documento.
3. Envíelo por email a: legal@acroxia.com
4. Recibirá confirmación de recepción en 24-48 horas laborables.
5. El reembolso se procesará en un máximo de 14 días.
`;

    const blob = new Blob([formContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'formulario-desistimiento-acroxia.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <LegalPageLayout
      title="Derecho de Desistimiento"
      metaDescription="Información sobre tu derecho de desistimiento en ACROXIA. Plazo de 14 días para cancelar tu suscripción."
      lastUpdated="8 de enero de 2026"
    >
      <div className="space-y-8">
        {/* Card destacada con formulario */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Formulario de Desistimiento
            </CardTitle>
            <CardDescription>
              Descarga y cumplimenta el formulario para ejercer tu derecho de desistimiento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadForm} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              Descargar formulario
            </Button>
          </CardContent>
        </Card>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">1. Tu derecho de desistimiento</h2>
          <p className="text-muted-foreground mb-4">
            Conforme al Real Decreto Legislativo 1/2007, de 16 de noviembre, por el que se aprueba 
            el texto refundido de la Ley General para la Defensa de los Consumidores y Usuarios, 
            tienes derecho a desistir del contrato en un plazo de <strong>14 días naturales</strong> sin 
            necesidad de indicar el motivo.
          </p>
          
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg mb-4">
            <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Plazo de 14 días</p>
              <p className="text-sm text-muted-foreground">
                El plazo de desistimiento expirará a los 14 días naturales del día de la celebración del contrato.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">2. Cómo ejercer el derecho</h2>
          <p className="text-muted-foreground mb-4">
            Para ejercer el derecho de desistimiento, debes notificarnos tu decisión de desistir 
            del contrato a través de una declaración inequívoca. Puedes hacerlo de las siguientes formas:
          </p>
          
          <div className="space-y-4 mb-4">
            <div className="flex items-start gap-3 p-4 border border-border rounded-lg">
              <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Por correo electrónico (recomendado)</p>
                <p className="text-sm text-muted-foreground mb-2">
                  Envía el formulario cumplimentado o una comunicación clara a:
                </p>
                <a href="mailto:legal@acroxia.com" className="text-primary hover:underline">
                  legal@acroxia.com
                </a>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground mb-4">
            Para cumplir el plazo de desistimiento, basta con que la comunicación relativa al 
            ejercicio de este derecho sea enviada antes de que venza el plazo.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">3. Consecuencias del desistimiento</h2>
          <p className="text-muted-foreground mb-4">
            En caso de desistimiento, te devolveremos todos los pagos recibidos, sin ninguna 
            demora indebida y, en cualquier caso, en un plazo máximo de <strong>14 días naturales</strong> a 
            partir de la fecha en que se nos informe de tu decisión de desistir.
          </p>
          <p className="text-muted-foreground mb-4">
            Procederemos a efectuar el reembolso utilizando el mismo medio de pago empleado 
            para la transacción inicial, salvo que hayas dispuesto expresamente lo contrario. 
            No incurrirás en ningún gasto como consecuencia del reembolso.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-amber-500" />
            4. Excepciones al derecho de desistimiento
          </h2>
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
            <p className="text-amber-800 mb-2">
              El derecho de desistimiento podría no aplicarse o verse reducido si:
            </p>
            <ul className="text-amber-700 space-y-2 list-disc list-inside">
              <li>
                <strong>Servicio completamente ejecutado:</strong> Si has utilizado créditos para 
                analizar contratos, el servicio se considera prestado y podría aplicarse una 
                reducción proporcional del reembolso.
              </li>
              <li>
                <strong>Solicitud expresa de inicio:</strong> Si solicitaste expresamente que el 
                servicio comenzara durante el período de desistimiento.
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mb-4">
            En estos casos, te abonaríamos un importe proporcional a la parte del servicio ya 
            prestada en el momento en que nos hayas comunicado el desistimiento, en relación 
            con el precio total del contrato.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">5. Modelo de formulario de desistimiento</h2>
          <p className="text-muted-foreground mb-4">
            Puedes utilizar el formulario que ponemos a tu disposición en la parte superior de 
            esta página, aunque no es obligatorio. Lo importante es que tu comunicación sea 
            clara e inequívoca.
          </p>
          <p className="text-muted-foreground mb-4">
            Tu comunicación debe incluir como mínimo:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
            <li>Tu voluntad de desistir del contrato</li>
            <li>Tus datos identificativos (nombre, email de registro)</li>
            <li>Fecha de contratación</li>
            <li>Fecha de la comunicación</li>
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">6. Confirmación y seguimiento</h2>
          <p className="text-muted-foreground mb-4">
            Una vez recibida tu solicitud de desistimiento:
          </p>
          <ol className="list-decimal list-inside text-muted-foreground space-y-2 mb-4">
            <li>Te enviaremos un acuse de recibo en un plazo de 24-48 horas laborables.</li>
            <li>Verificaremos que cumples los requisitos para el desistimiento.</li>
            <li>Calcularemos el importe a reembolsar (total o proporcional según el caso).</li>
            <li>Procesaremos el reembolso en un máximo de 14 días.</li>
            <li>Te enviaremos confirmación del reembolso efectuado.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-semibold mb-4">7. Contacto</h2>
          <p className="text-muted-foreground">
            Para cualquier consulta sobre el derecho de desistimiento:{" "}
            <a href="mailto:legal@acroxia.com" className="text-primary hover:underline">
              legal@acroxia.com
            </a>
          </p>
        </section>
      </div>
    </LegalPageLayout>
  );
};

export default Desistimiento;
