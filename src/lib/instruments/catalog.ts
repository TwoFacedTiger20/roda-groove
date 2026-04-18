// Metadata for every instrument: name, origin region, emoji, color, hint.
// Pitched palettes live alongside, mapped by id.

import type { InstrumentId, InstrumentMeta, Origin } from "./types";

export const INSTRUMENTS: InstrumentMeta[] = [
  // ─── Brazil ────────────────────────────────────────────────────────────────
  { id: "surdo",     name: "Surdo",     origin: "Brazil", emoji: "🥁", color: "var(--hibiscus)", hint: "Deep boom" },
  { id: "repinique", name: "Repinique", origin: "Brazil", emoji: "🪘", color: "var(--coral)",    hint: "Sharp call" },
  { id: "caixa",     name: "Caixa",     origin: "Brazil", emoji: "🪘", color: "var(--mango)",    hint: "Snare roll" },
  { id: "tamborim",  name: "Tamborim",  origin: "Brazil", emoji: "🎯", color: "var(--coral)",    hint: "Tiny pop" },
  { id: "agogo",     name: "Agogô",     origin: "Brazil", emoji: "🔔", color: "var(--mango)",    hint: "Two bells" },
  { id: "pandeiro",  name: "Pandeiro",  origin: "Brazil", emoji: "🪘", color: "var(--palm)",     hint: "Tambourine" },
  { id: "cuica",     name: "Cuíca",     origin: "Brazil", emoji: "🐒", color: "var(--accent)",   hint: "Squeak" },
  { id: "berimbau",  name: "Berimbau",  origin: "Brazil", emoji: "🏹", color: "var(--palm)",     hint: "Twang" },

  // ─── Caribbean ─────────────────────────────────────────────────────────────
  { id: "conga",     name: "Conga",     origin: "Caribbean", emoji: "🪘", color: "var(--ocean)", hint: "Hand drum" },
  { id: "bongo",     name: "Bongô",     origin: "Caribbean", emoji: "🪘", color: "var(--coral)", hint: "High pair" },
  { id: "timbales",  name: "Timbales",  origin: "Caribbean", emoji: "🥁", color: "var(--mango)", hint: "Metal shell" },
  { id: "steelpan",  name: "Steel Pan", origin: "Caribbean", emoji: "🎵", color: "var(--accent)", hint: "Tropical pitch" },

  // ─── Latin ─────────────────────────────────────────────────────────────────
  { id: "clave",     name: "Clave",     origin: "Latin", emoji: "🪵", color: "var(--sand)",   hint: "Wood click" },
  { id: "cowbell",   name: "Cowbell",   origin: "Latin", emoji: "🔔", color: "var(--mango)",  hint: "More cowbell" },
  { id: "guiro",     name: "Güiro",     origin: "Latin", emoji: "🦎", color: "var(--palm)",   hint: "Scrape" },
  { id: "maracas",   name: "Maracas",   origin: "Latin", emoji: "🥥", color: "var(--mango)",  hint: "Shake shake" },
  { id: "cajon",     name: "Cajón",     origin: "Latin", emoji: "📦", color: "var(--coral)",  hint: "Box thump" },
  { id: "charango",  name: "Charango",  origin: "Latin", emoji: "🪕", color: "var(--accent)", hint: "Tiny strum" },

  // ─── Africa ────────────────────────────────────────────────────────────────
  { id: "djembe",      name: "Djembe",       origin: "Africa", emoji: "🪘", color: "var(--hibiscus)", hint: "Goblet drum" },
  { id: "talkingdrum", name: "Talking Drum", origin: "Africa", emoji: "🗣️", color: "var(--coral)",    hint: "Bend pitch" },
  { id: "kalimba",     name: "Kalimba",      origin: "Africa", emoji: "🎼", color: "var(--accent)",   hint: "Thumb piano" },
  { id: "udu",         name: "Udu",          origin: "Africa", emoji: "🏺", color: "var(--ocean)",    hint: "Clay pot" },
  { id: "shekere",     name: "Shekere",      origin: "Africa", emoji: "🥥", color: "var(--mango)",    hint: "Bead gourd" },
  { id: "balafon",     name: "Balafon",      origin: "Africa", emoji: "🎶", color: "var(--palm)",     hint: "Wood marimba" },
  { id: "mbira",       name: "Mbira",        origin: "Africa", emoji: "🎵", color: "var(--accent)",   hint: "Buzz tines" },
  { id: "dundun",      name: "Dundun",       origin: "Africa", emoji: "🥁", color: "var(--hibiscus)", hint: "Bass drum" },

  // ─── Middle East ───────────────────────────────────────────────────────────
  { id: "darbuka",    name: "Darbuka",    origin: "Middle East", emoji: "🪘", color: "var(--coral)",  hint: "Sharp tek" },
  { id: "riq",        name: "Riq",        origin: "Middle East", emoji: "🪘", color: "var(--mango)",  hint: "Jingled frame" },
  { id: "frame_drum", name: "Frame Drum", origin: "Middle East", emoji: "🥁", color: "var(--ocean)",  hint: "Round boom" },
  { id: "oud",        name: "Oud",        origin: "Middle East", emoji: "🪕", color: "var(--accent)", hint: "Lute pluck" },
  { id: "qanun",      name: "Qanun",      origin: "Middle East", emoji: "🎵", color: "var(--palm)",   hint: "Plucked zither" },

  // ─── India ─────────────────────────────────────────────────────────────────
  { id: "tabla_dha",  name: "Tabla Dha", origin: "India", emoji: "🪘", color: "var(--hibiscus)", hint: "Bass slap" },
  { id: "tabla_na",   name: "Tabla Na",  origin: "India", emoji: "🪘", color: "var(--coral)",    hint: "Ringing tap" },
  { id: "mridangam",  name: "Mridangam", origin: "India", emoji: "🪘", color: "var(--mango)",    hint: "Carnatic drum" },
  { id: "sitar",      name: "Sitar",     origin: "India", emoji: "🪕", color: "var(--accent)",   hint: "Drone twang" },
  { id: "tanpura",    name: "Tanpura",   origin: "India", emoji: "🎵", color: "var(--palm)",     hint: "Ambient drone" },
  { id: "ghatam",     name: "Ghatam",    origin: "India", emoji: "🏺", color: "var(--ocean)",    hint: "Clay pot" },

  // ─── East Asia ─────────────────────────────────────────────────────────────
  { id: "taiko",            name: "Taiko",       origin: "East Asia", emoji: "🥁", color: "var(--hibiscus)", hint: "Thunder drum" },
  { id: "koto",             name: "Koto",        origin: "East Asia", emoji: "🎵", color: "var(--accent)",   hint: "Japanese harp" },
  { id: "shamisen",         name: "Shamisen",    origin: "East Asia", emoji: "🪕", color: "var(--coral)",    hint: "Snappy strum" },
  { id: "guzheng",          name: "Guzheng",     origin: "East Asia", emoji: "🎶", color: "var(--palm)",     hint: "Chinese zither" },
  { id: "wood_block_china", name: "Wood Block",  origin: "East Asia", emoji: "🪵", color: "var(--sand)",     hint: "Hollow click" },

  // ─── Southeast Asia ────────────────────────────────────────────────────────
  { id: "gamelan_gong",   name: "Gamelan Gong",   origin: "Southeast Asia", emoji: "🥁", color: "var(--mango)",  hint: "Resonant gong" },
  { id: "gamelan_bonang", name: "Bonang",         origin: "Southeast Asia", emoji: "🔔", color: "var(--accent)", hint: "Tuned kettle" },
  { id: "angklung",       name: "Angklung",       origin: "Southeast Asia", emoji: "🎋", color: "var(--palm)",   hint: "Bamboo shake" },

  // ─── Europe ────────────────────────────────────────────────────────────────
  { id: "bodhran",     name: "Bodhrán",      origin: "Europe", emoji: "🥁", color: "var(--ocean)",    hint: "Irish frame" },
  { id: "tin_whistle", name: "Tin Whistle",  origin: "Europe", emoji: "🪈", color: "var(--accent)",   hint: "Celtic flute" },
  { id: "accordion",   name: "Accordion",    origin: "Europe", emoji: "🪗", color: "var(--coral)",    hint: "Bellows chord" },
  { id: "hang_drum",   name: "Hang Drum",    origin: "Europe", emoji: "🛸", color: "var(--palm)",     hint: "Steel handpan" },

  // ─── Andes ─────────────────────────────────────────────────────────────────
  { id: "quena",   name: "Quena",   origin: "Andes", emoji: "🪈", color: "var(--accent)",   hint: "Notched flute" },
  { id: "zampona", name: "Zampoña", origin: "Andes", emoji: "🎶", color: "var(--palm)",     hint: "Pan pipes" },
  { id: "bombo",   name: "Bombo",   origin: "Andes", emoji: "🥁", color: "var(--hibiscus)", hint: "Andean bass" },

  // ─── North America ─────────────────────────────────────────────────────────
  { id: "powwow_drum", name: "Powwow Drum", origin: "North America", emoji: "🥁", color: "var(--hibiscus)", hint: "Heartbeat boom" },
  { id: "rattle",      name: "Rattle",      origin: "North America", emoji: "🎵", color: "var(--mango)",    hint: "Seed shake" },

  // ─── Oceania ───────────────────────────────────────────────────────────────
  { id: "didgeridoo", name: "Didgeridoo", origin: "Oceania", emoji: "🌿", color: "var(--palm)",  hint: "Drone hum" },
  { id: "log_drum",   name: "Log Drum",   origin: "Oceania", emoji: "🪵", color: "var(--coral)", hint: "Slit drum" },

  // ─── Universal ─────────────────────────────────────────────────────────────
  { id: "shaker",     name: "Shaker",     origin: "Latin",  emoji: "🧂", color: "var(--sand)",  hint: "Soft shake" },
  { id: "triangle",   name: "Triangle",   origin: "Europe", emoji: "📐", color: "var(--accent)", hint: "Bright ting" },
  { id: "wood_block", name: "Wood Block", origin: "Latin",  emoji: "🪵", color: "var(--sand)",  hint: "Click pop" },
  { id: "tambourine", name: "Tambourine", origin: "Europe", emoji: "🪘", color: "var(--mango)", hint: "Jingles" },
  { id: "rim_shot",   name: "Rim Shot",   origin: "Latin",  emoji: "💥", color: "var(--coral)", hint: "Snap edge" },
];

