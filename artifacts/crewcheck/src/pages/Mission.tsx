import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CalendarClock, Check, ClipboardCheck, Info, MapPin, Package, Radio, Save, ShieldAlert, Sparkles } from "lucide-react";
import { crew } from "@/lib/crew-data";
import { useRecords } from "@/lib/records-context";
import type { MissionSettings, Reminder, WellbeingEntry } from "@/lib/local-store";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { SOURCE_INDEX, SOURCE_INDEX_STATUS } from "@/content/source-index";

type ProfileId = MissionSettings["profile"];
type TabId = "configuration" | "equipment" | "routines" | "evidence";

const profiles: Record<ProfileId, {
  label: string;
  gravity: string;
  zones: string[];
  equipment: { name: string; location: string }[];
  crewContext: string[];
  schedule: string[];
  communicationNote: string;
}> = {
  station: {
    label: "Space station",
    gravity: "Microgravity context. No microgravity-specific medical procedure is supplied here.",
    zones: ["Exercise area", "Living / sleep area", "Medical / work area"],
    equipment: [
      { name: "Manual blood-pressure cuff", location: "Medical / work area · fictional placement" },
      { name: "Pulse oximeter", location: "Medical / work area · fictional placement" },
      { name: "First-aid kit", location: "Medical / work area · fictional placement" },
    ],
    crewContext: ["Sana Okafor · crew health officer · fictional metadata", "Eli Navarro · mission specialist · fictional metadata"],
    schedule: ["Daily wellbeing check-in · fictional schedule", "Measurement window · mission-configured", "Exercise period · fictional schedule"],
    communicationNote: "Contact availability must be configured for the scenario; no live communication link exists.",
  },
  spacecraft: {
    label: "Spacecraft",
    gravity: "Mission-specific gravity context is not configured; no procedure substitutions are provided.",
    zones: ["Forward cabin", "Crew berths", "Medical stowage area"],
    equipment: [
      { name: "Manual blood-pressure cuff", location: "Medical stowage area · fictional placement" },
      { name: "Pulse oximeter", location: "Medical stowage area · fictional placement" },
      { name: "First-aid kit", location: "Forward cabin · fictional placement" },
    ],
    crewContext: ["Crew health role · assigned per mission configuration", "Additional helper role · assigned per mission configuration"],
    schedule: ["Daily check-in · fictional schedule", "Measurement timing · mission-configured", "Crew routine · fictional schedule"],
    communicationNote: "Availability is not inferred from the vehicle type. Configure status and delay explicitly.",
  },
  lunar: {
    label: "Lunar surface base",
    gravity: "Partial-gravity context. No lunar-specific procedure adjustments are supplied.",
    zones: ["Habitat interior", "EVA preparation area", "Medical / work area"],
    equipment: [
      { name: "Manual blood-pressure cuff", location: "Medical / work area · fictional placement" },
      { name: "Pulse oximeter", location: "Medical / work area · fictional placement" },
      { name: "First-aid kit", location: "Medical / work area · fictional placement" },
    ],
    crewContext: ["Crew health role · assigned per mission configuration", "EVA support role · assigned per mission configuration"],
    schedule: ["Daily check-in · fictional schedule", "Measurement timing · mission-configured", "Surface activity routine · fictional schedule"],
    communicationNote: "Contact availability is mission-specific. Configure status and delay explicitly.",
  },
};

const settingsSchema = z.object({
  profile: z.enum(["station", "spacecraft", "lunar"]),
  communicationDelay: z.string().max(100),
  communicationStatus: z.enum(["not-configured", "available-scenario", "delayed-scenario", "unavailable-scenario"]),
});
const followUpSchema = z.object({
  title: z.string().trim().min(3, "Enter a short task name.").max(100),
  dueAt: z.string().min(1, "Choose a date and time."),
});
const wellbeingSchema = z.object({
  personId: z.string().min(1),
  sleepHours: z.string().refine((value) => value === "" || (/^\d+(\.\d+)?$/.test(value) && Number(value) <= 24), "Enter hours from 0 to 24."),
  sleepQuality: z.string().min(1),
  fatigue: z.string().min(1),
  mood: z.string().min(1),
  privateNote: z.string().max(600),
});

type SettingsValues = z.infer<typeof settingsSchema>;
type FollowUpValues = z.infer<typeof followUpSchema>;
type WellbeingValues = z.infer<typeof wellbeingSchema>;

