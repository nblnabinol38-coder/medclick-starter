"use client";

import { ChangeEvent } from "react";
import {
  Box,
  CirclePlus,
  Pill,
  Search,
  Trash2,
} from "lucide-react";

export type MedicationItem = {
  id: string;
  name: string;
  dosage: string;
  pharmaceuticalForm: string;
  boxQuantity: number;
  instructions: string;
  notes: string;
};

type PrescriptionFieldsProps = {
  medications: MedicationItem[];
  onChange: (medications: MedicationItem[]) => void;
  disabled?: boolean;
};

const pharmaceuticalForms = [
  "Comprimido",
  "Cápsula",
  "Solução oral",
  "Gotas",
  "Xarope",
  "Pomada",
  "Creme",
  "Gel",
  "Spray",
  "Inalador",
  "Ampola",
  "Injetável",
  "Supositório",
  "Outro",
];

function createMedication(): MedicationItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    dosage: "",
    pharmaceuticalForm: "",
    boxQuantity: 1,
    instructions: "",
    notes: "",
  };
}

export default function PrescriptionFields({
  medications,
  onChange,
  disabled = false,
}: PrescriptionFieldsProps) {
  function updateMedication(
    id: string,
    field: keyof MedicationItem,
    value: string | number,
  ) {
    onChange(
      medications.map((medication) =>
        medication.id === id
          ? {
              ...medication,
              [field]: value,
            }
          : medication,
      ),
    );
  }

  function addMedication() {
    if (medications.length >= 3) {
      return;
    }

    onChange([...medications, createMedication()]);
  }

  function removeMedication(id: string) {
    if (medications.length === 1) {
      onChange([createMedication()]);
      return;
    }

    onChange(
      medications.filter((medication) => medication.id !== id),
    );
  }

  function handleBoxQuantity(
    event: ChangeEvent<HTMLInputElement>,
    medicationId: string,
  ) {
    const value = Number(event.target.value);

    updateMedication(
      medicationId,
      "boxQuantity",
      Number.isFinite(value) && value >= 1 ? value : 1,
    );
  }

  return (
    <section className="mt-7 rounded-3xl border border-teal-200 bg-teal-50/60 p-5 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white">
              <Pill size={24} aria-hidden="true" />
            </span>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                Medicamentos solicitados
              </h3>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Informe até três medicamentos para análise do médico.
              </p>
            </div>
          </div>
        </div>

        <span className="inline-flex w-fit rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700">
          {medications.length} de 3 medicamentos
        </span>
      </div>

      <div className="mt-7 space-y-6">
        {medications.map((medication, index) => (
          <article
            key={medication.id}
            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-lg font-bold text-slate-900">
                Medicamento {index + 1}
              </h4>

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeMedication(medication.id)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remover medicamento ${index + 1}`}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Nome do medicamento
                </span>

                <div className="relative">
                  <Search
                    size={19}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    required
                    disabled={disabled}
                    value={medication.name}
                    onChange={(event) =>
                      updateMedication(
                        medication.id,
                        "name",
                        event.target.value,
                      )
                    }
                    placeholder="Digite para pesquisar o medicamento"
                    autoComplete="off"
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>

                <p className="text-xs leading-5 text-slate-500">
                  A busca serve apenas para organizar o pedido. A prescrição,
                  a dosagem e a aprovação dependem do médico responsável.
                </p>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Dosagem ou concentração
                </span>

                <input
                  required
                  disabled={disabled}
                  value={medication.dosage}
                  onChange={(event) =>
                    updateMedication(
                      medication.id,
                      "dosage",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: 500 mg, 20 mg/ml"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Forma farmacêutica
                </span>

                <select
                  required
                  disabled={disabled}
                  value={medication.pharmaceuticalForm}
                  onChange={(event) =>
                    updateMedication(
                      medication.id,
                      "pharmaceuticalForm",
                      event.target.value,
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                >
                  <option value="" disabled>
                    Selecione
                  </option>

                  {pharmaceuticalForms.map((form) => (
                    <option key={form} value={form}>
                      {form}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Quantidade de caixas
                </span>

                <div className="relative">
                  <Box
                    size={19}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    required
                    disabled={disabled}
                    type="number"
                    min={1}
                    max={20}
                    value={medication.boxQuantity}
                    onChange={(event) =>
                      handleBoxQuantity(event, medication.id)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Como utiliza ou utilizou
                </span>

                <input
                  required
                  disabled={disabled}
                  value={medication.instructions}
                  onChange={(event) =>
                    updateMedication(
                      medication.id,
                      "instructions",
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: uso anterior ou orientação recebida"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>

              <label className="block space-y-2 md:col-span-2">
                <span className="text-sm font-semibold text-slate-700">
                  Observações sobre este medicamento — opcional
                </span>

                <textarea
                  disabled={disabled}
                  value={medication.notes}
                  onChange={(event) =>
                    updateMedication(
                      medication.id,
                      "notes",
                      event.target.value,
                    )
                  }
                  rows={3}
                  placeholder="Informe receita anterior, alergias conhecidas ou outras observações relevantes."
                  className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
                />
              </label>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        disabled={disabled || medications.length >= 3}
        onClick={addMedication}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-300 bg-white px-5 py-4 font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <CirclePlus size={20} aria-hidden="true" />

        {medications.length >= 3
          ? "Limite de três medicamentos atingido"
          : "Adicionar outro medicamento"}
      </button>
    </section>
  );
}

export function createInitialMedication(): MedicationItem {
  return createMedication();
}