// Which instruments accept a note + their available pitches.
export const PITCHED: Partial<Record<InstrumentId, string[]>> = {
  // Originals
  steelpan: ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5", "C6"],
  agogo:    ["E4", "G4", "A4", "C5", "E5", "G5"],
  berimbau: ["A2", "B2", "C3", "D3", "E3", "G3"],
  cuica:    ["C4", "D4", "E4", "G4", "A4", "C5"],
  conga:    ["A2", "C3", "D3", "E3", "G3", "A3"],
  bongo:    ["E3", "G3", "A3", "C4", "E4", "G4"],
  timbales: ["C3", "D3", "E3", "G3", "A3", "C4"],
  tamborim: ["A4", "C5", "D5", "E5", "G5", "A5"],
  charango: ["C4", "D4", "E4", "G4", "A4", "C5", "E5", "G5"],

  // Africa
  kalimba:  ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"],
  balafon:  ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5"],
  mbira:    ["C4", "D4", "E4", "G4", "A4", "C5"],
  talkingdrum: ["A2", "C3", "E3", "G3", "A3", "C4", "E4"],

  // Middle East
  oud:      ["A2", "C3", "D3", "E3", "G3", "A3", "C4"],
  qanun:    ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"],

  // India
  sitar:    ["C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4", "D4"],
  tanpura:  ["C3", "G3", "C4"],

  // East Asia
  koto:     ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"],
  shamisen: ["C3", "D3", "E3", "G3", "A3", "C4"],
  guzheng:  ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5", "G5"],

  // SEA
  gamelan_gong:   ["A2", "C3", "D3", "E3"],
  gamelan_bonang: ["C4", "D4", "E4", "G4", "A4", "C5"],
  angklung:       ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"],

  // Europe
  tin_whistle: ["D4", "E4", "F4", "G4", "A4", "B4", "D5", "E5", "G5"],
  accordion:   ["C3", "E3", "G3", "C4", "E4", "G4", "C5"],
  hang_drum:   ["C4", "D4", "E4", "G4", "A4", "C5", "D5", "E5"],

  // Andes
  quena:   ["G4", "A4", "B4", "C5", "D5", "E5", "G5", "A5"],
  zampona: ["G4", "A4", "C5", "D5", "E5", "G5", "A5", "C6"],
};

