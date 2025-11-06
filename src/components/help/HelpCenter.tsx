import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";
import {
  HelpCircle,
  Download,
  Mail,
  Phone,
  Clock,
  MessageCircle,
  FileText,
  Loader2,
} from "lucide-react";

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const [activeTab, setActiveTab] = useState("faq");
  const [isDownloading, setIsDownloading] = useState(false);
  const MANUAL_URL = import.meta.env?.VITE_USER_MANUAL_URL as
    | string
    | undefined;

  const faqData = [
    {
      id: "register-client",
      question: "¿Cómo registro un nuevo cliente?",
      answer:
        'Para registrar un nuevo cliente, vaya a la sección "Clientes" en el menú principal, haga clic en "Nuevo Cliente" y complete todos los campos obligatorios del formulario. Asegúrese de verificar el DNI y email antes de guardar.',
    },
    {
      id: "select-property",
      question: "¿Cómo selecciono una propiedad para simular?",
      answer:
        'Navegue a "Catálogo de Proyectos", busque o filtre las propiedades disponibles, y haga clic en "Ver Detalles" o "Simular Crédito" en la propiedad de su interés.',
    },
    {
      id: "tea-vs-tna",
      question: "¿Qué diferencia hay entre TEA y TNA?",
      answer:
        "TEA (Tasa Efectiva Anual) incluye la capitalización de intereses, mientras que TNA (Tasa Nominal Anual) es la tasa sin capitalización. Para comparar ofertas bancarias, siempre use la TEA.",
    },
    {
      id: "grace-period",
      question: "¿Qué es el período de gracia?",
      answer:
        "Es un tiempo donde no se paga la cuota completa. Gracia Total: no se paga capital ni intereses. Gracia Parcial: solo se pagan intereses. Aumenta el costo total del crédito.",
    },
    {
      id: "tcea-calculation",
      question: "¿Cómo se calcula la TCEA?",
      answer:
        "La TCEA (Tasa de Costo Efectivo Anual) incluye todos los costos: intereses, comisiones, seguros y gastos administrativos. Se calcula automáticamente en el simulador basándose en los parámetros ingresados.",
    },
    {
      id: "state-bonus",
      question: "¿Qué requisitos tiene el Bono Techo Propio?",
      answer:
        "El Bono Techo Propio es un subsidio del estado peruano. Requisitos principales: primera vivienda, ingresos familiares mensuales entre S/ 1,360 y S/ 2,580, propiedad menor a S/ 140,000.",
    },
    {
      id: "export-results",
      question: "¿Cómo exporto los resultados?",
      answer:
        'En la pantalla de resultados, use los botones "Descargar PDF" o "Exportar Excel" para guardar la simulación. También puede enviarla por email directamente al cliente.',
    },
    {
      id: "send-simulation",
      question: "¿Cómo envío la simulación al cliente?",
      answer:
        'En los resultados de la simulación, haga clic en "Enviar por Email", ingrese el email del cliente y personalice el mensaje. El sistema enviará automáticamente el PDF adjunto.',
    },
  ];

  const glossaryData = [
    {
      term: "Amortización",
      definition:
        "Pago progresivo del capital del préstamo a lo largo del tiempo, reduciendo gradualmente la deuda.",
    },
    {
      term: "TCEA",
      definition:
        "Tasa de Costo Efectivo Anual. Incluye todos los costos del crédito: intereses, comisiones, seguros y gastos.",
    },
    {
      term: "TEA",
      definition:
        "Tasa Efectiva Anual. Tasa de interés que incluye la capitalización, permitiendo comparaciones directas.",
    },
    {
      term: "TNA",
      definition:
        "Tasa Nominal Anual. Tasa de interés sin considerar la capitalización, requiere especificar frecuencia.",
    },
    {
      term: "TIR",
      definition:
        "Tasa Interna de Retorno. Tasa que hace que el VAN sea igual a cero, útil para evaluar rentabilidad.",
    },
    {
      term: "VAN",
      definition:
        "Valor Actual Neto. Valor presente de todos los flujos futuros del préstamo descontados a una tasa específica.",
    },
    {
      term: "Duración",
      definition:
        "Tiempo promedio ponderado de recuperación de los flujos de caja, medida en años.",
    },
    {
      term: "Duración Modificada",
      definition:
        "Sensibilidad del precio del bono a cambios en las tasas de interés, expresada como porcentaje.",
    },
    {
      term: "Convexidad",
      definition:
        "Medida de la curvatura de la relación precio-rendimiento, complementa a la duración modificada.",
    },
    {
      term: "Período de Gracia",
      definition:
        "Tiempo inicial donde el pago de capital se difiere (gracia total) o solo se pagan intereses (gracia parcial).",
    },
    {
      term: "Capitalización",
      definition:
        "Frecuencia con que los intereses devengados se agregan al capital para generar nuevos intereses.",
    },
    {
      term: "Cuota Inicial",
      definition:
        "Porcentaje del precio de la propiedad que se paga al contado antes de obtener el financiamiento.",
    },
  ];

  const downloadManual = async () => {
    setIsDownloading(true);
    try {
      if (MANUAL_URL) {
        window.open(MANUAL_URL, "_blank", "noopener,noreferrer");
      } else {
        alert("El manual no está configurado. Contacte al administrador.");
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            <span>Centro de Ayuda - SimulaCredit</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">Preguntas Frecuentes</TabsTrigger>
            <TabsTrigger value="glossary">Glosario Financiero</TabsTrigger>
            <TabsTrigger value="support">Contacto y Soporte</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-6">
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg mb-2">Preguntas Frecuentes</h3>
                <p className="text-sm text-gray-600">
                  Encuentre respuestas rápidas a las consultas más comunes sobre
                  el uso del sistema.
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </TabsContent>

          <TabsContent value="glossary" className="mt-6">
            <div className="space-y-4">
              <div className="mb-4">
                <h3 className="text-lg mb-2">Glosario Financiero</h3>
                <p className="text-sm text-gray-600">
                  Definiciones de términos financieros utilizados en el sistema
                  de simulación.
                </p>
              </div>

              <div className="grid gap-4">
                {glossaryData.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <h4 className="text-blue-900 mb-2">{item.term}</h4>
                      <p className="text-sm text-gray-700">{item.definition}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <div className="space-y-6">
              <div className="mb-4">
                <h3 className="text-lg mb-2">Contacto y Soporte</h3>
                <p className="text-sm text-gray-600">
                  Canales de comunicación para asistencia técnica y soporte al
                  usuario.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <span>Soporte Técnico</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Email de soporte:</p>
                      <p className="text-blue-600">soporte@simulacredit.com</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        Tiempo de respuesta:
                      </p>
                      <p>24-48 horas hábiles</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      <span>Asistencia Telefónica</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Teléfono:</p>
                      <p className="text-green-600">+51 1 234-5678</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Anexo soporte:</p>
                      <p>123</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <span>Horario de Atención</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">
                        Lunes - Viernes:
                      </span>
                      <span>8:00 AM - 6:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Sábados:</span>
                      <span>9:00 AM - 1:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Domingos:</span>
                      <span className="text-red-600">Cerrado</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span>Documentación</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={downloadManual}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-2"
                      size="sm"
                      disabled={isDownloading}
                      aria-busy={isDownloading}
                    >
                      {isDownloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isDownloading
                        ? "Preparando..."
                        : "Manual de Usuario (PDF)"}
                    </Button>
                    <p className="text-xs text-gray-500">
                      Última actualización: Diciembre 2024
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <MessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="text-blue-900 mb-1">
                        ¿Necesita ayuda inmediata?
                      </h4>
                      <p className="text-sm text-blue-800">
                        Para problemas urgentes durante horario laboral, llame
                        directamente a nuestro número principal y solicite ser
                        transferido al departamento de soporte técnico.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-6">
          <Button className="bg-blue-600 text-white" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
