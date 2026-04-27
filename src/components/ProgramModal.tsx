import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/context/I18nContext";
import { CheckCircle2 } from "lucide-react";

interface ProgramModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProgramModal({ isOpen, onOpenChange }: ProgramModalProps) {
  const { t } = useI18n();

  const lessons = [
    "El origen del universo",
    "La llegada de la vida en la Tierra",
    "La aparición del ser humano",
    "La evolución de la escritura",
    "El desarrollo de los números"
  ];

  const learnings = [
    "Desarrollar pensamiento lógico-matemático",
    "Fortalecer la lectura, escritura y expresión oral",
    "Investigar en ciencias naturales e historia",
    "Comprender su entorno desde una visión global e interconectada",
    "Trabajar de forma colaborativa y tomar responsabilidad por su aprendizaje"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-forest mb-2">
            {t("Taller -Comunidad de Primaria (6 a 12 años)")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base leading-relaxed">
            {t("Taller es la etapa de Comunidad de Primaria, donde los niños de 6 a 12 años transitan hacia una mente profundamente curiosa, razonadora y social. Basado en la visión de María Montessori, este nivel responde a su necesidad de comprender el mundo, cuestionar, investigar y colaborar.")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <h4 className="font-semibold text-forest mb-3">
              {t("El aprendizaje se articula a través de las Grandes Lecciones, historias fundamentales que despiertan la imaginación y el asombro:")}
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {lessons.map((lesson) => (
                <li key={lesson} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-terracotta mt-0.5 flex-shrink-0" />
                  <span>{t(lesson)}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-3 italic">
              {t("A partir de estas, los niños profundizan en distintas áreas del conocimiento.")}
            </p>
          </div>

          <div className="bg-forest/5 p-6 rounded-2xl border border-forest/10">
            <h4 className="font-semibold text-forest mb-3">
              {t("En Taller los niños aprenden a:")}
            </h4>
            <ul className="space-y-2">
              {learnings.map((learning) => (
                <li key={learning} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <div className="w-1.5 h-1.5 rounded-full bg-terracotta mt-1.5 flex-shrink-0" />
                  <span>{t(learning)}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-forest font-medium text-center italic">
            {t("Más que memorizar, los niños construyen conocimiento con sentido, conectando ideas y desarrollando herramientas para la vida.")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