// ─── Genres ────────────────────────────────────────────────────────────────
// Genre is purely a tag for the roda. All instruments are always available.
export type Genre = {
  id: string;
  name: string;
  emoji: string;
  hint: string;
};

export const GENRES: Genre[] = [
  { id: "open",       name: "Open Jam",       emoji: "🌍", hint: "Anything goes" },
  { id: "samba",      name: "Samba",          emoji: "🇧🇷", hint: "Brazil" },
  { id: "axe",        name: "Axé",            emoji: "🥁", hint: "Bahia" },
  { id: "capoeira",   name: "Capoeira",       emoji: "🏹", hint: "Roda de berimbau" },
  { id: "salsa",      name: "Salsa",          emoji: "💃", hint: "Cuba / NY" },
  { id: "reggae",     name: "Reggae",         emoji: "🌴", hint: "Jamaica" },
  { id: "soca",       name: "Soca / Calypso", emoji: "🪘", hint: "Trinidad" },
  { id: "afrobeat",   name: "Afrobeat",       emoji: "🌍", hint: "West Africa" },
  { id: "highlife",   name: "Highlife",       emoji: "🎶", hint: "Ghana" },
  { id: "gnawa",      name: "Gnawa",          emoji: "🐪", hint: "Morocco" },
  { id: "arabic",     name: "Arabic",         emoji: "🕌", hint: "Levant / Maghreb" },
  { id: "bollywood",  name: "Bollywood",      emoji: "🎭", hint: "Hindi pop" },
  { id: "carnatic",   name: "Carnatic",       emoji: "🪔", hint: "South India" },
  { id: "gamelan",    name: "Gamelan",        emoji: "🎋", hint: "Indonesia" },
  { id: "taiko",      name: "Taiko",          emoji: "🥁", hint: "Japan" },
  { id: "celtic",     name: "Celtic",         emoji: "☘️", hint: "Ireland / Scotland" },
  { id: "andean",     name: "Andean",         emoji: "🏔️", hint: "Peru / Bolivia" },
  { id: "powwow",     name: "Powwow",         emoji: "🪶", hint: "Indigenous N. America" },
  { id: "ambient",    name: "Ambient",        emoji: "🌙", hint: "Drone & texture" },
];