function tasksFor(profile: ProfileId): Reminder[] {
  const now = Date.now();
  const entries = [
    { suffix: "wellbeing", title: "Daily wellbeing check-in", category: "wellbeing" as const, offset: 0 },
    { suffix: "measurement", title: "Mission-scheduled measurement", category: "measurement" as const, offset: 2 },
    { suffix: "routine", title: "Crew routine / exercise period", category: "routine" as const, offset: 5 },
  ];
  return entries.map((entry) => ({
    id: `${profile}-${entry.suffix}`,
    title: entry.title,
    dueAt: new Date(now + entry.offset * 60 * 60 * 1000).toISOString(),
    status: "due" as const,
    category: entry.category,
    profile,
    fictional: true as const,
  }));
}

export default function MissionPage() {
  const { settings, saveSettings, reminders, saveReminder, persistence, incidents, wellbeing, saveWellbeing } = useRecords();
  const [message, setMessage] = useState("");
  const profile = profiles[settings.profile];
  const activeIncident = incidents.some((item) => item.status !== "Closed");
  const profileReminders = useMemo(() => reminders.filter((item) => item.profile === settings.profile).sort((a, b) => a.dueAt.localeCompare(b.dueAt)), [reminders, settings.profile]);

  const settingsForm = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { profile: settings.profile, communicationDelay: settings.communicationDelay, communicationStatus: settings.communicationStatus },
  });
  const followUpForm = useForm<FollowUpValues>({
    resolver: zodResolver(followUpSchema),
    defaultValues: { title: "", dueAt: "" },
  });
  const wellbeingForm = useForm<WellbeingValues>({
    resolver: zodResolver(wellbeingSchema),
    defaultValues: { personId: crew[0].id, sleepHours: "", sleepQuality: "Not recorded", fatigue: "Not recorded", mood: "Not recorded", privateNote: "" },
  });

  useEffect(() => {
    settingsForm.reset({ profile: settings.profile, communicationDelay: settings.communicationDelay, communicationStatus: settings.communicationStatus });
  }, [settings, settingsForm]);

  useEffect(() => {
    if (!persistence.ready || reminders.some((item) => item.profile === settings.profile)) return;
    void Promise.all(tasksFor(settings.profile).map((task) => saveReminder(task))).catch(() => setMessage("Could not initialize the fictional routine schedule."));
  }, [persistence.ready, reminders, settings.profile, saveReminder]);

  const saveMission = async (values: SettingsValues) => {
    const next: MissionSettings = { id: "mission-settings", profile: values.profile, communicationDelay: values.communicationDelay.trim(), communicationStatus: values.communicationStatus };
    try {
      await saveSettings(next);
      setMessage("Mission configuration saved on this device.");
    } catch {
      setMessage("Mission configuration could not be saved.");
    }
  };

  const updateReminder = async (reminder: Reminder, nextStatus: Reminder["status"]) => {
    const next: Reminder = {
      ...reminder,
      status: nextStatus,
      dueAt: nextStatus === "rescheduled" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : reminder.dueAt,
    };
    try {
      await saveReminder(next);
      setMessage(nextStatus === "rescheduled" ? "Task rescheduled for 24 hours later (fictional prototype schedule)." : "Task marked complete.");
    } catch {
      setMessage("Task status could not be saved.");
    }
  };

  const addFollowUp = async (values: FollowUpValues) => {
    const task: Reminder = {
      id: crypto.randomUUID(),
      title: values.title,
      dueAt: new Date(values.dueAt).toISOString(),
      status: "due",
      category: "follow-up",
      profile: settings.profile,
      fictional: true,
    };
    try {
      await saveReminder(task);
      followUpForm.reset({ title: "", dueAt: "" });
      setMessage("Follow-up saved locally. Set timing from an approved or mission-configured source.");
    } catch {
      setMessage("Follow-up could not be saved.");
    }
  };

  const saveWellbeingEntry = async (values: WellbeingValues) => {
    const person = crew.find((item) => item.id === values.personId) || crew[0];
    const entry: WellbeingEntry = {
      id: crypto.randomUUID(),
      personId: person.id,
      personName: person.name,
      at: new Date().toISOString(),
      sleepHours: values.sleepHours === "" ? null : Number(values.sleepHours),
      sleepQuality: values.sleepQuality,
      fatigue: values.fatigue,
      mood: values.mood,
      privateNote: values.privateNote,
    };
    try {
      await saveWellbeing(entry);
      wellbeingForm.reset({ ...wellbeingForm.getValues(), sleepHours: "", privateNote: "" });
      setMessage("Wellbeing entry saved locally and excluded from the handoff.");
    } catch {
      setMessage("Wellbeing entry could not be saved.");
    }
  };

  const [panel, setPanel] = useState<TabId | null>(null);
  const [task, setTask] = useState<"list" | "followup" | "wellbeing">("list");
  const commLabel: Record<SettingsValues["communicationStatus"], string> = {
    "not-configured": "Not set up yet",
    "available-scenario": "Available",
    "delayed-scenario": "Delayed",
    "unavailable-scenario": "Not available",
  };
  const nextTask = profileReminders.find((item) => item.status !== "completed");
  const open = (id: TabId) => { setPanel(panel === id ? null : id); setMessage(""); if (id === "routines") setTask("list"); };
  const areas: { id: TabId; label: string; hint: string; icon: typeof Radio }[] = [
    { id: "routines", label: "Daily tasks", hint: "Check off tasks or add a private check-in", icon: CalendarClock },
    { id: "configuration", label: "Change setup", hint: "Where you are and how you reach support", icon: Radio },
    { id: "equipment", label: "Where things are", hint: "Sample equipment locations", icon: Package },
    { id: "evidence", label: "Sources", hint: "References behind this app", icon: Info },
  ];
  const statusText = (s: string) => s === "overdue" ? "Late" : s === "completed" ? "Done" : s === "rescheduled" ? "Moved" : "To do";

  return <div className="reveal">
    <header className="mb-6">
      <p className="eyebrow">Mission</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Your setup</h1>
      <p className="mt-2 text-sm text-muted-foreground" data-testid="notice-prototype">Training prototype with sample data. It does not give medical advice.</p>
    </header>

    <section className="card mission-summary p-5 sm:p-7" data-testid="card-mission-summary">
      <dl className="grid gap-4 sm:grid-cols-3">
        <div><dt className="eyebrow">Location</dt><dd className="mt-1 text-xl font-extrabold" data-testid="text-current-profile">{profile.label}</dd></div>
        <div><dt className="eyebrow">Support setting · demo</dt><dd className="mt-1 text-xl font-extrabold" data-testid="text-current-comm">{commLabel[settings.communicationStatus]}</dd></div>
        <div><dt className="eyebrow">Message delay</dt><dd className="mt-1 text-xl font-extrabold" data-testid="text-current-delay">{settings.communicationDelay || "Not set"}</dd></div>
      </dl>
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-5">
        {activeIncident
          ? <p className="flex-1 text-sm font-semibold" role="status" data-testid="status-routines-paused-summary">An incident is open. Daily tasks are paused.</p>
          : <p className="flex-1 text-sm" data-testid="text-next-task">{nextTask ? <>Next: <strong>{nextTask.title}</strong></> : "No tasks waiting."}</p>}
        {activeIncident ? <Link href="/emergency" className="btn btn-danger no-underline">Return to help record</Link> : <button className="btn btn-primary" onClick={() => open("routines")} data-testid="button-open-tasks"><CalendarClock size={17}/> Open daily tasks</button>}
      </div>
    </section>

    <div className="mt-5 grid gap-3 sm:grid-cols-2" aria-label="More mission options">
      {areas.map(({ id, label, hint, icon: Icon }) => <button key={id} aria-expanded={panel === id} aria-controls={`mission-${id}`} className={`mission-option ${panel === id ? "is-open" : ""}`} onClick={() => open(id)} data-testid={`tab-mission-${id}`}>
        <Icon size={20}/><span className="text-left"><span className="block font-bold">{label}</span><span className="block text-xs text-muted-foreground">{hint}</span></span>
      </button>)}
    </div>

    {message && <p role="status" className="mt-4 rounded-xl bg-[hsl(var(--primary)/.08)] p-3 text-sm font-semibold" data-testid={panel === "configuration" ? "status-mission-save" : "status-mission-message"}>{message}</p>}

    {panel === "configuration" && <section id="mission-configuration" className="card reveal mt-5 p-5 sm:p-7">
      <h2 className="mb-4 text-xl font-extrabold">Change setup</h2>
      <Form {...settingsForm}>
        <form className="space-y-5" onSubmit={settingsForm.handleSubmit(saveMission)}>
          <FormField control={settingsForm.control} name="profile" render={({ field }) => <FormItem><FormLabel>Where are you?</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-mission-profile"><option value="station">Space station</option><option value="spacecraft">Spacecraft</option><option value="lunar">Lunar surface base</option></select></FormControl><FormMessage/></FormItem>}/>
          <FormField control={settingsForm.control} name="communicationStatus" render={({ field }) => <FormItem><FormLabel>Can you reach support?</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-communication-status"><option value="not-configured">Not set up yet</option><option value="available-scenario">Yes, available</option><option value="delayed-scenario">Yes, with a delay</option><option value="unavailable-scenario">No, not available</option></select></FormControl><FormMessage/></FormItem>}/>
          <FormField control={settingsForm.control} name="communicationDelay" render={({ field }) => <FormItem><FormLabel>Message delay (optional)</FormLabel><FormControl><input className="field mt-2" {...field} placeholder="For example: 20 minutes" data-testid="input-communication-delay"/></FormControl><p className="mt-1 text-xs text-muted-foreground">Only what you enter is used. Nothing is guessed.</p><FormMessage/></FormItem>}/>
          <button className="btn btn-primary" type="submit" disabled={!persistence.ready} data-testid="button-save-mission"><Save size={17}/> Save setup</button>
        </form>
      </Form>
      <details className="mt-5 border-t pt-4"><summary className="cursor-pointer text-sm font-bold">More about this location</summary>
        <p className="mt-3 text-sm text-muted-foreground">{profile.gravity}</p>
        <p className="eyebrow mt-4">Areas</p><ul className="mt-2 space-y-1 text-sm">{profile.zones.map((zone) => <li key={zone} className="flex items-center gap-2"><MapPin size={14}/>{zone}</li>)}</ul>
        <p className="eyebrow mt-4">Crew roles (sample)</p><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{profile.crewContext.map((item) => <li key={item}>{item}</li>)}</ul>
        <p className="mt-4 text-xs text-muted-foreground">{profile.communicationNote} Changing the location never changes medical steps.</p>
      </details>
    </section>}

    {panel === "equipment" && <section id="mission-equipment" className="card reveal mt-5 p-5 sm:p-7">
      <h2 className="mb-4 text-xl font-extrabold">Where things are</h2>
      <ul className="divide-y">{profile.equipment.map((item) => <li className="flex flex-wrap items-center justify-between gap-2 py-3" key={item.name}><strong>{item.name}</strong><span className="flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin size={14}/>{item.location.split(" · ")[0]}</span></li>)}</ul>
      <p className="mt-4 text-sm text-muted-foreground">Sample locations only. Check the real kit onboard.</p>
    </section>}

    {panel === "routines" && <section id="mission-routines" className="card reveal mt-5 p-5 sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold">{task === "followup" ? "Add a task" : task === "wellbeing" ? "Private check-in" : "Daily tasks"}</h2>
        {task !== "list" && <button className="btn btn-soft min-h-10 px-3" onClick={() => setTask("list")} data-testid="button-back-tasks">Back to tasks</button>}
      </div>
      {activeIncident && <p className="mb-4 rounded-lg border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.07)] p-3 text-sm font-semibold" role="status" data-testid="status-routines-paused">An incident is open. Daily tasks are paused.</p>}

      {task === "list" && <>
        <div className="space-y-3">{profileReminders.map((item) => {
          const due = new Date(item.dueAt).getTime();
          const status = item.status === "due" && due < Date.now() ? "overdue" : item.status;
          return <article className="rounded-xl border p-4" key={item.id} data-testid={`reminder-${item.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{item.title}</strong><p className="mt-1 text-xs text-muted-foreground">{new Date(item.dueAt).toLocaleString()}</p></div><span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs font-bold">{statusText(status)}</span></div>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.category === "wellbeing" && <button className="btn btn-soft min-h-10 px-3" onClick={() => setTask("wellbeing")} disabled={activeIncident} data-testid={`button-open-wellbeing-${item.id}`}><Sparkles size={15}/> Check in</button>}
              <button className="btn btn-soft min-h-10 px-3" disabled={activeIncident || status === "completed"} onClick={() => void updateReminder(item, "completed")} data-testid={`button-complete-${item.id}`}><Check size={15}/> Done</button>
              <button className="btn btn-soft min-h-10 px-3" disabled={activeIncident || status === "completed"} onClick={() => void updateReminder(item, "rescheduled")} data-testid={`button-reschedule-${item.id}`}>Move to tomorrow</button>
            </div>
          </article>;
        })}</div>
        <div className="mt-5 flex flex-wrap gap-2 border-t pt-4">
          <button className="btn btn-soft" onClick={() => setTask("followup")} disabled={activeIncident} data-testid="button-show-followup"><ClipboardCheck size={16}/> Add a task</button>
          <button className="btn btn-soft" onClick={() => setTask("wellbeing")} data-testid="button-show-wellbeing"><Sparkles size={16}/> Private check-in</button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Sample schedule. No phone alerts are sent.</p>
      </>}

      {task === "followup" && <Form {...followUpForm}><form className="space-y-4" onSubmit={followUpForm.handleSubmit(addFollowUp)}>
        <FormField control={followUpForm.control} name="title" render={({ field }) => <FormItem><FormLabel>What needs doing?</FormLabel><FormControl><input className="field mt-2" {...field} placeholder="Short task name" data-testid="input-followup-title"/></FormControl><FormMessage/></FormItem>}/>
        <FormField control={followUpForm.control} name="dueAt" render={({ field }) => <FormItem><FormLabel>When?</FormLabel><FormControl><input className="field mt-2" type="datetime-local" {...field} data-testid="input-followup-due"/></FormControl><p className="mt-1 text-xs text-muted-foreground">Use timing from your mission plan or support team.</p><FormMessage/></FormItem>}/>
        <button className="btn btn-primary" type="submit" disabled={activeIncident || !persistence.ready} data-testid="button-save-followup"><Save size={16}/> Save task</button>
      </form></Form>}

      {task === "wellbeing" && <>
        <p className="mb-4 flex items-start gap-2 text-sm text-muted-foreground"><ShieldAlert size={16} className="mt-0.5 shrink-0"/>Stays on this device and is left out of the handoff. Anyone using this tablet can see it.</p>
        <Form {...wellbeingForm}><form className="space-y-4" onSubmit={wellbeingForm.handleSubmit(saveWellbeingEntry)}>
          <FormField control={wellbeingForm.control} name="personId" render={({ field }) => <FormItem><FormLabel>Who?</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-wellbeing-person">{crew.map((person) => <option value={person.id} key={person.id}>{person.name}</option>)}</select></FormControl><FormMessage/></FormItem>}/>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={wellbeingForm.control} name="sleepHours" render={({ field }) => <FormItem><FormLabel>Hours slept</FormLabel><FormControl><input className="field mt-2" type="number" min="0" max="24" step="0.1" {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value)} data-testid="input-wellbeing-sleep"/></FormControl><FormMessage/></FormItem>}/>
            {(["sleepQuality", "fatigue", "mood"] as const).map((name) => <FormField key={name} control={wellbeingForm.control} name={name} render={({ field }) => <FormItem><FormLabel>{name === "sleepQuality" ? "Sleep quality" : name === "fatigue" ? "Tiredness" : "Mood"}</FormLabel><FormControl><select className="field mt-2" {...field} data-testid={`select-wellbeing-${name}`}><option value="Not recorded">Skip</option><option value="Self-reported: low">Low</option><option value="Self-reported: moderate">Medium</option><option value="Self-reported: high">High</option><option value="Not sure">Not sure</option></select></FormControl><FormMessage/></FormItem>}/>)}
          </div>
          <FormField control={wellbeingForm.control} name="privateNote" render={({ field }) => <FormItem><FormLabel>Private note (optional)</FormLabel><FormControl><textarea className="field mt-2 min-h-20" {...field} placeholder="Not included in the handoff." data-testid="input-wellbeing-note"/></FormControl><FormMessage/></FormItem>}/>
          <button className="btn btn-primary" type="submit" disabled={!persistence.ready} data-testid="button-save-wellbeing"><Save size={16}/> Save check-in</button>
        </form></Form>
        {wellbeing.length > 0 && <div className="mt-4 border-t pt-4"><p className="eyebrow">Recent private check-ins</p><ul className="mt-2 space-y-1">{wellbeing.slice(0,3).map((entry) => <li key={entry.id} className="text-sm" data-testid={`wellbeing-record-${entry.id}`}><strong>{entry.personName}</strong> · {new Date(entry.at).toLocaleString()}</li>)}</ul></div>}
      </>}
    </section>}

    {panel === "evidence" && <section id="mission-evidence" className="card reveal mt-5 p-5 sm:p-7">
      <h2 className="text-xl font-extrabold">Sources</h2>
      <p className="mt-2 text-sm text-muted-foreground">Starting references only. Not reviewed by a doctor or mission authority. Links need internet.</p>
      <ul className="mt-4 divide-y">{SOURCE_INDEX.map((source) => <li className="py-3" key={source.url} data-testid={`source-${source.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`}><span className="eyebrow">{source.group}</span><a className="mt-1 block font-semibold text-[hsl(var(--primary))] underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
      <details className="mt-4 border-t pt-4"><summary className="cursor-pointer text-sm font-bold">Research details</summary>
        <p className="mt-3 text-sm text-muted-foreground">{SOURCE_INDEX_STATUS}</p>
        <p className="mt-3 text-sm" data-testid="notice-dataset-status"><strong>NASA dataset not included.</strong> No research values are shown. The sample habitat flag is separate from research data.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground"><li>Research is not live crew data.</li><li>Symptoms are not diagnoses.</li><li>Being in the same area does not mean cause.</li><li>No treatment advice is given.</li></ul>
      </details>
    </section>}
  </div>;
}
