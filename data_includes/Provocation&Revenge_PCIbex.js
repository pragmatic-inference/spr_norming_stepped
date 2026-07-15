/*
 * Provocation & Revenge — three-stage PCIbex norming experiment
 * ------------------------------------------------------------------
 * Stage 1: prediction from the sentence prefix
 * Stage 2: interpretation after the complete sentence
 * Stage 3: subjective report of whether the expectation changed
 *
 * Data:
 *   chunk_includes/sentences_mvb_8_versions.csv
 *
 * Script:
 *   data_includes/Provocation_Revenge_PCIbex.js
 *
 * Only generated_version = both_male / both_female is used.
 */

PennController.ResetPrefix(null);

// Uncomment only before publishing.
// DebugOff();

// ============================================================
// CONFIGURATION
// ============================================================

const DATA_FILE = "sentences_mvb_8_versions.csv";

const PREFIX_TIMEOUT_MS = 30000;
const FULL_SENTENCE_TIMEOUT_MS = 30000;
const CHANGE_REPORT_TIMEOUT_MS = 15000;
const STAGE_TRANSITION_MS = 250;
const INTER_TRIAL_INTERVAL_MS = 300;

// Replace with the completion code for the new Prolific study.
const confirmationLink =
  "https://app.prolific.com/submissions/complete?cc=CNAM6AA1";

// ============================================================
// PARTICIPANT IDS AND WHOLE-EXPERIMENT TIMING
// ============================================================

window.PROLIFIC_ID =
  GetURLParameter("PROLIFIC_PID") ||
  ("tmp_" + Math.random().toString(36).slice(2));

window.STUDY_ID =
  GetURLParameter("STUDY_ID") || "";

window.SESSION_ID =
  GetURLParameter("SESSION_ID") || "";

window.__expStart = Date.now();
window.__expEnd = null;
window.__expDuration = null;

window.__normingStart = null;
window.__normingEnd = null;
window.__normingDuration = null;

window.__threeStageState = {};

Header()
  .log("PROLIFIC_ID", window.PROLIFIC_ID)
  .log("STUDY_ID", window.STUDY_ID)
  .log("SESSION_ID", window.SESSION_ID);

// ============================================================
// STYLING
// ============================================================

Header(
  newFunction("inject_three_stage_css", function () {
    if (document.getElementById("three-stage-norming-css")) {
      return;
    }

    const style = document.createElement("style");
    style.id = "three-stage-norming-css";

    style.innerHTML = `
      body {
        margin-top: 40px !important;
        font-family: Arial, Helvetica, sans-serif;
      }

      .stage-label {
        max-width: 1000px;
        margin: 0 auto 18px auto;
        font-size: 19px;
        font-weight: 700;
        letter-spacing: 0.02em;
        text-align: center;
        text-transform: uppercase;
      }

      .norming-fragment,
      .norming-sentence {
        max-width: 1100px;
        margin: 0 auto 34px auto;
        font-size: 30px;
        line-height: 1.55;
        text-align: center;
      }

      .norming-question {
        max-width: 980px;
        margin: 0 auto 24px auto;
        font-size: 27px;
        line-height: 1.45;
        font-weight: 600;
        text-align: center;
      }

      .norming-hint {
        max-width: 950px;
        margin: 18px auto 0 auto;
        font-size: 19px;
        line-height: 1.45;
        font-style: italic;
        text-align: center;
      }
    `;

    document.head.appendChild(style);
  }).call()
);

// ============================================================
// GENERAL HELPERS
// ============================================================

function cleanCell(value) {
  return String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();
}

function stripFinalPunctuation(value) {
  return cleanCell(value)
    .replace(/[\s,.;:!?]+$/g, "")
    .trim();
}

function capitalizeFirst(value) {
  const text = cleanCell(value);

  return text
    ? text.charAt(0).toUpperCase() + text.slice(1)
    : "";
}

