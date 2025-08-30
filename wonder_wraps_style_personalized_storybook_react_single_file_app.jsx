import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Camera, Check, Download, Image as ImageIcon, Languages, Loader2, Save, Send, Settings, ShoppingCart, Sparkles, Star, User, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";

// ------------------------------
// Utilities
// ------------------------------
const cls = (...xs) => xs.filter(Boolean).join(" ");

function useLocalStorage(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch (e) {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

function formatCurrency(n) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(n);
}

// tiny template engine: replace {{key}} with data[key]
function renderTemplate(str, data) {
  return str.replace(/{{\s*(\w+)\s*}}/g, (_, k) => (data?.[k] ?? ""));
}

// ------------------------------
// Mock Content (templates)
// ------------------------------
const STORY_TEMPLATES = [
  {
    id: "forest-adventure",
    title: "The Forest of Friendly Whispers",
    ageRange: "3–6",
    basePrice: 29.0,
    covers: ["Emerald", "Sunset", "Midnight"],
    languages: ["English", "Spanish", "Filipino"],
    pages: [
      {
        bg: "from-emerald-200 to-emerald-100",
        h: "A New Day for {{childName}}",
        t: "In a cozy town, there lived a brave kid named {{childName}}. Today, {{pronoun}} would hear the forest whisper…",
      },
      {
        bg: "from-amber-100 to-orange-50",
        h: "Footprints on the Path",
        t: "With {{companion}} by {{pronoun}} side, {{childName}} followed tiny footprints that said, ‘{{nickname}}, this way!’",
      },
      {
        bg: "from-sky-100 to-indigo-100",
        h: "Giggles in the Leaves",
        t: "Leaves giggled and birds sang {{favoriteSong}}. ‘We know you, {{childName}}!’ they chirped, ‘because kindness sounds just like you.’",
      },
      {
        bg: "from-rose-100 to-pink-50",
        h: "The Wish Tree",
        t: "At the heart of the forest, the Wish Tree bloomed. {{childName}} made a wish: {{bigWish}}. The forest whispered back, ‘It starts with you.’",
      },
      {
        bg: "from-violet-100 to-fuchsia-100",
        h: "Home, with a Sparkle",
        t: "As stars twinkled, {{childName}} and {{companion}} headed home. The whispers stayed, tucked in {{pronoun}} pocket—ready for tomorrow.",
      },
    ],
  },
  {
    id: "space-hero",
    title: "{{childName}} and the Star Parade",
    ageRange: "5–8",
    basePrice: 32.0,
    covers: ["Nebula Blue", "Comet Silver", "Supernova Gold"],
    languages: ["English", "French", "Filipino"],
    pages: [
      {
        bg: "from-indigo-200 to-sky-200",
        h: "Liftoff!",
        t: "Captain {{nickname}} checked buttons. ‘Ready!’ Rockets hummed and the ship, The {{shipName}}, kissed the sky.",
      },
      {
        bg: "from-slate-100 to-slate-200",
        h: "Planet Parade",
        t: "Planets lined up like a parade. ‘We’ve heard of you, {{childName}},’ said Saturn. ‘Your courage orbits everywhere.’",
      },
      {
        bg: "from-amber-100 to-yellow-50",
        h: "Starlight Friends",
        t: "A glittery comet taught {{childName}} a dance. {{pronoun | they}} spun, dipped, and bowed. The galaxy applauded!",
      },
      {
        bg: "from-rose-100 to-pink-100",
        h: "Signal from Home",
        t: "A signal blinked: ‘Dinner!’ Time to fly back. ‘See you soon,’ waved the stars, ‘Keep shining, {{nickname}}!’",
      },
    ],
  },
];

const PRONOUN_SETS = {
  she: { pronoun: "she", them: "her", they: "she" },
  he: { pronoun: "he", them: "him", they: "he" },
  they: { pronoun: "they", them: "them", they: "they" },
};

const DEFAULT_FORM = {
  childName: "Ava",
  nickname: "Ace",
  companion: "Mochi the Cat",
  favoriteSong: "Twinkle, Twinkle",
  bigWish: "to help everyone feel brave",
  shipName: "Starglider",
  age: 5,
  pronouns: "she",
  language: "English",
  cover: "Emerald",
  includePhoto: true,
};

// ------------------------------
// Main App
// ------------------------------
export default function PersonalizedStoryApp() {
  const [form, setForm] = useLocalStorage("ww_form", DEFAULT_FORM);
  const [templateId, setTemplateId] = useLocalStorage("ww_template", STORY_TEMPLATES[0].id);
  const [photoUrl, setPhotoUrl] = useLocalStorage("ww_photo", "");
  const [hardcover, setHardcover] = useLocalStorage("ww_hardcover", true);
  const [giftWrap, setGiftWrap] = useLocalStorage("ww_giftwrap", false);
  const [quantity, setQuantity] = useLocalStorage("ww_qty", 1);
  const [exporting, setExporting] = useState(false);
  const [added, setAdded] = useState(false);

  const selected = useMemo(() => STORY_TEMPLATES.find(t => t.id === templateId)!, [templateId]);

  const basePrice = selected.basePrice;
  const extras = (hardcover ? 6 : 0) + (giftWrap ? 4 : 0);
  const total = (basePrice + extras) * Math.max(1, Number(quantity) || 1);

  const data = useMemo(() => ({
    ...form,
    ...PRONOUN_SETS[form.pronouns],
  }), [form]);

  const onFile = (f) => {
    if (!f) return;
    const url = URL.createObjectURL(f);
    setPhotoUrl(url);
  };

  const generatePDF = async () => {
    setExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const container = document.getElementById("preview-pages");
      const pages = Array.from(container.querySelectorAll(".story-page"));
      const pdf = new jsPDF({ unit: "pt", format: "a4" });
      for (let i = 0; i < pages.length; i++) {
        const el = pages[i];
        const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff" });
        const img = canvas.toDataURL("image/png");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(img, "PNG", 0, 0, pageWidth, pageHeight);
        if (i < pages.length - 1) pdf.addPage();
      }
      pdf.save(`${form.childName}-storybook.pdf`);
    } catch (e) {
      console.error(e);
      alert("PDF export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const resetAll = () => {
    setForm(DEFAULT_FORM);
    setTemplateId(STORY_TEMPLATES[0].id);
    setPhotoUrl("");
    setHardcover(true);
    setGiftWrap(false);
    setQuantity(1);
  };

  const addToCart = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-800">
      <header className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-amber-500" />
          <h1 className="font-bold text-xl">Wonder-Style Storybooks</h1>
          <Badge className="ml-2" variant="secondary">Demo</Badge>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetAll}><Wand2 className="w-4 h-4 mr-2"/>Reset</Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline"><Settings className="w-4 h-4 mr-2"/>Developer Notes</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Implementation Notes</DialogTitle>
                  <DialogDescription>
                    Front‑end only demo. Replace the mocked template data and wire the checkout to your backend (e.g., Next.js API routes). PDF export uses html2canvas + jsPDF on the client. All form state persists in localStorage.
                  </DialogDescription>
                </DialogHeader>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Tech: React + Tailwind + shadcn/ui + Framer Motion + html2canvas + jsPDF.</li>
                  <li>Image upload stays local (not uploaded anywhere).</li>
                  <li>Internationalization: choose language per template (stubbed).</li>
                  <li>Accessibility: semantic headings, labels, and alt text.</li>
                </ul>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[380px,1fr] gap-6">
        {/* Left: Configurator */}
        <section>
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Book className="w-5 h-5"/> Build Your Book</CardTitle>
              <CardDescription>Personalize a keepsake story starring your child.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Choose Story</Label>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Stories</SelectLabel>
                      {STORY_TEMPLATES.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.title.replace("{{childName}} ", "")}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">Age range: {selected.ageRange}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="childName">Child's name</Label>
                  <Input id="childName" value={form.childName} onChange={e => setForm({ ...form, childName: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="nickname">Nickname</Label>
                  <Input id="nickname" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="companion">Companion (pet/toy)</Label>
                  <Input id="companion" value={form.companion} onChange={e => setForm({ ...form, companion: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="favoriteSong">Favorite song</Label>
                  <Input id="favoriteSong" value={form.favoriteSong} onChange={e => setForm({ ...form, favoriteSong: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="bigWish">Big wish</Label>
                  <Textarea id="bigWish" rows={2} value={form.bigWish} onChange={e => setForm({ ...form, bigWish: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="shipName">Ship name (if space story)</Label>
                  <Input id="shipName" value={form.shipName} onChange={e => setForm({ ...form, shipName: e.target.value })} />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input type="number" min={0} value={form.age} onChange={e => setForm({ ...form, age: Number(e.target.value) })} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 items-end">
                <div>
                  <Label>Pronouns</Label>
                  <Select value={form.pronouns} onValueChange={v => setForm({ ...form, pronouns: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="she">She/Her</SelectItem>
                      <SelectItem value="he">He/Him</SelectItem>
                      <SelectItem value="they">They/Them</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Language</Label>
                  <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {selected.languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cover</Label>
                  <Select value={form.cover} onValueChange={v => setForm({ ...form, cover: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {selected.covers.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch id="includePhoto" checked={form.includePhoto} onCheckedChange={(v) => setForm({ ...form, includePhoto: v })} />
                  <Label htmlFor="includePhoto" className="cursor-pointer">Include child's photo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="hardcover" checked={hardcover} onCheckedChange={setHardcover} />
                  <Label htmlFor="hardcover" className="cursor-pointer">Hardcover (+$6)</Label>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch id="giftwrap" checked={giftWrap} onCheckedChange={setGiftWrap} />
                  <Label htmlFor="giftwrap" className="cursor-pointer">Gift wrap (+$4)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="qty">Qty</Label>
                  <Input id="qty" className="w-20" type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value) || 1)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-sm font-medium flex items-center gap-2"><Camera className="w-4 h-4"/>Upload photo</span>
                  <Input type="file" accept="image/*" onChange={e => onFile(e.target.files?.[0])} />
                </label>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <ImageIcon className="w-4 h-4"/> {photoUrl ? "Photo attached" : "No photo yet"}
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span>Base price</span>
                  <span>{formatCurrency(basePrice)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Extras</span>
                  <span>{formatCurrency(extras)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold border-t mt-2 pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex items-center gap-3">
              <Button onClick={addToCart} className="grow"><ShoppingCart className="w-4 h-4 mr-2"/>Add to cart</Button>
              <Button variant="secondary" onClick={generatePDF} disabled={exporting}>
                {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2"/>}
                Export PDF
              </Button>
            </CardFooter>
          </Card>

          <AnimatePresence>
            {added && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }}
                className="mt-3 p-3 rounded-xl bg-emerald-50 border text-emerald-900 text-sm flex items-center gap-2">
                <Check className="w-4 h-4"/> Added to cart (mock). Hook this up to your checkout.
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right: Live Preview */}
        <section className="min-h-[60vh]">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="w-5 h-5"/> Live Preview</CardTitle>
              <CardDescription>Your book updates as you type. Use Export PDF to download a printable proof.</CardDescription>
            </CardHeader>
            <CardContent>
              <div id="preview-pages" className="grid md:grid-cols-2 gap-4">
                {/* Cover */}
                <div className="story-page relative aspect-[1/1.414] bg-white rounded-2xl shadow p-6 overflow-hidden border">
                  <div className="absolute inset-0 bg-gradient-to-br opacity-60 pointer-events-none rounded-2xl "
                    style={{ backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))` }}
                    className={cls("bg-gradient-to-br rounded-2xl", selected.id === "forest-adventure" ? "from-emerald-200 to-emerald-50" : "from-indigo-200 to-sky-100")}
                  />
                  <div className="relative h-full flex flex-col">
                    <div className="text-sm text-slate-600">Cover • {form.cover}</div>
                    <h2 className="mt-4 text-3xl font-extrabold tracking-tight flex items-center gap-2">
                      <Star className="w-6 h-6 text-amber-500"/>
                      {renderTemplate(selected.title, data).replace("{{childName}}", form.childName)}
                    </h2>
                    <div className="mt-auto">
                      <div className="text-slate-600 text-sm">Starring</div>
                      <div className="text-2xl font-semibold">{form.childName}</div>
                    </div>
                    {form.includePhoto && photoUrl && (
                      <img src={photoUrl} alt="Child preview" className="absolute bottom-6 right-6 w-24 h-24 object-cover rounded-xl border shadow" />
                    )}
                  </div>
                </div>

                {/* Inner pages */}
                {selected.pages.map((p, i) => (
                  <motion.div key={i} layout className={cls("story-page relative aspect-[1/1.414] rounded-2xl overflow-hidden border shadow bg-white")}> 
                    <div className={cls("absolute inset-0 bg-gradient-to-br pointer-events-none", p.bg)} />
                    <div className="relative h-full p-6 flex flex-col">
                      <div className="text-xs text-slate-600">Page {i + 1}</div>
                      <h3 className="text-xl font-bold mt-2">{renderTemplate(p.h, data)}</h3>
                      <p className="mt-3 leading-relaxed text-slate-800">
                        {renderTemplate(p.t, data)}
                      </p>
                      {form.includePhoto && photoUrl && i % 2 === 1 && (
                        <div className="mt-4 ml-auto w-24 h-24 rounded-xl overflow-hidden border shadow">
                          <img src={photoUrl} alt="Child illustration" className="w-full h-full object-cover"/>
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between text-xs text-slate-600">
                        <span>{form.language}</span>
                        <span>{selected.ageRange} • {hardcover ? "Hardcover" : "Softcover"}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <div className="text-sm text-slate-600">Preview quality only • final print will be high‑resolution.</div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={generatePDF} disabled={exporting}>
                  {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Download className="w-4 h-4 mr-2"/>}
                  Export PDF
                </Button>
                <Button onClick={addToCart}><ShoppingCart className="w-4 h-4 mr-2"/> Add to cart</Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </main>

      <footer className="max-w-7xl mx-auto px-4 py-10 text-center text-sm text-slate-500">
        Built as a demo. Replace text, art, and pricing with your own. © {new Date().getFullYear()} You.
      </footer>
    </div>
  );
}
