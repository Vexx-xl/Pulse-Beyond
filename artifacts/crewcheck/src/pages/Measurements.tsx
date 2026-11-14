import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Activity, CircleHelp, Gauge, Info, Save } from "lucide-react";
import { crew } from "@/lib/crew-data";
import { useRecords } from "@/lib/records-context";
import type { Measurement } from "@/lib/local-store";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MEASUREMENT_GUIDES } from "@/content/measurement-guides";

const schema = z.object({
  personId: z.string().min(1),
  observer: z.string().min(1),
  systolic: z.string().refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "Use numbers only."),
  diastolic: z.string().refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "Use numbers only."),
  spo2: z.string().refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "Use numbers only."),
  pulse: z.string().refine((value) => value === "" || /^\d+(\.\d+)?$/.test(value), "Use numbers only."),
  device: z.string().trim().min(1, "Enter the device or choose unavailable."),
  quality: z.enum(["recorded", "needs-confirmation", "unable-to-obtain"]),
  note: z.string().max(600),
});

type Values = z.infer<typeof schema>;
type GuideKind = Measurement["kind"];

export default function MeasurementsPage() {
  const { measurements, saveMeasurement, persistence, settings } = useRecords();
  const [kind, setKind] = useState<GuideKind>("blood-pressure");
  const [message, setMessage] = useState("");
  const copy = MEASUREMENT_GUIDES[kind];
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      personId: crew[0].id,
      observer: "Self",
      systolic: "",
      diastolic: "",
      spo2: "",
      pulse: "",
      device: "",
      quality: "recorded",
      note: "",
    },
  });
  const submit = async (values: Values) => {
    setMessage("");
    if (values.quality !== "unable-to-obtain") {
      const requiredFields = kind === "blood-pressure" ? [values.systolic, values.diastolic] : [values.spo2];
      if (requiredFields.some((value) => value.trim() === "")) {
        setMessage(kind === "blood-pressure" ? "Enter both systolic and diastolic values, or choose unable to obtain." : "Enter an SpO₂ value, or choose unable to obtain.");
        return;
      }
    }
    const person = crew.find((entry) => entry.id === values.personId) || crew[0];
    const measurement: Measurement = {
      id: crypto.randomUUID(),
      kind,
      personId: person.id,
      personName: person.name,
      observer: values.observer,
      at: new Date().toISOString(),
      ...(kind === "blood-pressure" && values.systolic !== "" ? { systolic: Number(values.systolic) } : {}),
      ...(kind === "blood-pressure" && values.diastolic !== "" ? { diastolic: Number(values.diastolic) } : {}),
      ...(kind === "pulse-ox" && values.spo2 !== "" ? { spo2: Number(values.spo2) } : {}),
      ...(kind === "pulse-ox" && values.pulse !== "" ? { pulse: Number(values.pulse) } : {}),
      device: values.device,
      quality: values.quality,
      note: values.note,
      source: "manual-entry",
      simulated: true,
    };
    try {
      await saveMeasurement(measurement);
      setMessage("Reading saved locally as a fictional, user-entered record.");
      form.reset({ ...form.getValues(), systolic: "", diastolic: "", spo2: "", pulse: "", note: "" });
    } catch {
      setMessage("Could not save this reading. Check the local-storage status before continuing.");
    }
  };
  const visibleRecords = measurements.filter((item) => item.kind === kind).slice(0, 8);

  return <div className="reveal">
    <header className="mb-7">
      <p className="eyebrow">Measurement guides · draft content</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Record a measurement</h1>
      <p className="mt-3 max-w-2xl leading-6 text-muted-foreground">Manual entry only. No camera or connected device readings are supported, and this screen does not interpret values.</p>
    </header>

    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Choose measurement">
      {(["blood-pressure", "pulse-ox"] as const).map((value) => <button key={value} type="button" className={kind === value ? "btn btn-primary" : "btn btn-soft"} onClick={() => { setKind(value); setMessage(""); }} data-testid={`button-measurement-${value}`}>
        {value === "blood-pressure" ? <Activity size={17}/> : <Gauge size={17}/>} {MEASUREMENT_GUIDES[value].title}
      </button>)}
    </div>

    <div className="mb-5 grid gap-4 lg:grid-cols-3">
      <section className="card p-5">
        <p className="eyebrow">Why it matters</p>
        <p className="mt-2 text-sm leading-6">{copy.reason}</p>
      </section>
      <section className="card p-5">
        <p className="eyebrow">Equipment</p>
        <p className="mt-2 text-sm leading-6">{copy.equipment}</p>
      </section>
      <section className="card border-[hsl(var(--accent)/.45)] p-5">
        <p className="eyebrow text-[hsl(var(--accent))]">Applicability and limits</p>
        <p className="mt-2 text-sm leading-6">{copy.applicability}</p>
      </section>
    </div>

    <section className="mb-5 flex items-start gap-3 rounded-xl border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] p-4 text-sm leading-6" role="note" data-testid="notice-measurement-review">
      <Info className="mt-0.5 shrink-0 text-[hsl(var(--accent))]" size={18}/>
      <p><strong>Source review required.</strong> Step-by-step preparation, positioning, and quality instructions remain unavailable until reviewed for the device and selected mission environment. Do not delay urgent help to obtain a reading. A normal-looking value does not clear serious symptoms.</p>
    </section>

    <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="card p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]">{kind === "blood-pressure" ? <Activity/> : <Gauge/>}</span>
          <div><p className="eyebrow">Entered on this device</p><h2 className="text-xl font-extrabold">{copy.title} record</h2></div>
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={form.control} name="personId" render={({ field }) => <FormItem><FormLabel>Person</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-measurement-person">{crew.map((person) => <option value={person.id} key={person.id}>{person.name} · fictional</option>)}</select></FormControl><FormMessage/></FormItem>}/>
              <FormField control={form.control} name="observer" render={({ field }) => <FormItem><FormLabel>Operator</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-measurement-operator"><option>Self</option>{crew.map((person) => <option key={person.id}>{person.name}</option>)}</select></FormControl><FormMessage/></FormItem>}/>
            </div>
            <FormField control={form.control} name="device" render={({ field }) => <FormItem><FormLabel>Device or reason unavailable</FormLabel><FormControl><input className="field mt-2" {...field} placeholder="Device name, or “equipment unavailable”" data-testid="input-measurement-device"/></FormControl><FormMessage/></FormItem>}/>
            <FormField control={form.control} name="quality" render={({ field }) => <FormItem><FormLabel>Reading status</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-measurement-quality"><option value="recorded">Reading entered; quality not verified by app</option><option value="needs-confirmation">Reading needs confirmation</option><option value="unable-to-obtain">Unable to obtain / equipment unavailable</option></select></FormControl><FormMessage/></FormItem>}/>
            {form.watch("quality") !== "unable-to-obtain" && <div className="grid gap-4 sm:grid-cols-2">
              {kind === "blood-pressure" ? <>
                {(["systolic", "diastolic"] as const).map((fieldName) => <FormField key={fieldName} control={form.control} name={fieldName} render={({ field }) => <FormItem><FormLabel>{fieldName === "systolic" ? "Systolic" : "Diastolic"} · mmHg</FormLabel><FormControl><input className="field mt-2" type="number" inputMode="decimal" min="0" max="1000" step="any" {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value)} data-testid={`input-measurement-${fieldName}`}/></FormControl><FormMessage/></FormItem>}/>)}
              </> : <>
                <FormField control={form.control} name="spo2" render={({ field }) => <FormItem><FormLabel>SpO₂ · percent</FormLabel><FormControl><input className="field mt-2" type="number" inputMode="decimal" min="0" max="100" step="any" {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value)} data-testid="input-measurement-spo2"/></FormControl><FormMessage/></FormItem>}/>
                <FormField control={form.control} name="pulse" render={({ field }) => <FormItem><FormLabel>Pulse · beats per minute, if available</FormLabel><FormControl><input className="field mt-2" type="number" inputMode="decimal" min="0" max="1000" step="any" {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value)} data-testid="input-measurement-pulse"/></FormControl><FormMessage/></FormItem>}/>
              </>}
            </div>}
            <FormField control={form.control} name="note" render={({ field }) => <FormItem><FormLabel>Quality note or limitation</FormLabel><FormControl><textarea className="field mt-2 min-h-24" {...field} placeholder="Optional; preserve uncertainty." data-testid="input-measurement-note"/></FormControl><FormMessage/></FormItem>}/>
            <p className="text-xs leading-5 text-muted-foreground">Values are checked as numeric entries only. No clinical threshold or interpretation is applied. The timestamp is recorded when saved.</p>
            <button className="btn btn-primary" type="submit" disabled={!persistence.ready} data-testid="button-save-measurement"><Save size={17}/> Save local reading</button>
            {message && <p role="status" className="text-sm font-semibold" data-testid="status-measurement-save">{message}</p>}
          </form>
        </Form>
      </section>

      <aside className="grid content-start gap-4">
        <section className="card p-5">
          <p className="eyebrow">Selected mission</p>
          <h2 className="mt-2 font-bold">{settings.profile === "station" ? "Space station" : settings.profile === "spacecraft" ? "Spacecraft" : "Lunar surface base"}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{settings.profile === "station" ? "Fictional space-station configuration. Use only equipment-specific, reviewed instructions." : "Mission-specific procedure applicability has not been established for this profile. Use the supported mission escalation route."}</p>
        </section>
        <section className="card p-5">
          <div className="flex items-center gap-2"><CircleHelp size={17}/><p className="eyebrow">Not available in this draft</p></div>
          <ul className="mt-3 space-y-2 text-sm leading-5 text-muted-foreground">
            <li>Positioning and preparation steps</li>
            <li>Device-specific quality checks</li>
            <li>Clinical interpretation or thresholds</li>
            <li>Microgravity-specific measurement procedures</li>
          </ul>
        </section>
        <section className="card p-5">
          <p className="eyebrow">Recent local records</p>
          {visibleRecords.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No readings recorded on this device.</p> : <ul className="mt-3 space-y-3">{visibleRecords.map((item) => <li className="border-t pt-3 text-sm" key={item.id} data-testid={`measurement-record-${item.id}`}><div className="flex justify-between gap-2"><strong>{item.personName}</strong><time className="text-xs text-muted-foreground">{new Date(item.at).toLocaleString()}</time></div><p className="mt-1 text-muted-foreground">{item.kind === "blood-pressure" ? `${item.systolic ?? "—"} / ${item.diastolic ?? "—"} mmHg` : `SpO₂ ${item.spo2 ?? "—"}%${item.pulse === undefined ? "" : ` · pulse ${item.pulse} bpm`}`}</p><p className="text-xs text-muted-foreground">{item.quality.replaceAll("-", " ")} · manual entry · fictional profile</p></li>)}</ul>}
        </section>
      </aside>
    </div>
  </div>;
}