function escapeHTML(value) {
  return cleanCell(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeId(value) {
  return String(value).replace(/[^A-Za-z0-9_-]/g, "_");
}

// ============================================================
// GENDER-AWARE NOMINATIVE ANSWER FORMS
// ============================================================

/*
 * Exact corrections for weak masculine nouns where changing only
 * the determiner is insufficient.
 *
 * Extend this dictionary when additional such nouns occur in the CSV.
 */
const NOMINATIVE_NP_OVERRIDES = {
  "male|den löwen": "Der Löwe",
  "male|dem löwen": "Der Löwe",

  "male|den studenten": "Der Student",
  "male|dem studenten": "Der Student",

  "male|den menschen": "Der Mensch",
  "male|dem menschen": "Der Mensch",

  "male|den jungen": "Der Junge",
  "male|dem jungen": "Der Junge",

  "male|den kollegen": "Der Kollege",
  "male|dem kollegen": "Der Kollege",

  "male|den kunden": "Der Kunde",
  "male|dem kunden": "Der Kunde",

  "male|den komponisten": "Der Komponist",
  "male|dem komponisten": "Der Komponist",

  "male|den reisenden": "Der Reisende",
  "male|dem reisenden": "Der Reisende",

  "male|den angestellten": "Der Angestellte",
  "male|dem angestellten": "Der Angestellte"
};

const MASCULINE_NOMINATIVE_DETERMINERS = {
  der: "der",
  den: "der",
  dem: "der",
  des: "der",

  ein: "ein",
  einen: "ein",
  einem: "ein",
  eines: "ein",

  kein: "kein",
  keinen: "kein",
  keinem: "kein",
  keines: "kein",

  mein: "mein",
  meinen: "mein",
  meinem: "mein",
  meines: "mein",

  dein: "dein",
  deinen: "dein",
  deinem: "dein",
  deines: "dein",

  sein: "sein",
  seinen: "sein",
  seinem: "sein",
  seines: "sein",

  ihr: "ihr",
  ihren: "ihr",
  ihrem: "ihr",
  ihres: "ihr",

  unser: "unser",
  unseren: "unser",
  unserem: "unser",
  unseres: "unser",

  euer: "euer",
  euren: "euer",
  eurem: "euer",
  eures: "euer",

  dieser: "dieser",
  diesen: "dieser",
  diesem: "dieser",
  dieses: "dieser",

  jeder: "jeder",
  jeden: "jeder",
  jedem: "jeder",
  jedes: "jeder",

  jener: "jener",
  jenen: "jener",
  jenem: "jener",
  jenes: "jener",

  welcher: "welcher",
  welchen: "welcher",
  welchem: "welcher",
  welches: "welcher",

  solcher: "solcher",
  solchen: "solcher",
  solchem: "solcher",
  solches: "solcher",

  mancher: "mancher",
  manchen: "mancher",
  manchem: "mancher",
  manches: "mancher"
};

const FEMININE_NOMINATIVE_DETERMINERS = {
  die: "die",

  // Feminine dative: der Lehrerin -> die Lehrerin
  der: "die",

  eine: "eine",
  einer: "eine",

  keine: "keine",
  keiner: "keine",

  meine: "meine",
  meiner: "meine",

  deine: "deine",
  deiner: "deine",

  seine: "seine",
  seiner: "seine",

  ihre: "ihre",
  ihrer: "ihre",

  unsere: "unsere",
  unserer: "unsere",

  eure: "eure",
  eurer: "eure",

  diese: "diese",
  dieser: "diese",

  jede: "jede",
  jeder: "jede",

  jene: "jene",
  jener: "jene",

  welche: "welche",
  welcher: "welche",

  solche: "solche",
  solcher: "solche",

  manche: "manche",
  mancher: "manche"
};

function toStandaloneNominative(value, gender) {
  const source = stripFinalPunctuation(value);

  if (!source) {
    return "";
  }

  if (gender !== "male" && gender !== "female") {
    throw new Error(
      "Unknown gender passed to toStandaloneNominative: " + gender
    );
  }

  const overrideKey = gender + "|" + source.toLowerCase();

  if (
    Object.prototype.hasOwnProperty.call(
      NOMINATIVE_NP_OVERRIDES,
      overrideKey
    )
  ) {
    return NOMINATIVE_NP_OVERRIDES[overrideKey];
  }

  const words = source.split(/\s+/);
  const originalDeterminer = words.shift();
  const determiner = originalDeterminer.toLowerCase();
  const rest = words.join(" ");

  const determinerMap =
    gender === "male"
      ? MASCULINE_NOMINATIVE_DETERMINERS
      : FEMININE_NOMINATIVE_DETERMINERS;

  const nominativeDeterminer =
    Object.prototype.hasOwnProperty.call(determinerMap, determiner)
      ? determinerMap[determiner]
      : originalDeterminer;

  return capitalizeFirst(
    rest
      ? nominativeDeterminer + " " + rest
      : nominativeDeterminer
  );
}

// ============================================================
// MATERIAL GENERATION
// ============================================================

function buildPredictionFragment(row) {
  const np1 = stripFinalPunctuation(row.NP1);
  const verb = stripFinalPunctuation(row.verb);

  /*
   * row.NP2 may deliberately contain a separable verb particle and comma:
   *
   *   den Lehrer auf,
   *
   * Therefore it is used here exactly as it occurs in the selected row.
   */
  const np2 = cleanCell(row.NP2);
  const because = stripFinalPunctuation(row.because);
  const pronoun = stripFinalPunctuation(row.pronoun);

  const fragment = [
    np1,
    verb,
    np2,
    because,
    pronoun,
    "…"
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  return fragment;
}

function buildNormingQuestion(row) {
  const prepositionalPhrase =
    stripFinalPunctuation(row["präposition"]);

  const predicateWithVerb =
    stripFinalPunctuation(row["adjective + verb"]);

  const parts = predicateWithVerb
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    const finiteVerb = parts.pop().toLowerCase();
    const predicate = parts.join(" ");

    const middle = prepositionalPhrase
      ? " " + prepositionalPhrase
      : "";

    return (
      `Wer ${finiteVerb}${middle} ${predicate}?`
        .replace(/\s+/g, " ")
        .trim()
    );
  }

  const pronoun = cleanCell(row.pronoun);

  if (pronoun) {
    return `Auf wen bezieht sich das Pronomen „${pronoun}“?`;
  }

  return (
    "Auf welche der beiden Personen bezieht sich der weil-Satz?"
  );
}

function getThreeStageMaterials(row) {
  const generatedVersion =
    cleanCell(row.generated_version).toLowerCase();

  if (
    generatedVersion !== "both_male" &&
    generatedVersion !== "both_female"
  ) {
    throw new Error(
      "Expected both_male or both_female, but received: " +
      generatedVersion
    );
  }

  const genderCondition =
    generatedVersion === "both_male"
      ? "male"
      : "female";

  const np1Source =
    genderCondition === "male"
      ? row["NP1 - male"]
      : row["NP1 - female"];

  const np2Source =
    genderCondition === "male"
      ? row["NP2 - male"]
      : row["NP2 - female"];

  const fragment = buildPredictionFragment(row);
  const fullSentence = cleanCell(row["Generated-Sentence"]);
  const fullQuestion = buildNormingQuestion(row);

  const np1Text =
    toStandaloneNominative(np1Source, genderCondition);

  const np2Text =
    toStandaloneNominative(np2Source, genderCondition);

  const missing = [];

  if (!fragment) {
    missing.push("prediction fragment");
  }

  if (!fullSentence) {
    missing.push("Generated-Sentence");
  }

  if (!fullQuestion) {
    missing.push("generated full-sentence question");
  }

  if (!np1Text) {
    missing.push(
      genderCondition === "male"
        ? "NP1 - male"
        : "NP1 - female"
    );
  }

  if (!np2Text) {
    missing.push(
      genderCondition === "male"
        ? "NP2 - male"
        : "NP2 - female"
    );
  }

  if (missing.length > 0) {
    throw new Error(
      "Missing material for list_item=" +
      cleanCell(row.list_item) +
      ", generated_version=" +
      generatedVersion +
      ": " +
      missing.join(", ")
    );
  }

  return {
    fragment,
    fullSentence,
    fullQuestion,
    np1Text,
    np2Text,
    generatedVersion,
    genderCondition,
    rawNP1Source: cleanCell(np1Source),
    rawNP2Source: cleanCell(np2Source)
  };
}

function getDesignReferent(row) {
  const causality = cleanCell(row.Causality).toUpperCase();

  if (causality.indexOf("NP1") === 0) {
    return "NP1";
  }

  if (causality.indexOf("NP2") === 0) {
    return "NP2";
  }

  return "";
}

// ============================================================
// COUNTERBALANCING AND RANDOMIZATION
// ============================================================

function hashStringToUint32(value) {
  const text = String(value || "");
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;

  return function () {
    state += 0x6d2b79f5;

    let value = Math.imul(
      state ^ (state >>> 15),
      1 | state
    );

    value ^=
      value +
      Math.imul(
        value ^ (value >>> 7),
        61 | value
      );

    return (
      ((value ^ (value >>> 14)) >>> 0) /
      4294967296
    );
  };
}

function fisherYatesSeeded(array, randomFunction) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(
      randomFunction() * (i + 1)
    );

    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

function causalityRank(row) {
  const causality = cleanCell(row.Causality).toUpperCase();

  if (causality.indexOf("NP1") === 0) {
    return 0;
  }

  if (causality.indexOf("NP2") === 0) {
    return 1;
  }

  return 2;
}

function genderRank(row) {
  const version =
    cleanCell(row.generated_version).toLowerCase();

  if (version === "both_male") {
    return 0;
  }

  if (version === "both_female") {
    return 1;
  }

  return 2;
}

function validateSameGenderVariants(listItem, rows) {
  const expected = [
    "NP1-Causality|both_male",
    "NP1-Causality|both_female",
    "NP2-Causality|both_male",
    "NP2-Causality|both_female"
  ];

  const found = rows.map(function (row) {
    return (
      cleanCell(row.Causality) +
      "|" +
      cleanCell(row.generated_version).toLowerCase()
    );
  });

  const missing = expected.filter(function (condition) {
    return !found.includes(condition);
  });

  const duplicates = found.filter(function (
    condition,
    index,
    array
  ) {
    return array.indexOf(condition) !== index;
  });

  if (
    rows.length !== 4 ||
    missing.length > 0 ||
    duplicates.length > 0
  ) {
    throw new Error(
      "Invalid same-gender variants for list_item=" +
      listItem +
      ". Found: [" +
      found.join(", ") +
      "]. Missing: [" +
      missing.join(", ") +
      "]."
    );
  }
}

// ============================================================
// THREE-STAGE RESPONSE STATE
// ============================================================

function initializeThreeStageState(stateKey) {
  window.__threeStageState[stateKey] = {
    trial_start_epoch_ms: Date.now(),

    prefix_onset_epoch_ms: null,
    prefix_onset_performance_ms: null,
    prefix_response_epoch_ms: null,
    prefix_response_code: "",
    prefix_response_text: "",
    prefix_response_side: "",
    prefix_rt_ms: null,
    prefix_timed_out: 0,

    full_onset_epoch_ms: null,
    full_onset_performance_ms: null,
    full_response_epoch_ms: null,
    full_response_code: "",
    full_response_text: "",
    full_response_side: "",
    full_rt_ms: null,
    full_timed_out: 0,

    change_onset_epoch_ms: null,
    change_onset_performance_ms: null,
    change_response_epoch_ms: null,
    change_response_code: "",
    change_response_text: "",
    change_response_side: "",
    change_rt_ms: null,
    change_timed_out: 0,

    objective_changed: "",
    subjective_changed: "",
    change_report_matches_choices: "",

    trial_end_epoch_ms: null,
    trial_duration_ms: null
  };
}

function markStageOnset(stateKey, stage) {
  const state = window.__threeStageState[stateKey];

  state[stage + "_onset_epoch_ms"] = Date.now();
  state[stage + "_onset_performance_ms"] =
    performance.now();
}

function recordStageChoice(
  stateKey,
  stage,
  code,
  text,
  side
) {
  const state = window.__threeStageState[stateKey];

  if (!state || state[stage + "_response_code"]) {
    return;
  }

  state[stage + "_response_epoch_ms"] = Date.now();
  state[stage + "_response_code"] = code;
  state[stage + "_response_text"] = text;
  state[stage + "_response_side"] = side;

  state[stage + "_rt_ms"] = Math.round(
    performance.now() -
    state[stage + "_onset_performance_ms"]
  );
}

function finalizeStageTimeout(
  stateKey,
  stage,
  timeoutMs
) {
  const state = window.__threeStageState[stateKey];

  if (!state[stage + "_response_code"]) {
    state[stage + "_response_epoch_ms"] = Date.now();
    state[stage + "_response_code"] = "TIMEOUT";
    state[stage + "_response_text"] = "";
    state[stage + "_response_side"] = "";
    state[stage + "_rt_ms"] = timeoutMs;
    state[stage + "_timed_out"] = 1;
  }
}

function computeObjectiveChange(stateKey) {
  const state = window.__threeStageState[stateKey];

  const prefixCode = state.prefix_response_code;
  const fullCode = state.full_response_code;

  if (
    (prefixCode === "NP1" || prefixCode === "NP2") &&
    (fullCode === "NP1" || fullCode === "NP2")
  ) {
    state.objective_changed =
      prefixCode === fullCode ? 0 : 1;
  }
  else {
    state.objective_changed = "";
  }
}

function finalizeThreeStageTrial(stateKey) {
  const state = window.__threeStageState[stateKey];

  if (state.change_response_code === "YES") {
    state.subjective_changed = 1;
  }
  else if (state.change_response_code === "NO") {
    state.subjective_changed = 0;
  }
  else {
    state.subjective_changed = "";
  }

  if (
    (state.objective_changed === 0 ||
      state.objective_changed === 1) &&
    (state.subjective_changed === 0 ||
      state.subjective_changed === 1)
  ) {
    state.change_report_matches_choices =
      state.objective_changed === state.subjective_changed
        ? 1
        : 0;
  }
  else {
    state.change_report_matches_choices = "";
  }

  state.trial_end_epoch_ms = Date.now();
  state.trial_duration_ms =
    state.trial_end_epoch_ms -
    state.trial_start_epoch_ms;
}

function threeStageValue(stateKey, field) {
  const state = window.__threeStageState[stateKey] || {};

  return state[field] == null
    ? ""
    : state[field];
}

// ============================================================
// REUSABLE THREE-STAGE TRIAL
// ============================================================

function createThreeStageTrial(trialLabel, config) {
  const uid = sanitizeId(config.uid);
  const stateKey = String(config.stateKey);

  const prefixLeftButton = "prefix_left_" + uid;
  const prefixRightButton = "prefix_right_" + uid;
  const prefixTimer = "prefix_timer_" + uid;

  const fullLeftButton = "full_left_" + uid;
  const fullRightButton = "full_right_" + uid;
  const fullTimer = "full_timer_" + uid;

  const changeLeftButton = "change_left_" + uid;
  const changeRightButton = "change_right_" + uid;
  const changeTimer = "change_timer_" + uid;

  const commands = [
    newFunction(
      "initialize_three_stage_" + uid,
      function () {
        initializeThreeStageState(stateKey);

        if (
          config.isCritical &&
          window.__normingStart === null
        ) {
          window.__normingStart = Date.now();
        }
      }
    ).call(),

    // --------------------------------------------------------
    // STAGE 1: PREFIX PREDICTION
    // --------------------------------------------------------

    newText(
      "prefix_stage_label_" + uid,
      '<div class="stage-label">Teil 1: Ihre Erwartung</div>'
    ).print(),

    newText(
      "prefix_fragment_" + uid,
      '<div class="norming-fragment">' +
      escapeHTML(config.fragment) +
      "</div>"
    ).print(),

    newText(
      "prefix_question_" + uid,
      '<div class="norming-question">' +
      "Auf wen wird sich die folgende Beschreibung Ihrer " +
      "Erwartung nach am ehesten beziehen?" +
      "</div>"
    ).print(),

    newTimer(prefixTimer, PREFIX_TIMEOUT_MS),

    newButton(
      prefixLeftButton,
      config.prefixLeftText
    )
      .css({
        width: "380px",
        "min-height": "72px",
        padding: "14px 22px",
        "font-size": "24px",
        "line-height": "1.25",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .callback(
        newFunction(
          "record_prefix_left_" + uid,
          function () {
            recordStageChoice(
              stateKey,
              "prefix",
              config.prefixLeftCode,
              config.prefixLeftText,
              "left"
            );
          }
        ).call(),
        getButton(prefixLeftButton).disable(),
        getButton(prefixRightButton).disable(),
        getTimer(prefixTimer).stop()
      ),

    newButton(
      prefixRightButton,
      config.prefixRightText
    )
      .css({
        width: "380px",
        "min-height": "72px",
        padding: "14px 22px",
        "font-size": "24px",
        "line-height": "1.25",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .callback(
        newFunction(
          "record_prefix_right_" + uid,
          function () {
            recordStageChoice(
              stateKey,
              "prefix",
              config.prefixRightCode,
              config.prefixRightText,
              "right"
            );
          }
        ).call(),
        getButton(prefixLeftButton).disable(),
        getButton(prefixRightButton).disable(),
        getTimer(prefixTimer).stop()
      ),

    newCanvas(
      "prefix_answers_" + uid,
      1000,
      115
    )
      .add(
        85,
        15,
        getButton(prefixLeftButton)
      )
      .add(
        535,
        15,
        getButton(prefixRightButton)
      )
      .center()
      .print(),

    newText(
      "prefix_hint_" + uid,
      '<div class="norming-hint">' +
      "Bitte antworten Sie aufgrund Ihrer spontanen Erwartung. " +
      "Sie sehen den vollständigen Satz anschließend." +
      "</div>"
    ).print(),

    newFunction(
      "mark_prefix_onset_" + uid,
      function () {
        markStageOnset(stateKey, "prefix");
      }
    ).call(),

    getTimer(prefixTimer)
      .start()
      .wait(),

    newFunction(
      "finalize_prefix_" + uid,
      function () {
        finalizeStageTimeout(
          stateKey,
          "prefix",
          PREFIX_TIMEOUT_MS
        );
      }
    ).call(),

    clear(),

    newTimer(
      "transition_one_" + uid,
      STAGE_TRANSITION_MS
    )
      .start()
      .wait(),

    // --------------------------------------------------------
    // STAGE 2: FULL-SENTENCE INTERPRETATION
    // --------------------------------------------------------

    newText(
      "full_stage_label_" + uid,
      '<div class="stage-label">Teil 2: Der vollständige Satz</div>'
    ).print(),

    newText(
      "full_sentence_" + uid,
      '<div class="norming-sentence">' +
      escapeHTML(config.fullSentence) +
      "</div>"
    ).print(),

    newText(
      "full_question_" + uid,
      '<div class="norming-question">' +
      escapeHTML(config.fullQuestion) +
      "</div>"
    ).print(),

    newTimer(
      fullTimer,
      FULL_SENTENCE_TIMEOUT_MS
    ),

    newButton(
      fullLeftButton,
      config.fullLeftText
    )
      .css({
        width: "380px",
        "min-height": "72px",
        padding: "14px 22px",
        "font-size": "24px",
        "line-height": "1.25",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .callback(
        newFunction(
          "record_full_left_" + uid,
          function () {
            recordStageChoice(
              stateKey,
              "full",
              config.fullLeftCode,
              config.fullLeftText,
              "left"
            );
          }
        ).call(),
        getButton(fullLeftButton).disable(),
        getButton(fullRightButton).disable(),
        getTimer(fullTimer).stop()
      ),

    newButton(
      fullRightButton,
      config.fullRightText
    )
      .css({
        width: "380px",
        "min-height": "72px",
        padding: "14px 22px",
        "font-size": "24px",
        "line-height": "1.25",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .callback(
        newFunction(
          "record_full_right_" + uid,
          function () {
            recordStageChoice(
              stateKey,
              "full",
              config.fullRightCode,
              config.fullRightText,
              "right"
            );
          }
        ).call(),
        getButton(fullLeftButton).disable(),
        getButton(fullRightButton).disable(),
        getTimer(fullTimer).stop()
      ),

    newCanvas(
      "full_answers_" + uid,
      1000,
      115
    )
      .add(
        85,
        15,
        getButton(fullLeftButton)
      )
      .add(
        535,
        15,
        getButton(fullRightButton)
      )
      .center()
      .print(),

    newText(
      "full_hint_" + uid,
      '<div class="norming-hint">' +
      "Bitte wählen Sie nun die Interpretation des vollständigen Satzes." +
      "</div>"
    ).print(),

    newFunction(
      "mark_full_onset_" + uid,
      function () {
        markStageOnset(stateKey, "full");
      }
    ).call(),

    getTimer(fullTimer)
      .start()
      .wait(),

    newFunction(
      "finalize_full_" + uid,
      function () {
        finalizeStageTimeout(
          stateKey,
          "full",
          FULL_SENTENCE_TIMEOUT_MS
        );

        computeObjectiveChange(stateKey);
      }
    ).call(),

    clear(),

    newTimer(
      "transition_two_" + uid,
      STAGE_TRANSITION_MS
    )
      .start()
      .wait(),

    // --------------------------------------------------------
    // STAGE 3: SUBJECTIVE CHANGE REPORT
    // --------------------------------------------------------

    newText(
      "change_stage_label_" + uid,
      '<div class="stage-label">Teil 3: Rückblick</div>'
    ).print(),

    newText(
      "change_question_" + uid,
      '<div class="norming-question">' +
      "Hat sich Ihre ursprüngliche Erwartung durch den " +
      "vollständigen Satz geändert?" +
      "</div>"
    ).print(),

    newTimer(
      changeTimer,
      CHANGE_REPORT_TIMEOUT_MS
    ),

    newButton(
      changeLeftButton,
      config.changeLeftText
    )
      .css({
        width: "300px",
        "min-height": "68px",
        padding: "14px 22px",
        "font-size": "24px",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .callback(
        newFunction(
          "record_change_left_" + uid,
          function () {
            recordStageChoice(
              stateKey,
              "change",
              config.changeLeftCode,
              config.changeLeftText,
              "left"
            );
          }
        ).call(),
        getButton(changeLeftButton).disable(),
        getButton(changeRightButton).disable(),
        getTimer(changeTimer).stop()
      ),

    newButton(
      changeRightButton,
      config.changeRightText
    )
      .css({
        width: "300px",
        "min-height": "68px",
        padding: "14px 22px",
        "font-size": "24px",
        cursor: "pointer",
        border: "2px solid #777",
        "border-radius": "9px",
        background: "#ffffff"
      })
      .callback(
        newFunction(
          "record_change_right_" + uid,
          function () {
            recordStageChoice(
              stateKey,
              "change",
              config.changeRightCode,
              config.changeRightText,
              "right"
            );
          }
        ).call(),
        getButton(changeLeftButton).disable(),
        getButton(changeRightButton).disable(),
        getTimer(changeTimer).stop()
      ),

    newCanvas(
      "change_answers_" + uid,
      850,
      110
    )
      .add(
        100,
        15,
        getButton(changeLeftButton)
      )
      .add(
        450,
        15,
        getButton(changeRightButton)
      )
      .center()
      .print(),

    newText(
      "change_hint_" + uid,
      '<div class="norming-hint">' +
      "Beantworten Sie diese Frage danach, wie Sie den Ablauf selbst erlebt haben." +
      "</div>"
    ).print(),

    newFunction(
      "mark_change_onset_" + uid,
      function () {
        markStageOnset(stateKey, "change");
      }
    ).call(),

    getTimer(changeTimer)
      .start()
      .wait(),

    newFunction(
      "finalize_change_" + uid,
      function () {
        finalizeStageTimeout(
          stateKey,
          "change",
          CHANGE_REPORT_TIMEOUT_MS
        );

        finalizeThreeStageTrial(stateKey);
      }
    ).call(),

    clear(),

    newTimer(
      "iti_" + uid,
      INTER_TRIAL_INTERVAL_MS
    )
      .start()
      .wait()
  ];

  const trial = trialLabel
    ? newTrial(trialLabel, ...commands)
    : newTrial(...commands);

  return trial
    .log("is_practice", config.isPractice ? 1 : 0)
    .log("trial_position", config.trialPosition || "")
    .log(
      "latin_list",
      config.listId == null ? "" : config.listId
    )
    .log(
      "latin_target_index",
      config.targetIndex == null ? "" : config.targetIndex
    )
    .log(
      "n_same_gender_variants",
      config.nVariants == null ? "" : config.nVariants
    )
    .log("list_item", config.listItem || "")
    .log("item_number", config.itemNumber || "")
    .log(
      "original_row_index",
      config.originalRowIndex || ""
    )
    .log(
      "generated_version",
      config.generatedVersion || ""
    )
    .log(
      "gender_condition",
      config.genderCondition || ""
    )
    .log("causality", config.causality || "")
    .log("design_referent", config.designReferent || "")
    .log("verb_bias", config.verbBias || "")
    .log("adj_amb", config.adjAmb || "")
    .log("pronoun", config.pronoun || "")

    .log("prediction_fragment", config.fragment)
    .log("full_sentence", config.fullSentence)
    .log("full_question", config.fullQuestion)

    .log("np1_answer", config.np1Text)
    .log("np2_answer", config.np2Text)
    .log("raw_np1_source", config.rawNP1Source || "")
    .log("raw_np2_source", config.rawNP2Source || "")

    .log("prefix_left_code", config.prefixLeftCode)
    .log("prefix_left_text", config.prefixLeftText)
    .log("prefix_right_code", config.prefixRightCode)
    .log("prefix_right_text", config.prefixRightText)
    .log(
      "prefix_sides_swapped",
      config.prefixSidesSwapped ? 1 : 0
    )

    .log("full_left_code", config.fullLeftCode)
    .log("full_left_text", config.fullLeftText)
    .log("full_right_code", config.fullRightCode)
    .log("full_right_text", config.fullRightText)
    .log(
      "full_sides_swapped",
      config.fullSidesSwapped ? 1 : 0
    )

    .log("change_left_code", config.changeLeftCode)
    .log("change_left_text", config.changeLeftText)
    .log("change_right_code", config.changeRightCode)
    .log("change_right_text", config.changeRightText)
    .log(
      "change_sides_swapped",
      config.changeSidesSwapped ? 1 : 0
    )

    .log(
      "prefix_onset_epoch_ms",
      function () {
        return threeStageValue(
          stateKey,
          "prefix_onset_epoch_ms"
        );
      }
    )
    .log(
      "prefix_response_epoch_ms",
      function () {
        return threeStageValue(
          stateKey,
          "prefix_response_epoch_ms"
        );
      }
    )
    .log(
      "prefix_response_code",
      function () {
        return threeStageValue(
          stateKey,
          "prefix_response_code"
        );
      }
    )
    .log(
      "prefix_response_text",
      function () {
        return threeStageValue(
          stateKey,
          "prefix_response_text"
        );
      }
    )
    .log(
      "prefix_response_side",
      function () {
        return threeStageValue(
          stateKey,
          "prefix_response_side"
        );
      }
    )
    .log(
      "prefix_rt_ms",
      function () {
        return threeStageValue(
          stateKey,
          "prefix_rt_ms"
        );
      }
    )
    .log(
      "prefix_timed_out",
      function () {
        return threeStageValue(
          stateKey,
          "prefix_timed_out"
        );
      }
    )

    .log(
      "full_onset_epoch_ms",
      function () {
        return threeStageValue(
          stateKey,
          "full_onset_epoch_ms"
        );
      }
    )
    .log(
      "full_response_epoch_ms",
      function () {
        return threeStageValue(
          stateKey,
          "full_response_epoch_ms"
        );
      }
    )
    .log(
      "full_response_code",
      function () {
        return threeStageValue(
          stateKey,
          "full_response_code"
        );
      }
    )
    .log(
      "full_response_text",
      function () {
        return threeStageValue(
          stateKey,
          "full_response_text"
        );
      }
    )
    .log(
      "full_response_side",
      function () {
        return threeStageValue(
          stateKey,
          "full_response_side"
        );
      }
    )
    .log(
      "full_rt_ms",
      function () {
        return threeStageValue(
          stateKey,
          "full_rt_ms"
        );
      }
    )
    .log(
      "full_timed_out",
      function () {
        return threeStageValue(
          stateKey,
          "full_timed_out"
        );
      }
    )

    .log(
      "change_onset_epoch_ms",
      function () {
        return threeStageValue(
          stateKey,
          "change_onset_epoch_ms"
        );
      }
    )
    .log(
      "change_response_epoch_ms",
      function () {
        return threeStageValue(
          stateKey,
          "change_response_epoch_ms"
        );
      }
    )
    .log(
      "change_response_code",
      function () {
        return threeStageValue(
          stateKey,
          "change_response_code"
        );
      }
    )
    .log(
      "change_response_text",
      function () {
        return threeStageValue(
          stateKey,
          "change_response_text"
        );
      }
    )
    .log(
      "change_response_side",
      function () {
        return threeStageValue(
          stateKey,
          "change_response_side"
        );
      }
    )
    .log(
      "change_rt_ms",
      function () {
        return threeStageValue(
          stateKey,
          "change_rt_ms"
        );
      }
    )
    .log(
      "change_timed_out",
      function () {
        return threeStageValue(
          stateKey,
          "change_timed_out"
        );
      }
    )

    .log(
      "objective_changed",
      function () {
        return threeStageValue(
          stateKey,
          "objective_changed"
        );
      }
    )
    .log(
      "subjective_changed",
      function () {
        return threeStageValue(
          stateKey,
          "subjective_changed"
        );
      }
    )
    .log(
      "change_report_matches_choices",
      function () {
        return threeStageValue(
          stateKey,
          "change_report_matches_choices"
        );
      }
    )
    .log(
      "three_stage_trial_duration_ms",
      function () {
        return threeStageValue(
          stateKey,
          "trial_duration_ms"
        );
      }
    );
}

// ============================================================
// EXPERIMENT ORDER
// ============================================================

Sequence(
  "consent",
  "instructions",
  "practice",
  "go",
  "norming",
  "record_norming_time",
  "conclude",
  "exit",
  "demo",
  "debrief",
  "record_total_time",
  SendResults(),
  "submit"
);

// ============================================================
// CONSENT
// ============================================================

newTrial(
  "consent",

  newHtml(
    "consent_form",
    "consent.html"
  )
    .cssContainer({
      width: "720px"
    })
    .checkboxWarning(
      "Sie müssen zustimmen, bevor Sie fortfahren können."
    )
    .print(),

  newButton(
    "consent_continue",
    "Zustimmen und fortfahren"
  )
    .css({
      "margin-top": "20px",
      padding: "12px 24px",
      "font-size": "16px",
      cursor: "pointer",
      "background-color": "#a51e37",
      color: "white",
      border: "none",
      "border-radius": "4px"
    })
    .center()
    .print()
    .wait(
      getHtml("consent_form")
        .test.complete()
        .failure(
          getHtml("consent_form").warn()
        )
    )
);

// ============================================================
// INSTRUCTIONS
// ============================================================

newTrial(
  "instructions",

  defaultText
    .css({
      "font-size": "24px",
      "line-height": "1.6",
      "text-align": "left"
    })
    .cssContainer({
      width: "900px",
      margin: "0 auto 18px auto"
    })
    .print(),

  newText(
    "inst_title",
    "<div style='text-align:center; font-size:32px; font-weight:700;'>" +
    "Willkommen!" +
    "</div>"
  ),

  newText(
    "inst_1",
    "Jede Aufgabe besteht aus drei kurzen Teilen."
  ),

  newText(
    "inst_2",
    "Zuerst sehen Sie nur den Anfang eines Satzes. " +
    "Bitte entscheiden Sie, auf welche der beiden genannten " +
    "Personen oder Lebewesen sich die folgende Beschreibung " +
    "Ihrer Erwartung nach beziehen wird."
  ),

  newText(
    "inst_3",
    "Danach sehen Sie den vollständigen Satz und beantworten " +
    "eine konkrete Frage zu seiner Interpretation."
  ),

  newText(
    "inst_4",
    "Zum Schluss geben Sie an, ob sich Ihre ursprüngliche " +
    "Erwartung durch den vollständigen Satz geändert hat."
  ),

  newText(
    "inst_5",
    "Es gibt keine Rückmeldung zu richtig oder falsch. " +
    "Uns interessieren Ihre spontanen sprachlichen Erwartungen " +
    "und Interpretationen."
  ),

  newText(
    "inst_6",
    "Lesen Sie aufmerksam, aber überlegen Sie nicht unnötig lange."
  ),

  newButton(
    "instructions_continue",
    "Beispiel starten"
  )
    .css({
      "margin-top": "18px",
      padding: "12px 22px",
      "font-size": "19px",
      cursor: "pointer"
    })
    .center()
    .print()
    .wait()
);

// ============================================================
// PRACTICE
// ============================================================

createThreeStageTrial(
  "practice",
  {
    uid: "practice_1",
    stateKey: "practice_1",

    fragment:
      "Die Fotografin traf die Redakteurin, weil sie …",

    fullSentence:
      "Die Fotografin traf die Redakteurin, weil sie " +
      "am Nachmittag sehr beschäftigt war.",

    fullQuestion:
      "Wer war am Nachmittag sehr beschäftigt?",

    np1Text: "Die Fotografin",
    np2Text: "Die Redakteurin",

    prefixLeftText: "Die Fotografin",
    prefixRightText: "Die Redakteurin",
    prefixLeftCode: "NP1",
    prefixRightCode: "NP2",
    prefixSidesSwapped: false,

    fullLeftText: "Die Redakteurin",
    fullRightText: "Die Fotografin",
    fullLeftCode: "NP2",
    fullRightCode: "NP1",
    fullSidesSwapped: true,

    changeLeftText: "Nein",
    changeRightText: "Ja",
    changeLeftCode: "NO",
    changeRightCode: "YES",
    changeSidesSwapped: true,

    isPractice: true,
    isCritical: false,
    trialPosition: 0
  }
);

// ============================================================
// MAIN-SECTION INTRODUCTION
// ============================================================

newTrial(
  "go",

  newText(
    "go_title",
    "<div style='text-align:center; font-size:32px; font-weight:700;'>" +
    "Hauptteil" +
    "</div>"
  ).print(),

  newText(
    "go_text",
    "Im Hauptteil funktioniert jede Aufgabe genauso. " +
    "Bitte antworten Sie in allen drei Teilen spontan und aufmerksam."
  )
    .css({
      "font-size": "26px",
      "line-height": "1.6",
      "text-align": "center"
    })
    .cssContainer({
      width: "900px",
      margin: "20px auto"
    })
    .print(),

  newButton(
    "go_continue",
    "Hauptteil beginnen"
  )
    .css({
      padding: "12px 22px",
      "font-size": "20px",
      cursor: "pointer"
    })
    .center()
    .print()
    .wait()
);

// ============================================================
// LOAD SAME-GENDER ROWS
// ============================================================

const sameGenderItems = {};

Template(
  GetTable(DATA_FILE),
  function (row) {
    const version =
      cleanCell(row.generated_version).toLowerCase();

    if (
      version !== "both_male" &&
      version !== "both_female"
    ) {
      return {};
    }

    const listItem = cleanCell(row.list_item);

    if (!listItem) {
      throw new Error(
        "A same-gender row has no list_item in " + DATA_FILE
      );
    }

    if (!sameGenderItems[listItem]) {
      sameGenderItems[listItem] = [];
    }

    sameGenderItems[listItem].push(row);

    return {};
  }
);

// ============================================================
// BUILD COUNTERBALANCED TRIALS
// ============================================================

AddTable(
  "build_three_stage_trials",
  "x\n1"
);

Template(
  "build_three_stage_trials",
  function () {
    const itemKeys = Object.keys(sameGenderItems).sort(
      function (a, b) {
        const aNumber = Number(a);
        const bNumber = Number(b);

        if (
          Number.isFinite(aNumber) &&
          Number.isFinite(bNumber)
        ) {
          return aNumber - bNumber;
        }

        return String(a).localeCompare(String(b));
      }
    );

    if (itemKeys.length === 0) {
      throw new Error(
        "No both_male or both_female rows were found in " +
        DATA_FILE
      );
    }

    itemKeys.forEach(function (itemKey) {
      validateSameGenderVariants(
        itemKey,
        sameGenderItems[itemKey]
      );

      sameGenderItems[itemKey].sort(
        function (firstRow, secondRow) {
          const causalityDifference =
            causalityRank(firstRow) -
            causalityRank(secondRow);

          if (causalityDifference !== 0) {
            return causalityDifference;
          }

          const genderDifference =
            genderRank(firstRow) -
            genderRank(secondRow);

          if (genderDifference !== 0) {
            return genderDifference;
          }

          return (
            Number(firstRow.original_row_index || 0) -
            Number(secondRow.original_row_index || 0)
          );
        }
      );
    });

    const globalSeed =
      hashStringToUint32(window.PROLIFIC_ID);

    const randomFunction =
      mulberry32(globalSeed);

    const listId = globalSeed % 4;
    const selectedRows = [];

    itemKeys.forEach(function (
      itemKey,
      itemIndex
    ) {
      const variants = sameGenderItems[itemKey];
      const targetIndex = (itemIndex + listId) % 4;

      selectedRows.push({
        itemKey,
        row: variants[targetIndex],
        targetIndex,
        nVariants: variants.length
      });
    });

    fisherYatesSeeded(
      selectedRows,
      randomFunction
    );

    const selectedTrials = [];

    selectedRows.forEach(function (
      entry,
      positionIndex
    ) {
      const row = entry.row;
      const materials = getThreeStageMaterials(row);

      const referentSwap =
        randomFunction() < 0.5;

      // 第一问和第二问保持相同的 NP1 / NP2 位置
      const prefixSwap =
        referentSwap;

      const fullSwap =
        referentSwap;

      const prefixLeftText = prefixSwap
        ? materials.np2Text
        : materials.np1Text;

      const prefixRightText = prefixSwap
        ? materials.np1Text
        : materials.np2Text;

      const prefixLeftCode = prefixSwap
        ? "NP2"
        : "NP1";

      const prefixRightCode = prefixSwap
        ? "NP1"
        : "NP2";

      const fullLeftText = fullSwap
        ? materials.np2Text
        : materials.np1Text;

      const fullRightText = fullSwap
        ? materials.np1Text
        : materials.np2Text;

      const fullLeftCode = fullSwap
        ? "NP2"
        : "NP1";

      const fullRightCode = fullSwap
        ? "NP1"
        : "NP2";

      const changeLeftText =
        "Ja";

      const changeRightText =
        "Nein";

      const changeLeftCode =
        "YES";

      const changeRightCode =
        "NO";

      const stateKey = [
        "three_stage",
        entry.itemKey,
        cleanCell(row.original_row_index),
        materials.generatedVersion,
        positionIndex + 1
      ].join("_");

      const trialObject = createThreeStageTrial(
        null,
        {
          uid: stateKey,
          stateKey,

          fragment: materials.fragment,
          fullSentence: materials.fullSentence,
          fullQuestion: materials.fullQuestion,

          np1Text: materials.np1Text,
          np2Text: materials.np2Text,

          prefixLeftText,
          prefixRightText,
          prefixLeftCode,
          prefixRightCode,
          prefixSidesSwapped: prefixSwap,

          fullLeftText,
          fullRightText,
          fullLeftCode,
          fullRightCode,
          fullSidesSwapped: fullSwap,

          changeLeftText,
          changeRightText,
          changeLeftCode,
          changeRightCode,
          changeSidesSwapped: changeSwap,

          isPractice: false,
          isCritical: true,
          trialPosition: positionIndex + 1,

          listId,
          targetIndex: entry.targetIndex,
          nVariants: entry.nVariants,
          listItem: entry.itemKey,

          itemNumber: cleanCell(row.item_number),
          originalRowIndex:
            cleanCell(row.original_row_index),

          generatedVersion:
            materials.generatedVersion,

          genderCondition:
            materials.genderCondition,

          causality: cleanCell(row.Causality),
          designReferent: getDesignReferent(row),
          verbBias: cleanCell(row.verb_bias),
          adjAmb: cleanCell(row.adj_amb),
          pronoun: cleanCell(row.pronoun),

          rawNP1Source: materials.rawNP1Source,
          rawNP2Source: materials.rawNP2Source
        }
      );

      selectedTrials.push([
        "norming",
        "PennController",
        trialObject
      ]);
    });

    window.items =
      (window.items || []).concat(selectedTrials);

    return {};
  }
);

// ============================================================
// NORMING-SECTION DURATION
// ============================================================

newTrial(
  "record_norming_time",

  newFunction(
    "store_norming_time",
    function () {
      window.__normingEnd = Date.now();

      if (window.__normingStart !== null) {
        window.__normingDuration =
          window.__normingEnd -
          window.__normingStart;
      }
    }
  ).call()
)
  .log(
    "norming_start_ms",
    function () {
      return window.__normingStart == null
        ? ""
        : window.__normingStart;
    }
  )
  .log(
    "norming_end_ms",
    function () {
      return window.__normingEnd == null
        ? ""
        : window.__normingEnd;
    }
  )
  .log(
    "norming_duration_ms",
    function () {
      return window.__normingDuration == null
        ? ""
        : window.__normingDuration;
    }
  )
  .log(
    "norming_duration_sec",
    function () {
      return window.__normingDuration == null
        ? ""
        : (window.__normingDuration / 1000).toFixed(3);
    }
  );

// ============================================================
// CONCLUSION
// ============================================================

newTrial(
  "conclude",

  newText(
    "conclude_title",
    "<div style='text-align:center; font-size:32px; font-weight:700;'>" +
    "Hauptteil abgeschlossen" +
    "</div>"
  ).print(),

  newText(
    "conclude_text",
    "Vielen Dank! Bitte füllen Sie nun noch die kurzen " +
    "Abschlussformulare aus."
  )
    .css({
      "font-size": "26px",
      "line-height": "1.6",
      "text-align": "center"
    })
    .cssContainer({
      width: "900px",
      margin: "20px auto"
    })
    .print(),

  newButton(
    "conclude_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait()
);

// ============================================================
// EXIT FORM
// ============================================================

newTrial(
  "exit",

  newHtml(
    "exit_form",
    "exit.html"
  )
    .cssContainer({
      width: "720px"
    })
    .inputWarning(
      "Sie müssen alle Fragen beantworten, bevor Sie fortfahren können."
    )
    .print()
    .log(),

  newButton(
    "exit_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait(
      getHtml("exit_form")
        .test.complete()
        .failure(
          getHtml("exit_form").warn()
        )
    )
);

// ============================================================
// DEMOGRAPHICS
// ============================================================

newTrial(
  "demo",

  newHtml(
    "demo_form",
    "demo.html"
  )
    .cssContainer({
      width: "720px"
    })
    .inputWarning(
      "Sie müssen alle Fragen beantworten, bevor Sie fortfahren können."
    )
    .print()
    .log(),

  newButton(
    "demo_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait(
      getHtml("demo_form")
        .test.complete()
        .failure(
          getHtml("demo_form").warn()
        )
    )
);

// ============================================================
// DEBRIEF
// ============================================================

newTrial(
  "debrief",

  newHtml(
    "debrief_form",
    "debrief.html"
  )
    .cssContainer({
      width: "720px"
    })
    .print(),

  newButton(
    "debrief_continue",
    "Weiter"
  )
    .center()
    .print()
    .wait()
);

// ============================================================
// WHOLE-EXPERIMENT DURATION
// ============================================================

newTrial(
  "record_total_time",

  newFunction(
    "store_total_time",
    function () {
      window.__expEnd = Date.now();
      window.__expDuration =
        window.__expEnd -
        window.__expStart;
    }
  ).call()
)
  .log(
    "exp_start_ms",
    function () {
      return window.__expStart;
    }
  )
  .log(
    "exp_end_ms",
    function () {
      return window.__expEnd;
    }
  )
  .log(
    "exp_duration_ms",
    function () {
      return window.__expDuration;
    }
  )
  .log(
    "exp_duration_sec",
    function () {
      return (
        window.__expDuration / 1000
      ).toFixed(3);
    }
  );

// ============================================================
// SUBMISSION
// ============================================================

newTrial(
  "submit",

  newText(
    "thanks",
    "<p>Vielen Dank für Ihre Teilnahme!</p>"
  )
    .center()
    .print(),

  newText(
    "prolific_link",
    "<a href='" +
    confirmationLink +
    "' target='_blank' style='font-weight:bold;'>" +
    "Klicken Sie hier für die Bestätigung auf Prolific" +
    "</a>" +
    "<p>Dieser Schritt ist notwendig, damit Ihre Teilnahme " +
    "bestätigt wird.</p>"
  )
    .center()
    .print(),

  newButton("void").wait()
);