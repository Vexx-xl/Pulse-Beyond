import { useEffect, useMemo, useState } from "react";
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
  const [tab, setTab] = useState<TabId>("configuration");
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

  const tabEntries: { id: TabId; label: string }[] = [
    { id: "configuration", label: "Mission settings" },
    { id: "equipment", label: "Equipment" },
    { id: "routines", label: "Routines & wellbeing" },
    { id: "evidence", label: "Sources" },
  ];

  return <div className="reveal">
    <header className="mb-7">
      <p className="eyebrow">Configuration · fictional sample data</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">Mission & routines</h1>
      <p className="mt-3 max-w-2xl leading-6 text-muted-foreground">Profiles change the displayed zones, sample equipment, and fictional schedules. Communication delay stays unconfigured unless the crew enters a mission-specific value.</p>
    </header>

    <div className="mb-5 flex flex-wrap gap-2 border-b pb-4" role="tablist" aria-label="Mission areas">
      {tabEntries.map((item) => <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? "btn btn-primary" : "btn btn-soft"} onClick={() => { setTab(item.id); setMessage(""); }} data-testid={`tab-mission-${item.id}`}>{item.label}</button>)}
    </div>

    {tab === "configuration" && <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
      <section className="card p-5 sm:p-7">
        <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><Radio/></span><div><p className="eyebrow">Local mission profile</p><h2 className="text-xl font-extrabold">Context and communication</h2></div></div>
        <Form {...settingsForm}>
          <form className="space-y-5" onSubmit={settingsForm.handleSubmit(saveMission)}>
            <FormField control={settingsForm.control} name="profile" render={({ field }) => <FormItem><FormLabel>Operating environment</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-mission-profile"><option value="station">Space station</option><option value="spacecraft">Spacecraft</option><option value="lunar">Lunar surface base</option></select></FormControl><FormMessage/></FormItem>}/>
            <FormField control={settingsForm.control} name="communicationStatus" render={({ field }) => <FormItem><FormLabel>Communication availability · scenario setting</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-communication-status"><option value="not-configured">Not configured</option><option value="available-scenario">Available in this scenario</option><option value="delayed-scenario">Delayed in this scenario</option><option value="unavailable-scenario">Unavailable in this scenario</option></select></FormControl><p className="mt-1 text-xs text-muted-foreground">{profile.communicationNote}</p><FormMessage/></FormItem>}/>
            <FormField control={settingsForm.control} name="communicationDelay" render={({ field }) => <FormItem><FormLabel>Configured communication delay</FormLabel><FormControl><input className="field mt-2" {...field} placeholder="Not configured" data-testid="input-communication-delay"/></FormControl><p className="mt-1 text-xs text-muted-foreground">No delay is inferred from the profile name or destination.</p><FormMessage/></FormItem>}/>
            <button className="btn btn-primary" type="submit" disabled={!persistence.ready} data-testid="button-save-mission"><Save size={17}/> Save profile</button>
            {message && <p role="status" className="text-sm font-semibold" data-testid="status-mission-save">{message}</p>}
          </form>
        </Form>
      </section>
      <aside className="card p-5 sm:p-6">
        <div className="flex items-center gap-2"><MapPin size={17} className="text-[hsl(var(--primary))]"/><p className="eyebrow">Displayed environment</p></div>
        <h2 className="mt-2 text-xl font-extrabold">{profile.label}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{profile.gravity}</p>
        <div className="mt-5 border-t pt-4"><p className="eyebrow">Habitat zones</p><ul className="mt-3 space-y-2">{profile.zones.map((zone) => <li key={zone} className="flex items-center gap-2 text-sm"><MapPin size={15} className="text-muted-foreground"/>{zone}</li>)}</ul></div>
        <div className="mt-5 border-t pt-4"><p className="eyebrow">Crew role metadata</p><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{profile.crewContext.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="mt-5 rounded-lg bg-[hsl(var(--muted))] p-3 text-xs leading-5 text-muted-foreground">All profiles, locations, equipment, crew roles, and schedules in this prototype are fictional. Profile changes do not alter or recommend medical procedures.</div>
      </aside>
    </div>}

    {tab === "equipment" && <section className="card p-5 sm:p-7">
      <div className="mb-5 flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--primary)/.1)] text-[hsl(var(--primary))]"><Package/></span><div><p className="eyebrow">Fictional inventory · no live stock feed</p><h2 className="text-xl font-extrabold">Sample equipment locations</h2></div></div>
      <div className="grid gap-3 md:grid-cols-3">{profile.equipment.map((item) => <article className="rounded-xl border bg-[hsl(var(--background))] p-4" key={item.name}><div className="flex items-center justify-between gap-2"><strong>{item.name}</strong><span className="rounded-full bg-[hsl(var(--muted))] px-2 py-1 text-[10px] font-bold uppercase">Fictional</span></div><p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"><MapPin size={15} className="mt-0.5 shrink-0"/>{item.location}</p></article>)}</div>
      <p className="mt-5 rounded-xl border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] p-4 text-sm leading-6"><strong>No equipment status is inferred.</strong> Confirm actual inventory and operating instructions onboard. This prototype does not control life-support or habitat hardware.</p>
    </section>}

    {tab === "routines" && <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-3"><CalendarClock className="text-[hsl(var(--primary))]"/><div><p className="eyebrow">No background notifications promised</p><h2 className="text-xl font-extrabold">Fictional routine schedule</h2></div></div>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">Due states are recalculated when this page opens. No clinical follow-up interval is suggested.</p>
        {activeIncident && <p className="mb-4 rounded-lg border border-[hsl(var(--destructive)/.3)] bg-[hsl(var(--destructive)/.07)] p-3 text-sm font-semibold" role="status" data-testid="status-routines-paused">Routine interruptions are paused while an incident is active.</p>}
        <div className="space-y-3">{profileReminders.map((task) => {
          const due = new Date(task.dueAt).getTime();
          const status = task.status === "due" && due < Date.now() ? "overdue" : task.status;
          return <article className="rounded-xl border p-4" key={task.id} data-testid={`reminder-${task.id}`}>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{task.title}</strong><p className="mt-1 text-xs text-muted-foreground">{new Date(task.dueAt).toLocaleString()} · fictional schedule</p></div><span className="rounded-full bg-[hsl(var(--muted))] px-2.5 py-1 text-xs font-bold">{status}</span></div>
            {task.category === "wellbeing" && <button className="btn btn-soft mt-3" onClick={() => setTab("routines")} disabled={activeIncident} data-testid={`button-open-wellbeing-${task.id}`}><Sparkles size={16}/> Record private wellbeing</button>}
            <div className="mt-3 flex flex-wrap gap-2"><button className="btn btn-soft min-h-10 px-3" disabled={activeIncident || status === "completed"} onClick={() => void updateReminder(task, "completed")} data-testid={`button-complete-${task.id}`}><Check size={15}/> Complete</button><button className="btn btn-soft min-h-10 px-3" disabled={activeIncident || status === "completed"} onClick={() => void updateReminder(task, "rescheduled")} data-testid={`button-reschedule-${task.id}`}>Reschedule 24h</button></div>
          </article>;
        })}</div>
        <div className="mt-5 border-t pt-4"><p className="eyebrow">Mission schedule context</p><ul className="mt-2 space-y-1 text-sm text-muted-foreground">{profile.schedule.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>

      <div className="grid content-start gap-5">
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3"><ClipboardCheck className="text-[hsl(var(--primary))]"/><div><p className="eyebrow">Timing must be configured or sourced</p><h2 className="text-xl font-extrabold">Add a follow-up task</h2></div></div>
          <Form {...followUpForm}><form className="space-y-4" onSubmit={followUpForm.handleSubmit(addFollowUp)}>
            <FormField control={followUpForm.control} name="title" render={({ field }) => <FormItem><FormLabel>Task</FormLabel><FormControl><input className="field mt-2" {...field} placeholder="Describe the follow-up" data-testid="input-followup-title"/></FormControl><FormMessage/></FormItem>}/>
            <FormField control={followUpForm.control} name="dueAt" render={({ field }) => <FormItem><FormLabel>Configured due date and time</FormLabel><FormControl><input className="field mt-2" type="datetime-local" {...field} data-testid="input-followup-due"/></FormControl><FormMessage/></FormItem>}/>
            <button className="btn btn-primary" type="submit" disabled={activeIncident || !persistence.ready} data-testid="button-save-followup"><Save size={16}/> Save task</button>
          </form></Form>
        </section>

        <section className="card p-5 sm:p-6">
          <div className="mb-4"><p className="eyebrow">Private by default in shared handoff</p><h2 className="mt-1 text-xl font-extrabold">Wellbeing check-in</h2></div>
          <p className="mb-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldAlert size={15} className="mt-0.5 shrink-0"/>This shared-device prototype has no access controls. Entries stay on this device and are not included in the handoff by default.</p>
          <Form {...wellbeingForm}><form className="space-y-4" onSubmit={wellbeingForm.handleSubmit(saveWellbeingEntry)}>
            <FormField control={wellbeingForm.control} name="personId" render={({ field }) => <FormItem><FormLabel>Person</FormLabel><FormControl><select className="field mt-2" {...field} data-testid="select-wellbeing-person">{crew.map((person) => <option value={person.id} key={person.id}>{person.name} · fictional</option>)}</select></FormControl><FormMessage/></FormItem>}/>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField control={wellbeingForm.control} name="sleepHours" render={({ field }) => <FormItem><FormLabel>Sleep duration · hours</FormLabel><FormControl><input className="field mt-2" type="number" min="0" max="24" step="0.1" {...field} value={field.value ?? ""} onChange={(event) => field.onChange(event.target.value)} data-testid="input-wellbeing-sleep"/></FormControl><FormMessage/></FormItem>}/>
              {(["sleepQuality", "fatigue", "mood"] as const).map((name) => <FormField key={name} control={wellbeingForm.control} name={name} render={({ field }) => <FormItem><FormLabel>{name === "sleepQuality" ? "Sleep quality" : name[0].toUpperCase() + name.slice(1)}</FormLabel><FormControl><select className="field mt-2" {...field} data-testid={`select-wellbeing-${name}`}><option>Not recorded</option><option>Self-reported: low</option><option>Self-reported: moderate</option><option>Self-reported: high</option><option>Not sure</option></select></FormControl><FormMessage/></FormItem>}/>)}
            </div>
            <FormField control={wellbeingForm.control} name="privateNote" render={({ field }) => <FormItem><FormLabel>Optional private note</FormLabel><FormControl><textarea className="field mt-2 min-h-20" {...field} placeholder="Not included in the handoff." data-testid="input-wellbeing-note"/></FormControl><FormMessage/></FormItem>}/>
            <button className="btn btn-primary" type="submit" disabled={!persistence.ready} data-testid="button-save-wellbeing"><Save size={16}/> Save private check-in</button>
          </form></Form>
          {wellbeing.length > 0 && <div className="mt-4 border-t pt-4"><p className="eyebrow">Recent private entries</p><ul className="mt-2 space-y-2">{wellbeing.slice(0,3).map((entry) => <li key={entry.id} className="text-sm" data-testid={`wellbeing-record-${entry.id}`}><strong>{entry.personName}</strong> · {new Date(entry.at).toLocaleString()}<span className="block text-xs text-muted-foreground">Private on this shared device · not included in handoff</span></li>)}</ul></div>}
        </section>
      </div>
    </div>}

    {tab === "evidence" && <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
      <section className="card p-5 sm:p-7">
        <p className="eyebrow">Reference list · external pages may require internet</p>
        <h2 className="mt-2 text-xl font-extrabold">Sources and research context</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{SOURCE_INDEX_STATUS}</p>
        <div className="mt-4 rounded-xl border border-[hsl(var(--accent)/.35)] bg-[hsl(var(--accent)/.08)] p-4 text-sm leading-6" data-testid="notice-dataset-status"><strong>Historical NASA dataset excerpt: not bundled.</strong><p className="mt-1">No dataset values are shown in this prototype. The synthetic habitat change flag is separate from NASA research data and is not merged into a patient record.</p></div>
        <div className="mt-5 space-y-3">{SOURCE_INDEX.map((source) => <article className="rounded-xl border p-4" key={source.url} data-testid={`source-${source.title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><span className="eyebrow">{source.group}</span><h3 className="mt-1 font-bold">{source.title}</h3></div><span className="rounded-full bg-[hsl(var(--muted))] px-2 py-1 text-[10px] font-bold">Starting reference</span></div>
          <a className="mt-2 inline-block text-sm font-semibold text-[hsl(var(--primary))] underline underline-offset-4" href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
          <p className="mt-2 text-xs text-muted-foreground">Not reviewed for mission-specific procedures in this prototype.</p>
        </article>)}</div>
      </section>
      <aside className="grid content-start gap-4">
        <section className="card p-5"><div className="flex items-center gap-2"><Info size={17}/><p className="eyebrow">Evidence boundaries</p></div><ul className="mt-3 space-y-2 text-sm leading-5 text-muted-foreground"><li>Research information is not live patient data.</li><li>Reported symptoms are not diagnoses.</li><li>Habitat time overlap is not causation or exposure.</li><li>Procedure content requires source and review status.</li><li>Unreviewed treatment content is not supplied.</li></ul></section>
        <section className="card p-5"><p className="eyebrow">Content review status</p><h3 className="mt-2 font-bold">Team review pending</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">No clinician, crew health officer, NASA, or mission authority review is claimed. Measurement preparation and quality steps remain unavailable pending appropriate source review.</p></section>
      </aside>
    </div>}
    {message && tab !== "configuration" && <p role="status" className="mt-4 text-sm font-semibold" data-testid="status-mission-message">{message}</p>}
  </div>;
}
