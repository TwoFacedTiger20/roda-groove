// Shared types for the instrument system.

export type Origin =
  | "Brazil"
  | "Caribbean"
  | "Latin"
  | "Africa"
  | "Middle East"
  | "India"
  | "East Asia"
  | "Southeast Asia"
  | "Europe"
  | "Andes"
  | "North America"
  | "Oceania";

export type InstrumentId =
  // Brazil
  | "surdo" | "repinique" | "caixa" | "tamborim" | "agogo" | "pandeiro" | "cuica" | "berimbau"
  // Caribbean
  | "conga" | "bongo" | "timbales" | "steelpan"
  // Latin
  | "clave" | "cowbell" | "guiro" | "maracas" | "cajon" | "charango"
  // Africa
  | "djembe" | "talkingdrum" | "kalimba" | "udu" | "shekere" | "balafon" | "mbira" | "dundun"
  // Middle East
  | "darbuka" | "riq" | "frame_drum" | "oud" | "qanun"
  // India
  | "tabla_dha" | "tabla_na" | "mridangam" | "sitar" | "tanpura" | "ghatam"
  // East Asia
  | "taiko" | "koto" | "shamisen" | "guzheng" | "wood_block_china"
  // Southeast Asia
  | "gamelan_gong" | "gamelan_bonang" | "angklung"
  // Europe
  | "bodhran" | "tin_whistle" | "accordion" | "hang_drum"
  // Andes
  | "quena" | "zampona" | "bombo"
  // North America
  | "powwow_drum" | "rattle"
  // Oceania
  | "didgeridoo" | "log_drum"
  // Universal
  | "shaker" | "triangle" | "wood_block" | "tambourine" | "rim_shot";

export type InstrumentMeta = {
  id: InstrumentId;
  name: string;
  origin: Origin;
  emoji: string;
  color: string; // css var
  hint: string;
};

// Note name → frequency (Hz). Useful range for our pitched voices.
export const NOTE_FREQS: Record<string, number> = {
  A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77,
  C6: 1046.5,
};
