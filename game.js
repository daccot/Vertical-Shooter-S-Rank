
(() => {
  const DEFAULT_LANG = (navigator.language || 'en').toLowerCase().startsWith('ja') ? 'ja' : 'en';
  window.__vsDefaultLang = DEFAULT_LANG;

  function trSafe(dict, key, fallback = "") {
    return (dict && key in dict) ? dict[key] : (fallback || key);
  }
  window.__vsTrSafe = trSafe;

  async function loadLocale(lang) {
    const normalized = lang === "ja" ? "ja" : "en";
    const url = chrome.runtime.getURL(`locales/${normalized}.json`);
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`Locale load failed: ${normalized}`);
    return await res.json();
  }
  window.__vsLoadLocale = loadLocale;

  async function buildAutoHUD() {
    const root = document.getElementById("ui-root");
    if (!root) return null;

    let locale = await loadLocale(DEFAULT_LANG);
    window.__vsLang = DEFAULT_LANG;
    window.__vsLocale = locale;

    root.innerHTML = `
      <div class="auto-hud-wrap">
        <div class="auto-hud-top">
          <div class="auto-hud-box">
            <div><span class="auto-label" id="label-score"></span><span id="score">0</span></div>
            <div><span class="auto-label" id="label-hi"></span><span id="hiscore">0</span></div>
            <div><span class="auto-label" id="label-stage"></span><span id="stage">1</span></div>
            <div><span class="auto-label" id="label-area"></span><span id="area">NORMAL</span></div>
          </div>
          <div class="auto-hud-box">
            <div><span class="auto-label" id="label-life"></span><span id="lives">3</span></div>
            <div><span class="auto-label" id="label-power"></span><span id="power">2</span></div>
            <div><span class="auto-label" id="label-bomb"></span><span id="bombs">3</span></div>
            <div><span class="auto-label" id="label-weapon"></span><span id="weapon">SPREAD</span></div>
          </div>
          <div class="auto-hud-box">
            <div><span class="auto-label" id="label-options"></span><span id="options">1</span></div>
            <div><span class="auto-label" id="label-shield"></span><span id="shield">0</span></div>
            <div><span class="auto-label" id="label-multi"></span><span id="multiplier">1.0</span></div>
            <div><span class="auto-label" id="label-graze"></span><span id="graze">0</span></div>
            <div><span class="auto-label" id="label-od"></span><span id="overdriveText">READY</span></div>
          </div>
        </div>

        <div class="auto-message" id="message"></div>

        <div class="auto-boss-hud" id="bossHud">
          <div class="auto-boss-top">
            <span id="bossName">BOSS</span>
            <span id="bossPhase">PHASE 1</span>
          </div>
          <div class="auto-boss-bar-outer">
            <div id="bossBar" class="auto-boss-bar-inner"></div>
          </div>
        </div>

        <div class="auto-top-info">
          <span id="difficultyView">DIFF 4</span>
          <span id="comboView">COMBO 0</span>
          <span id="riskView">RISK x1.0</span>
          <span id="formationView">FORM WIDE</span>
        </div>

        <div class="auto-warning-flash" id="warningFlash"></div>
        <div class="auto-damage-flash" id="damageFlash"></div>

        <div class="auto-panel auto-settings ui-clickable" id="settings">
          <h2 id="settingsTitle"></h2>
          <label><input type="checkbox" id="autofireToggle" /> <span id="autoFireText"></span></label>
          <label><input type="checkbox" id="bgmToggle" checked /> <span id="bgmText"></span></label>
          <label><span id="difficultyText"></span>
            <select id="difficultySelect">
              <option value="1"></option>
              <option value="2"></option>
              <option value="3"></option>
              <option value="4" selected></option>
              <option value="5"></option>
              <option value="6"></option>
              <option value="7"></option>
            </select>
          </label>
          <label><span id="languageText">LANGUAGE</span>
            <select id="languageSelect">
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </label>
          <div class="hint" id="controlsHint"></div>
        </div>

        <div class="auto-panel auto-debug ui-clickable" id="debugPanel">
          <h2 id="debugTitle"></h2>
          <div id="debugStats" class="auto-debug-stats">stats</div>
          <div class="auto-debug-row">
            <button id="toggleDebugBtn" type="button">DEBUG: ON</button>
            <button id="copyLogBtn" type="button"></button>
          </div>
          <div class="hint" id="logSavedText"></div>
        </div>

        <div class="auto-overlay" id="overlay">
          <div class="auto-panel large">
            <h1 id="overlayTitle"></h1>
            <p id="overlayText"></p>
            <ul>
              <li id="overlayBullet1"></li>
              <li id="overlayBullet2"></li>
              <li id="overlayBullet3"></li>
            </ul>
            <button id="startBtn"></button>
          </div>
        </div>
      </div>
    `;

    function applyStaticLocale(dict) {
      const set = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
      };
      set("label-score", trSafe(dict, "score"));
      set("label-hi", trSafe(dict, "hi"));
      set("label-stage", trSafe(dict, "stage"));
      set("label-area", trSafe(dict, "area"));
      set("label-life", trSafe(dict, "life"));
      set("label-power", trSafe(dict, "power"));
      set("label-bomb", trSafe(dict, "bomb"));
      set("label-weapon", trSafe(dict, "weapon"));
      set("label-options", trSafe(dict, "options"));
      set("label-shield", trSafe(dict, "shield"));
      set("label-multi", trSafe(dict, "multi"));
      set("label-graze", trSafe(dict, "graze"));
      set("label-od", trSafe(dict, "od"));
      set("settingsTitle", trSafe(dict, "settings"));
      set("autoFireText", trSafe(dict, "auto_fire"));
      set("bgmText", trSafe(dict, "bgm"));
      set("difficultyText", trSafe(dict, "difficulty"));
      set("languageText", "LANGUAGE");
      set("controlsHint", trSafe(dict, "hint_controls"));
      set("debugTitle", trSafe(dict, "debug"));
      set("copyLogBtn", trSafe(dict, "copy_log"));
      set("logSavedText", trSafe(dict, "logs_saved"));
      set("overlayTitle", trSafe(dict, "title"));
      set("overlayText", trSafe(dict, "subtitle"));
      set("overlayBullet1", trSafe(dict, "overlay_b1"));
      set("overlayBullet2", trSafe(dict, "overlay_b2"));
      set("overlayBullet3", trSafe(dict, "overlay_b3"));
      set("startBtn", trSafe(dict, "start"));

      const diffSel = document.getElementById("difficultySelect");
      if (diffSel && diffSel.options.length >= 7) {
        diffSel.options[0].text = trSafe(dict, "diff_1");
        diffSel.options[1].text = trSafe(dict, "diff_2");
        diffSel.options[2].text = trSafe(dict, "diff_3");
        diffSel.options[3].text = trSafe(dict, "diff_4");
        diffSel.options[4].text = trSafe(dict, "diff_5");
        diffSel.options[5].text = trSafe(dict, "diff_6");
        diffSel.options[6].text = trSafe(dict, "diff_7");
      }
      const langSel = document.getElementById("languageSelect");
      if (langSel) {
        langSel.value = window.__vsLang || DEFAULT_LANG;
        if (langSel.options.length >= 2) {
          langSel.options[0].text = "日本語"; 
          langSel.options[1].text = "English";
        }
      }
    }

    applyStaticLocale(locale);
    return root;
  }

  window.__vsBuildHUDPromise = buildAutoHUD();
})();



document.addEventListener('DOMContentLoaded', async ()=>{

(async () => {
  "use strict";

  const DEFAULT_LANG =
    window.__vsDefaultLang ||
    ((navigator.language || "en").toLowerCase().startsWith("ja") ? "ja" : "en");

  const trSafe =
    window.__vsTrSafe ||
    ((dict, key, fallback = "") =>
      dict && key in dict ? dict[key] : fallback || key);

  const loadLocale =
    window.__vsLoadLocale ||
    (async () => ({}));

  await (window.__vsBuildHUDPromise || Promise.resolve());
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const ui = {
    score: id("score"), hiscore: id("hiscore"), stage: id("stage"), area: id("area"),
    lives: id("lives"), power: id("power"), bombs: id("bombs"), weapon: id("weapon"),
    options: id("options"), shield: id("shield"), multiplier: id("multiplier"), graze: id("graze"), overdriveText: id("overdriveText"),
    difficultyView: id("difficultyView"), comboView: id("comboView"), riskView: id("riskView"), formationView: id("formationView"),
    message: id("message"), bossHud: id("bossHud"), bossName: id("bossName"), bossPhase: id("bossPhase"), bossBar: id("bossBar"), warningFlash: id("warningFlash"), damageFlash: id("damageFlash"),
    overlay: id("overlay"), overlayTitle: id("overlayTitle"), overlayText: id("overlayText"), startBtn: id("startBtn"),
    autofireToggle: id("autofireToggle"), bgmToggle: id("bgmToggle"), difficultySelect: id("difficultySelect"), languageSelect: id("languageSelect"),
    debugStats: id("debugStats"), toggleDebugBtn: id("toggleDebugBtn"), copyLogBtn: id("copyLogBtn"), debugPanel: id("debugPanel")
  };
  function id(x){return document.getElementById(x) || null;}


  function currentLang(){ return window.__vsLang || DEFAULT_LANG; }
  function currentLocale(){ return window.__vsLocale || {}; }
  function t(key, fallback = ""){ return trSafe(currentLocale(), key, fallback); }

  async function switchLanguage(lang){
    const normalized = lang === "ja" ? "ja" : "en";
    window.__vsLang = normalized;
    window.__vsLocale = await loadLocale(normalized);

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    };

    set("label-score", t("score"));
    set("label-hi", t("hi"));
    set("label-stage", t("stage"));
    set("label-area", t("area"));
    set("label-life", t("life"));
    set("label-power", t("power"));
    set("label-bomb", t("bomb"));
    set("label-weapon", t("weapon"));
    set("label-options", t("options"));
    set("label-shield", t("shield"));
    set("label-multi", t("multi"));
    set("label-graze", t("graze"));
    set("label-od", t("od"));
    set("settingsTitle", t("settings"));
    set("autoFireText", t("auto_fire"));
    set("bgmText", t("bgm"));
    set("difficultyText", t("difficulty"));
    set("debugTitle", t("debug"));
    set("copyLogBtn", t("copy_log"));
    set("logSavedText", t("logs_saved"));
    set("overlayTitle", t("title"));
    set("overlayText", t("subtitle"));
    set("overlayBullet1", t("overlay_b1"));
    set("overlayBullet2", t("overlay_b2"));
    set("overlayBullet3", t("overlay_b3"));

    const diffSel = document.getElementById("difficultySelect");
    if (diffSel && diffSel.options.length >= 7) {
      diffSel.options[0].text = t("diff_1");
      diffSel.options[1].text = t("diff_2");
      diffSel.options[2].text = t("diff_3");
      diffSel.options[3].text = t("diff_4");
      diffSel.options[4].text = t("diff_5");
      diffSel.options[5].text = t("diff_6");
      diffSel.options[6].text = t("diff_7");
    }
    const langSel = document.getElementById("languageSelect");
    if (langSel) langSel.value = normalized;

    try {
      updateHud();
    } catch (e) {
      if (!String(e).includes("state")) {
        throw e;
      }
    }
  }

  const SETTINGS_KEY = "verticalShooterSRankV63Settings";
  const HI_KEY = "verticalShooterSRankV63Hi";
  const DEBUG_KEY = "verticalShooterSRankV63Logs";
  const clamp=(v,mn,mx)=>Math.max(mn,Math.min(mx,v));
  const rand=(a,b)=>Math.random()*(b-a)+a;
  const keys=new Set();

  const defaultSettings={autofire:true,bgm:true,debugVisible:false,difficulty:4,language:DEFAULT_LANG};
  const settings=loadSettings();
  settings.language = settings.language || DEFAULT_LANG;
  await switchLanguage(settings.language);
  ui.autofireToggle.checked=settings.autofire;
  ui.bgmToggle.checked=settings.bgm;
  ui.difficultySelect.value=String(settings.difficulty);
  if(ui.languageSelect) ui.languageSelect.value = settings.language;
  if(ui.debugPanel) ui.debugPanel.style.display=settings.debugVisible?"block":"none";
  safeSet(ui.toggleDebugBtn, settings.debugVisible?"DEBUG: ON":"DEBUG: OFF");

  ui.autofireToggle.addEventListener("change",()=>{settings.autofire=ui.autofireToggle.checked; saveSettings(); log("setting",{autofire:settings.autofire});});
  ui.bgmToggle.addEventListener("change",()=>{settings.bgm=ui.bgmToggle.checked; settings.bgm?playBGM():pauseBGM(); saveSettings();});
  ui.difficultySelect.addEventListener("change",()=>{settings.difficulty=Number(ui.difficultySelect.value); saveSettings(); showMessage(`DIFF ${settings.difficulty}`,50); log("difficulty",{difficulty:settings.difficulty});});
  if(ui.languageSelect){ ui.languageSelect.value = settings.language || DEFAULT_LANG; ui.languageSelect.addEventListener("change", async ()=>{ settings.language = ui.languageSelect.value; saveSettings(); await switchLanguage(settings.language); }); }
  ui.toggleDebugBtn.addEventListener("click",()=>{settings.debugVisible=!settings.debugVisible; ui.debugPanel.style.display=settings.debugVisible?"block":"none"; safeSet(ui.toggleDebugBtn, settings.debugVisible?"DEBUG: ON":"DEBUG: OFF"); saveSettings();});
  ui.copyLogBtn.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(state.logs.join("\n")); log("copylog",{ok:true,lines:state.logs.length});}catch{log("copylog",{ok:false});}});

  const bgm = new Audio("bgm.mp3"); bgm.loop=true; bgm.volume=0.45;
  const audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  function beep(freq=440,dur=0.05,type="square",vol=0.03,slide=0){
    try{
      const t=audioCtx.currentTime, osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
      osc.type=type; osc.frequency.setValueAtTime(freq,t);
      if(slide!==0) osc.frequency.linearRampToValueAtTime(freq+slide,t+dur);
      gain.gain.setValueAtTime(vol,t); gain.gain.exponentialRampToValueAtTime(0.0001,t+dur);
      osc.connect(gain).connect(audioCtx.destination); osc.start(t); osc.stop(t+dur);
    }catch(_){}
  }
  const sfx={shot:()=>beep(760,.03,"square",.02,-120), hit:()=>beep(220,.025,"triangle",.018,80), explosion:()=>beep(90,.12,"sawtooth",.045,-40), pickup:()=>beep(660,.07,"triangle",.028,180), bomb:()=>{beep(140,.18,"sawtooth",.06,-60);beep(60,.24,"triangle",.05,-20)}, warning:()=>beep(520,.12,"square",.03,-40), shield:()=>beep(880,.10,"triangle",.03,120), damage:()=>beep(160,.08,"sawtooth",.045,-80), laser:()=>beep(540,.05,"sawtooth",.02,160), homing:()=>beep(620,.04,"triangle",.018,40), overdrive:()=>beep(980,.12,"square",.03,-60), beam:()=>beep(300,.10,"sawtooth",.03,50)};

  function loadSettings(){try{return {...defaultSettings,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||"{}")};}catch{return {...defaultSettings};}}
  function saveSettings(){localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}
  function loadLogs(){try{return JSON.parse(localStorage.getItem(DEBUG_KEY)||"[]");}catch{return [];}}
  function saveLogs(){localStorage.setItem(DEBUG_KEY,JSON.stringify(state.logs.slice(-200)));}
  function log(ev,data={}){const line=`[${new Date().toISOString()}] ${ev} ${JSON.stringify(data)}`; state.logs.push(line); if(state.logs.length>200) state.logs.shift(); saveLogs(); console.log(line);}
  function playBGM(){if(settings.bgm) bgm.play().catch(()=>{});}
  function pauseBGM(){bgm.pause();}
  function diffCfg(){
    const m={
      1:{bulletCap:18,enemyHp:0.76,bulletSpeed:0.76,cool:1.35,item:1.30,bossHp:0.78,score:0.9},
      2:{bulletCap:21,enemyHp:0.84,bulletSpeed:0.84,cool:1.22,item:1.18,bossHp:0.86,score:0.95},
      3:{bulletCap:24,enemyHp:0.92,bulletSpeed:0.92,cool:1.11,item:1.08,bossHp:0.93,score:1.0},
      4:{bulletCap:30,enemyHp:1.20,bulletSpeed:1.06,cool:0.91,item:0.94,bossHp:1.95,score:1.12},
      5:{bulletCap:31,enemyHp:1.08,bulletSpeed:1.08,cool:0.93,item:0.95,bossHp:1.08,score:1.12},
      6:{bulletCap:35,enemyHp:1.17,bulletSpeed:1.16,cool:0.86,item:0.90,bossHp:1.16,score:1.2},
      7:{bulletCap:40,enemyHp:1.27,bulletSpeed:1.24,cool:0.79,item:0.86,bossHp:1.26,score:1.35}
    }; return m[settings.difficulty]||m[4];
  }

  const state={
    running:false, paused:false, gameOver:false, score:0, hiScore:Number(localStorage.getItem(HI_KEY)||0),
    stage:1, frame:0, stageTimer:0, stars:[], bullets:[], enemyBullets:[], enemies:[], items:[], effects:[], hazards:[], beams:[],
    player:null, midboss:null, boss:null, messageTimer:0, shake:0, hitstop:0, warningTimer:0, clearTimer:0, enemyBulletCap:27,
    logs:loadLogs(), areaName:"NORMAL", combo:0, comboTimer:0, noMissTimer:0, overdriveTimer:0, overdriveCooldown:0, multiplier:1.0, graze:0, spawnCursor:0, lastResult:null
  };

  function areaForStage(stage){
    const arr=[
      {name:"NORMAL", wind:0, dark:0, walls:false},
      {name:"WIND", wind:0.42, dark:0, walls:false},
      {name:"CANYON", wind:0, dark:0, walls:true},
      {name:"NIGHT", wind:0, dark:0.45, walls:false}
    ];
    return arr[(stage-1)%arr.length];
  }

  function bossThemeName(){
    const a=areaForStage(state.stage).name;
    if(a==="WIND") return "SKY SERPENT";
    if(a==="CANYON") return "FORTRESS CORE";
    if(a==="NIGHT") return "PHANTOM EYE";
    return "DREAD CRUISER";
  }

  function weaponName(){return ["SPREAD","LASER","HOMING"][state.player.weaponIndex];}

  function resetGame(){
    state.running=true; state.paused=false; state.gameOver=false; state.score=0; state.stage=1; state.frame=0; state.stageTimer=0;
    state.bullets=[]; state.enemyBullets=[]; state.enemies=[]; state.items=[]; state.effects=[]; state.hazards=[]; state.beams=[];
    state.midboss=null; state.boss=null; state.messageTimer=0; state.shake=0; state.hitstop=0; state.warningTimer=0; state.clearTimer=0;
    state.combo=0; state.comboTimer=0; state.noMissTimer=0; state.overdriveTimer=0; state.overdriveCooldown=0; state.multiplier=1.0; state.graze=0; state.spawnCursor=0;
    state.enemyBulletCap=diffCfg().bulletCap;
    state.player={x:W/2,y:H-90,speed:4.0,radius:10,power:2,lives:3,bombs:3,weaponIndex:0,shotCooldown:0,invuln:120,options:1,shield:0,formation:"wide"};
    state.stars=Array.from({length:90},()=>({x:rand(0,W),y:rand(0,H),size:rand(1,3),speed:rand(.7,3.5)}));
    applyStageIdentity();
    updateHud(); hideMessage(); playBGM(); log("reset",{difficulty:settings.difficulty,area:state.areaName});
  }

  function applyStageIdentity(){
    const a=areaForStage(state.stage);
    state.areaName=a.name;
    state.hazards=[];
    if(a.walls){
      state.hazards.push({type:"wall",x:48,y:0,w:40,h:H},{type:"wall",x:W-88,y:0,w:40,h:H});
      for(let i=0;i<6;i++){
        state.hazards.push({type:"pillar",x:(i%2===0?74:W-114), y:-220*i, w:18, h:120, vy:2.1});
      }
    }
  }


  function updateBossHud(){
    const target = state.boss || state.midboss;
    if(!target){
      if(ui.bossHud) ui.bossHud.classList.add("hidden");
      return;
    }
    if(ui.bossHud) ui.bossHud.classList.remove("hidden");
    const styleName = target.style || areaForStage(state.stage).name;
    let name = target.type === "midboss" ? `${bossThemeName()} MK-II` : bossThemeName();
    let color = styleName==="WIND"?"linear-gradient(90deg,#5ecbff,#a5f3fc)":(styleName==="CANYON"?"linear-gradient(90deg,#ff9b3d,#ffd6ad)":(styleName==="NIGHT"?"linear-gradient(90deg,#b988ff,#efe0ff)":"linear-gradient(90deg,#5ecbff,#a78bfa)"));
    let phase = target.phase ? `${t("phase","PHASE")} ${target.phase}${target.phaseGuard>0?` / ${t("guard","GUARD")}`:""}` : (target.phaseGuard>0?`${t("midboss","MIDBOSS")} / ${t("guard","GUARD")}`:t("midboss","MIDBOSS"));
    safeSet(ui.bossName, name);
    safeSet(ui.bossPhase, phase);
    ui.bossBar.style.width = `${Math.max(0, Math.min(100, (target.hp / target.maxHp) * 100))}%`;
    ui.bossBar.style.background = color;
  }

  function safeSet(el, txt){ if(el) el.textContent = txt; }
  function updateHud(){
    safeSet(ui.score, Math.floor(state.score)); safeSet(ui.hiscore, Math.floor(state.hiScore)); safeSet(ui.stage, state.stage); safeSet(ui.area, t((state.areaName||"normal").toLowerCase(), state.areaName));
    safeSet(ui.lives, state.player?state.player.lives:0); safeSet(ui.power, state.player?state.player.power:0); safeSet(ui.bombs, state.player?state.player.bombs:0);
    safeSet(ui.weapon, state.player?weaponName():"-"); safeSet(ui.options, state.player?state.player.options:0); safeSet(ui.shield, state.player?state.player.shield:0);
    safeSet(ui.multiplier, state.multiplier.toFixed(1)); safeSet(ui.graze, state.graze); safeSet(ui.overdriveText, state.overdriveTimer>0?`${t("on","ON")} ${Math.ceil(state.overdriveTimer/60)}`:(state.overdriveCooldown>0?`${t("cd","CD")} ${Math.ceil(state.overdriveCooldown/60)}`:t("ready","READY")));
    safeSet(ui.difficultyView, `DIFF ${settings.difficulty}`); safeSet(ui.comboView, `${t("combo","COMBO")} ${state.combo}`); safeSet(ui.riskView, `${t("risk","RISK")} x${state.multiplier.toFixed(1)}`); safeSet(ui.formationView, `${t("formation","FORM")} ${state.player ? t(state.player.formation==="focus"?"form_focus":"form_wide", state.player.formation.toUpperCase()) : t("form_wide","WIDE")}`);
    updateBossHud();
  }

  function calcRank(score) {
    if (score >= 200000) return "S";
    if (score >= 120000) return "A";
    if (score >= 60000) return "B";
    return "C";
  }

  function buildResultText(reason = "GAME OVER") {
    const rank = calcRank(Math.floor(state.score));
    return [
      "Vertical Shooter S-Rank v6.5.0",
      reason,
      `SCORE: ${Math.floor(state.score)}`,
      `HI SCORE: ${Math.floor(state.hiScore)}`,
      `STAGE: ${state.stage}`,
      `DIFFICULTY: ${settings.difficulty}`,
      `COMBO: ${state.combo}`,
      `GRAZE: ${state.graze}`,
      `RANK: ${rank}`
    ].join("\n");
  }

  function showResult(reason = "GAME OVER") {

  safeSet(ui.overlayBullet1, "");
  safeSet(ui.overlayBullet2, "");
  safeSet(ui.overlayBullet3, "");
    const resultText = buildResultText(reason);
    state.lastResult = resultText;

    if (ui.overlay) {
      ui.overlay.classList.remove("hidden");
      ui.overlay.classList.add("show");
      ui.overlay.style.pointerEvents = "auto";
    }

    safeSet(ui.overlayTitle, reason);
    const score = Math.floor(state.score);
const rank = calcRank(score);

let rankColor = "#6cf";
let rankShadow = "none";

if (rank === "S") {
  rankColor = "gold";
  rankShadow = "0 0 12px gold";
}

ui.overlayText.innerHTML = `
<div style="text-align:center; font-family:sans-serif">

  <div style="font-size:32px; font-weight:bold; color:${rankColor}; text-shadow:${rankShadow}; margin-bottom:10px;">
    RANK ${rank}
  </div>

  <div style="font-size:20px; margin-bottom:6px;">
    SCORE ${score}
  </div>

  <div style="opacity:0.8; font-size:14px;">
    STAGE ${state.stage} / DIFF ${settings.difficulty}
  </div>

  <div style="margin-top:8px; font-size:12px; opacity:0.7;">
    COMBO ${state.combo} / GRAZE ${state.graze}
  </div>

</div>
`;

    if (ui.startBtn) {
      ui.startBtn.textContent = t("retry", "RETRY");
    }

    let copyBtn = document.getElementById("copyResultBtn");
    if (!copyBtn && ui.startBtn && ui.startBtn.parentElement) {
      copyBtn = document.createElement("button");
      copyBtn.id = "copyResultBtn";
      copyBtn.type = "button";
      copyBtn.textContent = "COPY RESULT";
      copyBtn.style.marginLeft = "8px";
      ui.startBtn.parentElement.appendChild(copyBtn);

      copyBtn.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        try {
          await navigator.clipboard.writeText(state.lastResult || buildResultText(reason));
          showMessage("RESULT COPIED", 60);
        } catch (e) {
          console.warn(e);
          showMessage("COPY FAILED", 60);
        }
      });
    }
  }

  function updateDebug(){
    safeSet(ui.debugStats, `stage=${state.stage}\n`+
      `area=${state.areaName}\n`+
      `stageTimer=${state.stageTimer}\n`+
      `enemies=${state.enemies.length}\n`+
      `enemyBullets=${state.enemyBullets.length}/${state.enemyBulletCap}\n`+
      `items=${state.items.length}\n`+
      `hazards=${state.hazards.length}\n`+
      `beams=${state.beams.length}\n`+
      `combo=${state.combo}\n`+
      `multiplier=${state.multiplier.toFixed(2)}\n`+
      `graze=${state.graze}\n`+
      `warning=${state.warningTimer}\n`+
      `clear=${state.clearTimer}\n`+
      `midboss=${!!state.midboss}\n`+
      `boss=${!!state.boss}\n`+
      `difficulty=${settings.difficulty}`);
  }

  function showMessage(t,d=90){safeSet(ui.message, t); ui.message.classList.add("show"); state.messageTimer=d;}
  function hideMessage(){ui.message.classList.remove("show"); state.messageTimer=0;}
  function flashWarning(){ui.warningFlash.classList.remove("show"); void ui.warningFlash.offsetWidth; ui.warningFlash.classList.add("show");}
  function flashDamage(){ui.damageFlash.classList.remove("show"); void ui.damageFlash.offsetWidth; ui.damageFlash.classList.add("show");}

  function addScore(v, x=null, y=null){
    let risk=1.0;
    if(state.player && x!==null && y!==null){
      const d=Math.hypot(state.player.x-x, state.player.y-y);
      risk = d < 70 ? 1.6 : d < 120 ? 1.25 : 1.0;
    }
    state.noMissTimer += 1;
    state.multiplier = clamp(1 + Math.min(1.5, state.noMissTimer / 1800) + Math.min(1.2, state.combo * 0.03), 1, 3.7);
    const total = Math.round(v * diffCfg().score * risk * state.multiplier * (state.overdriveTimer>0?1.35:1));
    state.score += total;
    if(state.score > state.hiScore){state.hiScore = state.score; localStorage.setItem(HI_KEY,String(Math.floor(state.hiScore)));}
    updateHud();
  }

  function addCombo(){state.combo++; state.comboTimer=180; state.multiplier=clamp(state.multiplier+0.03,1,3.7);}
  function resetCombo(){state.combo=0; state.comboTimer=0; state.multiplier=Math.max(1, 1 + Math.min(1.5, state.noMissTimer / 1800));}

  function addGraze(x, y){
    state.graze++;
    state.score += 8;
    state.comboTimer = Math.max(state.comboTimer, 90);
    spawnEffect(x, y, "graze", 4, "#fde68a", 2);
  }

  function autoCollectActive(){
    return state.player && state.player.y < H * 0.32;
  }


  function spawnEffect(x,y,type="spark",count=10,color="#ffffff",size=3){
    for(let i=0;i<count;i++) state.effects.push({x,y,vx:rand(-3,3),vy:rand(-3,3),life:rand(18,36),maxLife:36,type,color,size});
  }
  function spawnItem(x,y,kind){state.items.push({x,y,kind,radius:10,vy:1.6,phase:rand(0,Math.PI*2)});}
  function startOverdrive(){
    if(state.overdriveCooldown > 0 || state.overdriveTimer > 0) return;
    state.overdriveTimer = 220;
    state.overdriveCooldown = 1500;
    state.player.shield = clamp(state.player.shield + 1, 0, 2);
    showMessage(t("overdrive","OVERDRIVE"), 70); sfx.overdrive(); updateHud(); log("overdrive",{cooldown:state.overdriveCooldown});
  }

  function pushEnemyBullet(x,y,vx,vy,kind="pink",radius=5){
    if(state.enemyBullets.length >= state.enemyBulletCap) return;
    const styles={pink:{c:"#ff4d8d",g:"#ffd0e2",r:radius},orange:{c:"#ff9b3d",g:"#ffe0b8",r:radius+.5},blue:{c:"#5ecbff",g:"#d3f2ff",r:radius+.5},purple:{c:"#b988ff",g:"#eee0ff",r:radius},green:{c:"#5fe68f",g:"#dbffe7",r:radius}};
    const s=styles[kind]||styles.pink; state.enemyBullets.push({x,y,vx,vy,radius:s.r,color:s.c,glow:s.g});
  }
  function enemyFire(enemy,mode="single",kind="pink"){
    const p=state.player; if(!p) return;
    if(enemy.y > p.y - 70) return;
    const cfg=diffCfg(); const dx=p.x-enemy.x, dy=p.y-enemy.y, len=Math.hypot(dx,dy)||1;
    const speed=2.0*cfg.bulletSpeed + (state.stage-1)*0.08;
    const bx=enemy.x, by=enemy.y+10;
    if(mode==="single"){pushEnemyBullet(bx,by,dx/len*speed,dy/len*speed,kind,5.5);}
    else if(mode==="arc2"){for(const s of [-0.20,0.20]) pushEnemyBullet(bx,by,dx/len*speed+s,dy/len*speed,kind,5.1);}
    else if(mode==="fan3"){for(const s of [-0.42,0,0.42]) pushEnemyBullet(bx,by,dx/len*speed+s,dy/len*speed,kind,5.0);}
    else if(mode==="down1"){pushEnemyBullet(bx,by,0,2.2*cfg.bulletSpeed,kind,5.5);}
    else if(mode==="ring6"){for(let i=0;i<6;i++){const a=(Math.PI*2*i)/6 + state.frame*0.015; pushEnemyBullet(bx,by,Math.cos(a)*(1.8*cfg.bulletSpeed),Math.sin(a)*(1.8*cfg.bulletSpeed),kind,5.0);}}
    else if(mode==="burstDelay"){
      state.effects.push({x:bx,y:by,marker:true,life:50,maxLife:50,emitDelay:true,kind});
      state.beams.push({type:"delayedBurst",x:bx,y:by,timer:50,kind});
    }
  }

  function spawnEnemy(type,x,y,extra={}){
    const cfg=diffCfg();
    const base={
      drone:{vx:0,vy:1.6,hp:2,r:14,cool:125,score:100},
      sweeper:{vx:2.1,vy:0.3,hp:3,r:15,cool:150,score:140},
      turret:{vx:0.3,vy:1.15,hp:4,r:16,cool:165,score:160},
      zigzag:{vx:1.8,vy:1.35,hp:3,r:15,cool:145,score:155},
      carrier:{vx:0,vy:1.15,hp:5,r:18,cool:999,score:240},
      chaser:{vx:0,vy:1.65,hp:3,r:15,cool:138,score:165},
      buffer:{vx:0,vy:1.2,hp:4,r:17,cool:190,score:220},
      shield:{vx:0,vy:1.3,hp:5,r:18,cool:160,score:210,shieldFront:true},
      splitter:{vx:0,vy:1.5,hp:3,r:15,cool:150,score:170},
      sniper:{vx:0,vy:1.0,hp:3,r:16,cool:210,score:190},
      mine:{vx:0,vy:0.9,hp:2,r:13,cool:999,score:120},
      boomerang:{vx:2.3,vy:1.0,hp:3,r:15,cool:150,score:175},
      turret2:{vx:0,vy:1.0,hp:5,r:18,cool:185,score:210},
      dash:{vx:0,vy:1.2,hp:3,r:14,cool:160,score:165},
      orbiter:{vx:0,vy:1.1,hp:4,r:16,cool:160,score:190},
      healer:{vx:0,vy:1.0,hp:4,r:17,cool:210,score:205},
      bomber:{vx:0,vy:1.2,hp:4,r:17,cool:190,score:210},
      lancer:{vx:0,vy:1.45,hp:4,r:16,cool:170,score:195}
    }[type];
    return {type,x,y,vx:base.vx,vy:base.vy,hp:Math.max(1,Math.round(base.hp*cfg.enemyHp)),maxHp:Math.max(1,Math.round(base.hp*cfg.enemyHp)),radius:base.r,cooldown:Math.round(base.cool*cfg.cool),score:base.score,age:0,shieldFront:!!base.shieldFront,buffAura: type==="buffer", guaranteed:type==="carrier", ...extra};
  }

  function wavePlan(stage){
    const bias=(stage-1)*20;
    return [
      {t:20, type:"msg", text:`STAGE ${stage}`},
      {t:42+bias, type:"carrier"},
      {t:82+bias, type:"droneRow"},
      {t:145+bias, type:"sniperPair"},
      {t:198+bias, type:"rolePair"},
      {t:258+bias, type:"mineRow"},
      {t:312+bias, type:"sweeperSide", left:true},
      {t:382+bias, type:"zigzag"},
      {t:448+bias, type:"boomerangPair"},
      {t:516+bias, type:"turretRow"},
      {t:584+bias, type:"orbiterPack"},
      {t:648+bias, type:"supportWave"},
      {t:722+bias, type:"dashColumn"},
      {t:790+bias, type:"bomberWave"},
      {t:862+bias, type:"lancerWave"},
      {t:930+bias, type:"warning", text:"MIDBOSS"},
      {t:1000+bias, type:"midboss"},
      {t:1320+bias, type:"hazard"},
      {t:1430+bias, type:"warning", text:"BOSS"},
      {t:1510+bias, type:"boss"}
    ];
  }

  function executeWave(w){
    switch(w.type){
      case "msg": showMessage(w.text,80); break;
      case "carrier": state.enemies.push(spawnEnemy("carrier",W/2,-30)); break;
      case "droneRow": for(let i=0;i<5;i++) state.enemies.push(spawnEnemy("drone",60+i*90,-30-i*16)); break;
      case "rolePair":
        state.enemies.push(spawnEnemy("buffer",W/2-70,-40));
        state.enemies.push(spawnEnemy("chaser",W/2+70,-90));
        state.enemies.push(spawnEnemy("shield",W/2,-140));
        break;
      case "sniperPair":
        state.enemies.push(spawnEnemy("sniper",110,-40));
        state.enemies.push(spawnEnemy("sniper",W-110,-90));
        break;
      case "mineRow":
        for(let i=0;i<5;i++) state.enemies.push(spawnEnemy("mine",70+i*85,-40-i*18));
        break;
      case "sweeperSide": for(let i=0;i<4;i++) state.enemies.push(spawnEnemy("sweeper",w.left?-25-i*26:W+25+i*26,100+i*40,{vx:w.left?2.1:-2.1})); break;
      case "zigzag":
        state.enemies.push(spawnEnemy("zigzag",80,-40,{vx:1.8}));
        state.enemies.push(spawnEnemy("zigzag",W-80,-90,{vx:-1.8}));
        state.enemies.push(spawnEnemy("splitter",W/2,-140));
        break;
      case "boomerangPair":
        state.enemies.push(spawnEnemy("boomerang",70,-40,{vx:2.6}));
        state.enemies.push(spawnEnemy("boomerang",W-70,-80,{vx:-2.6}));
        break;
      case "turretRow": for(let i=0;i<6;i++) state.enemies.push(spawnEnemy(i%2===0?"turret":"turret2",40+i*80,-40-i*15,{vx:i%2?-0.28:0.28})); break;
      case "orbiterPack":
        state.enemies.push(spawnEnemy("orbiter",W/2,-40));
        state.enemies.push(spawnEnemy("orbiter",W/2-90,-90));
        state.enemies.push(spawnEnemy("orbiter",W/2+90,-140));
        break;
      case "supportWave":
        state.enemies.push(spawnEnemy("healer",W/2,-40));
        state.enemies.push(spawnEnemy("buffer",W/2-90,-90));
        state.enemies.push(spawnEnemy("shield",W/2+90,-130));
        break;
      case "dashColumn":
        for(let i=0;i<4;i++) state.enemies.push(spawnEnemy("dash",W/2 + (i%2===0?-60:60),-40-i*70));
        break;
      case "bomberWave":
        for(let i=0;i<3;i++) state.enemies.push(spawnEnemy("bomber",120+i*120,-60-i*45));
        break;
      case "lancerWave":
        for(let i=0;i<4;i++) state.enemies.push(spawnEnemy("lancer",80+i*100,-50-i*35));
        break;
      case "warning": state.warningTimer=90; showMessage(w.text,90); flashWarning(); sfx.warning(); break;
      case "midboss": {
        const hp=Math.round((120+(state.stage-1)*22)*diffCfg().bossHp);
        const area=areaForStage(state.stage).name;
        state.midboss={type:"midboss",style:area,x:W/2,y:-90,targetY:110,vx:1.5,hp,maxHp:hp,radius:42,cooldown:Math.round(115*diffCfg().cool),score:1800,armor:0.52,phaseGuard:0};
        break;
      }
      case "hazard":
        const area=areaForStage(state.stage);
        if(area.name==="CANYON"){
          state.hazards.push({type:"gate",x:0,y:-20,vy:1.8,gapX:W/2,gapW:110,life:400});
          showMessage("LASER GATE",70);
        }else if(area.name==="WIND"){
          showMessage("HEADWIND",60);
        }else if(area.name==="NIGHT"){
          showMessage("BLACKOUT",60);
        }else{
          state.hazards.push({type:"gate",x:0,y:-20,vy:1.8,gapX:rand(130,W-130),gapW:120,life:360});
        }
        break;
      case "boss": {
        const hp=Math.round((430+(state.stage-1)*65)*diffCfg().bossHp);
        const area=areaForStage(state.stage).name;
        state.boss={type:"boss",style:area,x:W/2,y:-120,targetY:120,vx:1.35,dir:1,hp,maxHp:hp,radius:58,cooldown:Math.round(68*diffCfg().cool),phase:1,lastPhase:1,score:6000,beamAngle:0,armor:0.34,phaseGuard:0};
        break;
      }
    }
    log("wave",{type:w.type,stage:state.stage,t:state.stageTimer});
  }

  function playerFire(){
    const p=state.player; if(!p || p.shotCooldown>0) return;
    p.shotCooldown = state.overdriveTimer>0 ? Math.max(2,7-p.power) : (settings.autofire ? Math.max(4,10-p.power) : Math.max(5,11-p.power));
    const shots=[], wep=p.weaponIndex, dmgBoost=state.overdriveTimer>0?1:0;
    if(wep===0){
      shots.push({x:p.x,y:p.y-20,vx:0,vy:-9.2,r:4,damage:1+Math.floor(p.power/2)+dmgBoost,color:"#7dd3fc",mode:"normal"});
      shots.push({x:p.x-11,y:p.y-10,vx:-0.28,vy:-8.8,r:4,damage:1+dmgBoost,color:"#7dd3fc",mode:"normal"});
      shots.push({x:p.x+11,y:p.y-10,vx:0.28,vy:-8.8,r:4,damage:1+dmgBoost,color:"#7dd3fc",mode:"normal"});
      if(p.power>=4 || state.overdriveTimer>0){
        shots.push({x:p.x-22,y:p.y-2,vx:-0.65,vy:-8.4,r:4,damage:1,color:"#a5f3fc",mode:"normal"});
        shots.push({x:p.x+22,y:p.y-2,vx:0.65,vy:-8.4,r:4,damage:1,color:"#a5f3fc",mode:"normal"});
      }
      sfx.shot();
    } else if(wep===1){
      shots.push({x:p.x,y:p.y-24,vx:0,vy:-13.0,r:3,damage:3.2+Math.floor(p.power/2)+dmgBoost,color:"#ddd6fe",mode:"laser",life:56,pierce:3});
      shots.push({x:p.x-7,y:p.y-18,vx:0,vy:-12.7,r:3,damage:2.0+dmgBoost,color:"#c4b5fd",mode:"laser",life:50,pierce:2});
      shots.push({x:p.x+7,y:p.y-18,vx:0,vy:-12.7,r:3,damage:2.0+dmgBoost,color:"#c4b5fd",mode:"laser",life:50,pierce:2});
      sfx.laser();
    } else {
      shots.push({x:p.x,y:p.y-18,vx:0,vy:-6.8,r:4,damage:1+Math.floor(p.power/2)+dmgBoost,color:"#86efac",mode:"homing",target:null,turn:0.12});
      shots.push({x:p.x-10,y:p.y-12,vx:-0.3,vy:-6.5,r:4,damage:1+dmgBoost,color:"#86efac",mode:"homing",target:null,turn:0.11});
      shots.push({x:p.x+10,y:p.y-12,vx:0.3,vy:-6.5,r:4,damage:1+dmgBoost,color:"#86efac",mode:"homing",target:null,turn:0.11});
      sfx.homing();
    }
    for(let i=0;i<p.options;i++){
      const side=i%2===0?-1:1, row=i<2?0:1;
      const spreadBase = p.formation==="focus" ? 14 : 26;
      const rowOffset = p.formation==="focus" ? 4 : 10;
      const oyBase = p.formation==="focus" ? 14 : 6;
      const ox=p.x+side*(spreadBase+row*rowOffset), oy=p.y+(row===0?oyBase:oyBase+18);
      if(wep===0) shots.push({x:ox,y:oy,vx:side*0.18,vy:-8.5,r:3,damage:1,color:"#c4b5fd",mode:"normal"});
      else if(wep===1) shots.push({x:ox,y:oy,vx:0,vy:-12.0,r:2.5,damage:1.3,color:"#e9d5ff",mode:"laser",life:40,pierce:1});
      else shots.push({x:ox,y:oy,vx:side*0.2,vy:-6.2,r:3,damage:1,color:"#bbf7d0",mode:"homing",target:null,turn:0.1});
    }
    state.bullets.push(...shots);
  }

  function nearestEnemy(x,y){
    let best=null, bd=Infinity; const arr=[...state.enemies]; if(state.midboss) arr.push(state.midboss); if(state.boss) arr.push(state.boss);
    for(const e of arr){const d=Math.hypot(e.x-x,e.y-y); if(d<bd){bd=d; best=e;}}
    return best;
  }

  function damagePlayer(){
    const p=state.player; if(!p || p.invuln>0) return;
    if(p.shield>0){p.shield--; p.invuln=60; state.shake=6; spawnEffect(p.x,p.y,"shield",26,"#60a5fa",3); sfx.shield(); updateHud(); return;}
    p.lives--; p.invuln=140; p.power=Math.max(1,p.power-1); p.options=Math.max(0,p.options-1);
    state.noMissTimer=0; resetCombo(); flashDamage(); spawnEffect(p.x,p.y,"player",34,"#67e8f9",3); state.shake=12; state.hitstop=5; sfx.damage(); updateHud();
    if(p.lives<0){
      state.running=false;
      state.gameOver=true;
      pauseBGM();
      showResult(t("game_over","GAME OVER"));
    }
    else{p.x=W/2; p.y=H-90;}
  }

  function destroyEnemy(e){
    addScore(e.score||100, e.x, e.y); addCombo(); spawnEffect(e.x,e.y,"enemy",18,"#fb7185",3); state.shake=Math.max(state.shake,7); state.hitstop=Math.max(state.hitstop,2); sfx.explosion();
    const r=Math.random(), itemRate=diffCfg().item;
    if(e.type==="carrier"){spawnItem(e.x,e.y, state.stage===1 ? "power" : (Math.random()<0.55?"power":"overdrive"));}
    else if(e.type==="bomber" && Math.random() < 0.35){ spawnItem(e.x,e.y,"bomb"); }
    else if(e.type==="healer" && Math.random() < 0.30){ spawnItem(e.x,e.y,"shield"); }
    else if(e.type==="splitter"){
      for(let i=0;i<2;i++) state.enemies.push(spawnEnemy("drone", e.x + (i===0?-18:18), e.y, {vx:i===0?-0.8:0.8, vy:1.8, hp:1, maxHp:1, score:80}));
    } else if(e.type!=="boss" && e.type!=="midboss"){
      if(r < 0.16*itemRate) spawnItem(e.x,e.y,"power");
      else if(r < 0.26*itemRate) spawnItem(e.x,e.y,"option");
      else if(r < 0.34*itemRate) spawnItem(e.x,e.y,"shield");
      else if(r < 0.39*itemRate) spawnItem(e.x,e.y,"bomb");
    }
  }

  function hitEnemy(t,dmg,bx=null,by=null,mode="normal"){
    let real=dmg + (state.overdriveTimer>0?0.15:0);
    if(t.shieldFront && bx!==null && bx > t.x) real *= 0.15;
    if(t.type==="boss" || t.type==="midboss"){
      if(mode==="laser") real *= 0.24;
      else if(mode==="homing") real *= 0.62;
      else real *= 0.82;
      if(state.overdriveTimer>0) real *= 0.72;
      if(t.armor) real *= t.armor;
      if(t.phaseGuard && t.phaseGuard>0) real *= 0.04;
    }
    t.hp -= real; spawnEffect(t.x,t.y,"hit",6,"#ffffff",3); state.hitstop=Math.max(state.hitstop,1); sfx.hit();
    if(t.hp<=0) destroyEnemy(t);
  }

  function clearStage(){
    state.clearTimer=180; state.enemyBullets=[]; state.enemies=[]; state.midboss=null; state.boss=null; state.beams=[]; showMessage(t("stage_clear","STAGE CLEAR"),120);
    state.player.bombs=clamp(state.player.bombs+1,0,9); state.player.shield=clamp(state.player.shield+1,0,2); updateHud();
  }

  function update(){
    if(!state.running || state.paused) return;
    if(state.hitstop>0){state.hitstop--; return;}
    state.frame++; state.stageTimer++;
    state.enemyBulletCap = diffCfg().bulletCap + Math.min(8, state.stage-1);
    if(state.warningTimer>0) state.warningTimer--;
    if(state.overdriveTimer>0) state.overdriveTimer--;
    if(state.overdriveCooldown>0) state.overdriveCooldown--;
    if(state.comboTimer>0){state.comboTimer--; if(state.comboTimer<=0) resetCombo();}
    state.noMissTimer++;
    if(state.messageTimer>0){state.messageTimer--; if(state.messageTimer<=0) hideMessage();}
    if(state.shake>0) state.shake*=0.86;
    if(state.clearTimer>0){state.clearTimer--; if(state.clearTimer===0){state.stage++; state.stageTimer=0; state.spawnCursor=0; applyStageIdentity(); showMessage(`STAGE ${state.stage}`,90); updateHud();}}

    const area=areaForStage(state.stage);
    const wind = area.wind ? Math.sin(state.frame*0.015) * area.wind : 0;

    for(const s of state.stars){s.y+=s.speed; if(s.y>H){s.y=-5; s.x=rand(0,W);}}
    const p=state.player;
    if(p){
      let mx=0,my=0;
      if(keys.has("ArrowLeft")||keys.has("a")||keys.has("A")) mx-=1;
      if(keys.has("ArrowRight")||keys.has("d")||keys.has("D")) mx+=1;
      if(keys.has("ArrowUp")||keys.has("w")||keys.has("W")) my-=1;
      if(keys.has("ArrowDown")||keys.has("s")||keys.has("S")) my+=1;
      const slow=keys.has("Shift"), spd=slow?p.speed*0.55:p.speed, len=Math.hypot(mx,my)||1;
      p.x += (mx/len)*spd + wind*0.18; p.y += (my/len)*spd;
      p.x=clamp(p.x,22,W-22); p.y=clamp(p.y,40,H-28);
      if(area.walls){
        for(const h of state.hazards.filter(h=>h.type==="wall")){
          if(p.x > h.x-10 && p.x < h.x+h.w+10){ if(p.x < W/2) p.x = h.x+h.w+10; else p.x = h.x-10; }
        }
      }
      if(p.invuln>0) p.invuln--; if(p.shotCooldown>0) p.shotCooldown--;
      const manual = keys.has("z")||keys.has("Z")||keys.has(" ")||keys.has("Enter");
      if(settings.autofire || manual) playerFire();
    }

    if(state.warningTimer<=0 && state.clearTimer<=0 && !state.midboss && !state.boss){
      const plan=wavePlan(state.stage);
      while(state.spawnCursor < plan.length && state.stageTimer >= plan[state.spawnCursor].t){
        executeWave(plan[state.spawnCursor]); state.spawnCursor++;
      }
    }

    for(const b of state.bullets){
      if(b.mode==="homing"){
        if(!b.target || b.target.hp<=0) b.target=nearestEnemy(b.x,b.y);
        if(b.target){
          const dx=b.target.x-b.x, dy=b.target.y-b.y, len=Math.hypot(dx,dy)||1;
          const tx=dx/len*6.8, ty=dy/len*6.8;
          b.vx += (tx-b.vx)*b.turn; b.vy += (ty-b.vy)*b.turn;
        }
      }
      b.x += b.vx + wind*0.22; b.y += b.vy;
      if(b.life!==undefined) b.life--;
    }
    state.bullets = state.bullets.filter(b => b.y>-100 && b.x>-40 && b.x<W+40 && (b.life===undefined || b.life>0) && (b.pierce===undefined || b.pierce>=0));

    for(const eb of state.enemyBullets){eb.x += eb.vx + wind*0.45; eb.y += eb.vy;}
    state.enemyBullets = state.enemyBullets.filter(b=>b.y<H+40 && b.x>-60 && b.x<W+60);

    // beams and delayed burst
    for(const beam of state.beams){
      if(beam.timer !== undefined) beam.timer--;
      if(beam.type==="delayedBurst" && beam.timer===0){
        for(let i=0;i<8;i++){
          const a=(Math.PI*2*i)/8; pushEnemyBullet(beam.x,beam.y,Math.cos(a)*(1.9*diffCfg().bulletSpeed),Math.sin(a)*(1.9*diffCfg().bulletSpeed),beam.kind||"orange",5.0);
        }
      }
      if(beam.type==="warningLaser" && beam.timer===0){
        beam.active=26;
        beam.fired=true;
        log("beam-fire",{type:"warningLaser"});
        sfx.beam();
      }
      if(beam.type==="trackingBeamWarning" && beam.timer===0){
        beam.type="trackingBeam";
        beam.active=22;
        beam.fired=true;
        delete beam.timer;
        log("beam-fire",{type:"trackingBeam", angle:beam.angle});
        sfx.beam();
      }
      if(beam.active!==undefined && beam.active>0) beam.active--;
    }
    state.beams = state.beams.filter(b => (b.timer===undefined || b.timer>0) || (b.active!==undefined && b.active>0));

    for(const e of state.enemies){
      e.buff=false;
    }

    for(const e of state.enemies){
      e.age++; e.x+=e.vx + wind*0.15; e.y+=e.vy;
      if(e.type!=="carrier" && e.y > H + 20) e.hp = 0;
      e.cooldown--;
      if(e.type==="turret" || e.type==="turret2") e.x += Math.sin((state.frame+e.y)*0.025)*0.8;
      if(e.type==="zigzag") e.x += Math.sin(e.age*0.12)*1.8;
      if(e.type==="boomerang"){
        if(e.age < 45) e.x += e.vx*0.9;
        else e.x -= e.vx*0.55;
      }
      if(e.type==="dash" && e.age % 90 < 12) e.y += 3.8;
      if(e.type==="orbiter") e.x += Math.sin(e.age*0.08 + e.y*0.01) * 2.2;
      if(e.type==="lancer") e.y += Math.sin(e.age*0.06) * 0.4;
      if(e.type==="chaser" && state.player){
        e.vx += (state.player.x-e.x)*0.0028; e.vx = clamp(e.vx,-2.5,2.5);
      }
      if(e.type==="buffer"){
        for(const o of state.enemies){
          if(o!==e && Math.hypot(o.x-e.x,o.y-e.y)<110) o.buff=true;
        }
      }
      if(e.type==="healer" && e.age % 80 === 0){
        for(const o of state.enemies){
          if(o!==e && Math.hypot(o.x-e.x,o.y-e.y)<120) o.hp = Math.min(o.maxHp, o.hp + 1);
        }
      }
      if(e.cooldown<=0 && e.y>40){
        const cdMult = e.buff ? 0.75 : 1.0;
        if(e.type==="drone"){enemyFire(e, state.stage>=3?"arc2":"single","pink"); e.cooldown=Math.round(145*diffCfg().cool*cdMult);}
        else if(e.type==="sweeper"){enemyFire(e,"single","orange"); e.cooldown=Math.round(160*diffCfg().cool*cdMult);}
        else if(e.type==="turret"){enemyFire(e,"down1","blue"); e.cooldown=Math.round(178*diffCfg().cool*cdMult);}
        else if(e.type==="turret2"){enemyFire(e,"arc2","blue"); e.cooldown=Math.round(186*diffCfg().cool*cdMult);}
        else if(e.type==="zigzag"){enemyFire(e,"fan3","purple"); e.cooldown=Math.round(158*diffCfg().cool*cdMult);}
        else if(e.type==="chaser"){enemyFire(e,"single","purple"); e.cooldown=Math.round(126*diffCfg().cool*cdMult);}
        else if(e.type==="buffer"){enemyFire(e,"burstDelay","orange"); e.cooldown=Math.round(205*diffCfg().cool);}
        else if(e.type==="shield"){enemyFire(e,"single","blue"); e.cooldown=Math.round(160*diffCfg().cool*cdMult);}
        else if(e.type==="splitter"){enemyFire(e,"fan3","pink"); e.cooldown=Math.round(172*diffCfg().cool*cdMult);}
        else if(e.type==="sniper"){enemyFire(e,"single","pink"); e.cooldown=Math.round(230*diffCfg().cool*cdMult);}
        else if(e.type==="mine"){enemyFire(e,"ring6","orange"); e.hp=0; e.cooldown=999;}
        else if(e.type==="boomerang"){enemyFire(e,"arc2","purple"); e.cooldown=Math.round(150*diffCfg().cool*cdMult);}
        else if(e.type==="dash"){enemyFire(e,"single","pink"); e.cooldown=Math.round(145*diffCfg().cool*cdMult);}
        else if(e.type==="orbiter"){enemyFire(e,"ring6","blue"); e.cooldown=Math.round(200*diffCfg().cool*cdMult);}
        else if(e.type==="healer"){enemyFire(e,"single","green"); e.cooldown=Math.round(200*diffCfg().cool);}
        else if(e.type==="bomber"){enemyFire(e,"burstDelay","orange"); e.cooldown=Math.round(185*diffCfg().cool*cdMult);}
        else if(e.type==="lancer"){enemyFire(e,"arc2","pink"); e.cooldown=Math.round(150*diffCfg().cool*cdMult);}
      }
    }
    state.enemies = state.enemies.filter(e=>e.y<H+90 && e.hp>0);

    for(const h of state.hazards){
      if(h.type==="gate"){
        h.y += h.vy; h.life--;
        if(h.life%36===0 && h.y>0 && h.y<H){
          pushEnemyBullet(h.gapX-h.gapW/2-8,h.y,1.8*diffCfg().bulletSpeed,0.6,"blue",5.3);
          pushEnemyBullet(h.gapX+h.gapW/2+8,h.y,-1.8*diffCfg().bulletSpeed,0.6,"blue",5.3);
        }
      } else if(h.type==="pillar"){
        h.y += h.vy;
        if(h.y > H + 40) h.y = -h.h - rand(60, 220);
      }
    }
    state.hazards = state.hazards.filter(h => h.type==="wall" || h.type==="pillar" || (h.life>0 && h.y<H+50));

    if(state.midboss){
      const m=state.midboss;
      if(m.phaseGuard && m.phaseGuard>0) m.phaseGuard--;
      if(m.y<m.targetY) m.y+=1.3;
      else{
        m.x += m.vx + wind*0.12; if(m.x<70 || m.x>W-70) m.vx*=-1; m.cooldown--;
        if(m.cooldown<=0){
          if(m.style==="WIND"){
            enemyFire(m, "fan3", "blue");
          } else if(m.style==="CANYON"){
            enemyFire(m, "arc2", "orange");
            state.beams.push({type:"warningLaser", x1:m.x-90, y1:m.y+24, x2:m.x-90, y2:H, timer:54, active:0});
            state.beams.push({type:"warningLaser", x1:m.x+90, y1:m.y+24, x2:m.x+90, y2:H, timer:54, active:0});
          } else if(m.style==="NIGHT"){
            enemyFire(m, "single", "purple");
            state.beams.push({type:"trackingBeamWarning", cx:m.x, cy:m.y+8, angle:(state.frame*0.02)%6.28, timer:54, active:0});
          } else {
            enemyFire(m, state.stage>=3?"fan3":"arc2","orange");
            if(settings.difficulty>=5 && state.stage>=2) enemyFire(m,"single","blue");
            state.beams.push({type:"warningLaser", x1:m.x-70, y1:m.y+18, x2:m.x+70, y2:H, timer:56, active:0});
          }
          m.cooldown=Math.round(118*diffCfg().cool);
        }
      }
      if(m.hp<=0){destroyEnemy({...m,type:"midboss",score:m.score}); state.midboss=null; showMessage(t("warning_clear","WARNING CLEAR"),60);}
    }

    if(state.boss){
      const b=state.boss;
      if(b.phaseGuard && b.phaseGuard>0) b.phaseGuard--;
      if(b.y<b.targetY) b.y+=1.2;
      else{
        b.phase = b.hp < b.maxHp*0.35 ? 3 : b.hp < b.maxHp*0.72 ? 2 : 1;
        if(b.phase !== b.lastPhase){
          b.lastPhase = b.phase;
          b.phaseGuard = 120;
          b.cooldown += 24;
          showMessage(`BOSS PHASE ${b.phase}`, 45);
          spawnEffect(b.x,b.y,"phase",34,"#fde68a",4);
        }
        b.x += b.dir*(1.2+b.phase*0.12) + wind*0.08; if(b.x<72 || b.x>W-72) b.dir*=-1;
        b.cooldown--;
        if(b.cooldown<=0){
          if(b.style==="WIND"){
            if(b.phase===1){ enemyFire(b,"fan3","blue"); }
            else if(b.phase===2){ enemyFire(b,"ring6","blue"); enemyFire(b,"single","purple"); }
            else { enemyFire(b,"ring6","blue"); state.beams.push({type:"trackingBeam", cx:b.x, cy:b.y+10, angle:b.beamAngle, active:34}); b.beamAngle += 0.28; }
          } else if(b.style==="CANYON"){
            if(b.phase===1){ enemyFire(b,"arc2","orange"); }
            else if(b.phase===2){ state.beams.push({type:"warningLaser", x1:120, y1:b.y+12, x2:120, y2:H, timer:54, active:0}); state.beams.push({type:"warningLaser", x1:W-120, y1:b.y+12, x2:W-120, y2:H, timer:54, active:0}); enemyFire(b,"single","orange"); }
            else { enemyFire(b,"fan3","orange"); state.beams.push({type:"warningLaser", x1:b.x, y1:b.y+16, x2:b.x, y2:H, timer:48, active:0}); }
          } else if(b.style==="NIGHT"){
            if(b.phase===1){ enemyFire(b,"single","purple"); enemyFire({...b,x:b.x-20},"single","purple"); enemyFire({...b,x:b.x+20},"single","purple"); }
            else if(b.phase===2){ enemyFire(b,"fan3","purple"); state.beams.push({type:"trackingBeamWarning", cx:b.x, cy:b.y+8, angle:b.beamAngle, timer:56, active:0}); b.beamAngle += 0.24; }
            else { enemyFire(b,"ring6","purple"); state.beams.push({type:"trackingBeamWarning", cx:b.x, cy:b.y+8, angle:b.beamAngle, timer:60, active:0}); b.beamAngle += 0.34; }
          } else {
            if(b.phase===1){
              enemyFire(b,"single","pink");
              enemyFire({...b,x:b.x-20},"single","blue");
              enemyFire({...b,x:b.x+20},"single","blue");
            } else if(b.phase===2){
              enemyFire(b,"fan3","purple");
              enemyFire(b,"arc2","orange");
              state.beams.push({type:"warningLaser", x1:b.x, y1:b.y+12, x2:state.player.x, y2:H, timer:54, active:0}); log("beam-warn",{type:"warningLaser"});
            } else {
              enemyFire(b,"ring6","blue");
              if(settings.difficulty>=5) enemyFire(b,"single","pink");
              state.beams.push({type:"trackingBeamWarning", cx:b.x, cy:b.y+10, angle:b.beamAngle, timer:60, active:0}); b.beamAngle += 0.35;
            }
          }
          b.cooldown=Math.round((b.style==="NORMAL"?84:(b.style==="WIND"?92:(b.style==="CANYON"?86:90))) * diffCfg().cool * (b.phase===1?0.88:(b.phase===2?1.0:1.12)));
        }
      }
      if(b.hp<=0){destroyEnemy({...b,type:"boss",score:b.score}); state.boss=null; clearStage();}
    }

    for(const item of state.items){
      if(autoCollectActive()){
        const dx = state.player.x - item.x;
        const dy = state.player.y - item.y;
        const len = Math.hypot(dx, dy) || 1;
        item.x += dx / len * 3.2;
        item.y += dy / len * 3.2;
      } else {
        item.y += item.vy;
        item.x += Math.sin((state.frame*0.04)+item.phase)*0.5;
      }
    }
    state.items = state.items.filter(i=>i.y<H+40);
    for(const e of state.effects){e.x+=e.vx; e.y+=e.vy; e.life--;}
    state.effects = state.effects.filter(e=>e.life>0);

    handleCollisions();
    applyNightDarkness();
    if(state.overdriveTimer>0 && state.overdriveTimer%120===0){spawnEffect(state.player.x,state.player.y,"overdrive",22,"#fbbf24",4);}
    updateHud(); updateDebug();
  }

  function applyNightDarkness(){ /* placeholder to make render ordering simpler */ }

  function handleCollisions(){
    const p=state.player; if(!p) return;
    for(const b of state.bullets){
      for(const e of state.enemies){
        if(Math.hypot(b.x-e.x,b.y-e.y) < b.r + e.radius){
          hitEnemy(e,b.damage,b.x,b.y,b.mode);
          if(b.pierce!==undefined) b.pierce--; else b.y=-999;
          break;
        }
      }
      if(state.midboss && Math.hypot(b.x-state.midboss.x,b.y-state.midboss.y) < b.r + state.midboss.radius){hitEnemy(state.midboss,b.damage,b.x,b.y,b.mode); if(b.pierce!==undefined) b.pierce--; else b.y=-999;}
      if(state.boss && Math.hypot(b.x-state.boss.x,b.y-state.boss.y) < b.r + state.boss.radius){hitEnemy(state.boss,b.damage,b.x,b.y,b.mode); if(b.pierce!==undefined) b.pierce--; else b.y=-999;}
    }

    for(const eb of state.enemyBullets){
      const d = Math.hypot(eb.x-p.x, eb.y-p.y);
      if(d < eb.radius + p.radius){ eb.y=H+999; damagePlayer(); }
      else if(d < eb.radius + p.radius + 14 && !eb.grazed){
        eb.grazed = true;
        addGraze(eb.x, eb.y);
      }
    }
    for(const e of state.enemies){ if(Math.hypot(e.x-p.x,e.y-p.y) < e.radius + p.radius){ e.hp=0; damagePlayer(); } }

    for(const h of state.hazards){
      if(h.type==="wall" || h.type==="pillar"){
        if(p.x > h.x-6 && p.x < h.x+h.w+6 && p.y > h.y-8 && p.y < h.y+h.h+8) damagePlayer();
      }else if(h.type==="gate"){
        if(p.y > h.y-10 && p.y < h.y+10){
          const left=h.gapX-h.gapW/2, right=h.gapX+h.gapW/2;
          if(p.x<left || p.x>right) damagePlayer();
        }
      }
    }

    for(const beam of state.beams){
      if(beam.type==="trackingBeam" && beam.active>0){
        const ex=Math.cos(beam.angle), ey=Math.sin(beam.angle);
        const dx=p.x-beam.cx, dy=p.y-beam.cy;
        const dist=Math.abs(dx*ey - dy*ex);
        const along=dx*ex + dy*ey;
        if(dist < 10 && along > 0 && along < 700) damagePlayer();
      } else if(beam.type==="warningLaser" && beam.active>0){
        // distance from point to segment
        const x1=beam.x1,y1=beam.y1,x2=beam.x2,y2=beam.y2;
        const A=p.x-x1,B=p.y-y1,C=x2-x1,D=y2-y1;
        const dot=A*C+B*D, lenSq=C*C+D*D, param=lenSq?dot/lenSq:-1;
        let xx,yy;
        if(param<0){xx=x1;yy=y1;} else if(param>1){xx=x2;yy=y2;} else {xx=x1+param*C;yy=y1+param*D;}
        const dist=Math.hypot(p.x-xx,p.y-yy);
        if(dist < 7) damagePlayer();
      }
    }

    for(const item of state.items){ if(Math.hypot(item.x-p.x,item.y-p.y) < item.radius + p.radius + 4){ item.y=H+999;
      if(item.kind==="power") p.power=clamp(p.power+1,1,7);
      else if(item.kind==="option") p.options=clamp(p.options+1,0,4);
      else if(item.kind==="shield") p.shield=clamp(p.shield+1,0,2);
      else if(item.kind==="bomb") p.bombs=clamp(p.bombs+1,0,9);
      else if(item.kind==="life") p.lives=clamp(p.lives+1,0,9);
      else if(item.kind==="overdrive") startOverdrive();
      sfx.pickup();
    }}
  }

  function drawBackground(){
    const area=areaForStage(state.stage);
    ctx.clearRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,0,0,H);
    if(area.name==="WIND"){ g.addColorStop(0,"#02101c"); g.addColorStop(.5,"#10314d"); g.addColorStop(1,"#04111c"); }
    else if(area.name==="CANYON"){ g.addColorStop(0,"#120b09"); g.addColorStop(.5,"#3a2117"); g.addColorStop(1,"#140b09"); }
    else if(area.name==="NIGHT"){ g.addColorStop(0,"#03030a"); g.addColorStop(.5,"#0d1123"); g.addColorStop(1,"#020208"); }
    else { g.addColorStop(0,"#020617"); g.addColorStop(.5,"#081528"); g.addColorStop(1,"#020617"); }
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);

    if(area.name==="WIND"){
      for(let i=0;i<7;i++){
        const y=((state.frame*3)+i*130)%H;
        ctx.fillStyle="rgba(255,255,255,0.04)";
        ctx.beginPath(); ctx.moveTo(0,y); ctx.bezierCurveTo(120,y-20,260,y+30,W,y-10); ctx.lineTo(W,y+8); ctx.bezierCurveTo(260,y+50,120,y,0,y+18); ctx.closePath(); ctx.fill();
      }
    } else if(area.name==="CANYON"){
      ctx.fillStyle="rgba(90,50,33,0.40)";
      for(let i=0;i<6;i++){
        const y=(i*150 + (state.frame*2)%150) - 150;
        ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(72,y+30); ctx.lineTo(60,y+120); ctx.lineTo(0,y+140); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(W,y); ctx.lineTo(W-72,y+30); ctx.lineTo(W-60,y+120); ctx.lineTo(W,y+140); ctx.closePath(); ctx.fill();
      }
    } else if(area.name==="NIGHT"){
      ctx.fillStyle="rgba(255,255,180,0.03)";
      for(let i=0;i<16;i++){ ctx.beginPath(); ctx.arc((i*31)%W, (i*67 + state.frame*0.3)%H, 1.2, 0, Math.PI*2); ctx.fill(); }
      for(let i=0;i<5;i++){ const y=(i*170 + (state.frame*1.2)%170)-170; ctx.fillStyle="rgba(120,90,180,0.05)"; ctx.fillRect(30 + (i%2)*250, y, 80, 220); }
    }

    for(const s of state.stars){ctx.fillStyle=`rgba(255,255,255,${Math.min(1,s.size/3)})`; ctx.fillRect(s.x,s.y,s.size,s.size*2.2);}
    ctx.strokeStyle="rgba(56,189,248,0.08)";
    for(let y=(state.frame*2)%44;y<H;y+=44){ctx.beginPath(); ctx.moveTo(84,y); ctx.lineTo(102,y+22); ctx.lineTo(378,y+22); ctx.lineTo(396,y); ctx.stroke();}
    if(area.name==="WIND"){ ctx.fillStyle="rgba(125,211,252,0.08)"; for(let i=0;i<6;i++){const y=((state.frame*6)+i*120)%H; ctx.fillRect(0,y,W,2);} }
    if(area.name==="NIGHT"){ ctx.fillStyle="rgba(0,0,0,0.45)"; ctx.fillRect(0,0,W,H); if(state.player){ const r=130; const grad=ctx.createRadialGradient(state.player.x,state.player.y,10,state.player.x,state.player.y,r); grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,0.78)"); ctx.save(); ctx.globalCompositeOperation="destination-out"; ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(state.player.x,state.player.y,r,0,Math.PI*2); ctx.fill(); ctx.restore(); } }
  }

  function drawHazards(){
    for(const h of state.hazards){
      if(h.type==="wall"){
        ctx.fillStyle="rgba(99,102,241,0.24)"; ctx.fillRect(h.x,h.y,h.w,h.h);
        ctx.strokeStyle="rgba(165,180,252,0.75)"; ctx.strokeRect(h.x,h.y,h.w,h.h);
      }
      else if(h.type==="pillar"){
        ctx.fillStyle="rgba(120,72,52,0.55)"; ctx.fillRect(h.x,h.y,h.w,h.h);
        ctx.fillStyle="rgba(255,220,180,0.18)"; ctx.fillRect(h.x+3,h.y+6,h.w-6,10);
      }
      else if(h.type==="gate"){
        const left=h.gapX-h.gapW/2,right=h.gapX+h.gapW/2;
        ctx.fillStyle="rgba(59,130,246,0.35)"; ctx.fillRect(0,h.y-6,left,12); ctx.fillRect(right,h.y-6,W-right,12);
        ctx.strokeStyle="rgba(147,197,253,0.9)"; ctx.strokeRect(0,h.y-6,left,12); ctx.strokeRect(right,h.y-6,W-right,12);
      }
    }
    for(const beam of state.beams){
      if(beam.type==="warningLaser"){
        if(beam.active>0){
          ctx.strokeStyle="rgba(255,90,90,0.98)"; ctx.lineWidth=8;
        } else {
          const blink = (beam.timer % 12) < 6;
          ctx.strokeStyle=blink?"rgba(255,240,140,0.95)":"rgba(255,255,255,0.65)";
          ctx.lineWidth=4;
        }
        ctx.beginPath(); ctx.moveTo(beam.x1,beam.y1); ctx.lineTo(beam.x2,beam.y2); ctx.stroke();
      } else if(beam.type==="trackingBeamWarning" && beam.timer>0){
        const blink = (beam.timer % 12) < 6;
        ctx.strokeStyle=blink?"rgba(255,240,140,0.95)":"rgba(255,255,255,0.65)";
        ctx.lineWidth=4;
        ctx.beginPath(); ctx.moveTo(beam.cx,beam.cy); ctx.lineTo(beam.cx + Math.cos(beam.angle)*700, beam.cy + Math.sin(beam.angle)*700); ctx.stroke();
        ctx.fillStyle="rgba(255,240,140,0.9)";
        ctx.beginPath(); ctx.arc(beam.cx, beam.cy, 6, 0, Math.PI*2); ctx.fill();
      } else if(beam.type==="trackingBeam" && beam.active>0){
        ctx.strokeStyle="rgba(255,90,90,0.98)"; ctx.lineWidth=8;
        ctx.beginPath(); ctx.moveTo(beam.cx,beam.cy); ctx.lineTo(beam.cx + Math.cos(beam.angle)*700, beam.cy + Math.sin(beam.angle)*700); ctx.stroke();
      }
    }
  }

  function drawPlayer(){
    const p=state.player; if(!p) return;
    if(p.invuln>0 && ((p.invuln/4)|0)%2===0) return;
    for(let i=0;i<p.options;i++){
      const side=i%2===0?-1:1,row=i<2?0:1;
      const spreadBase = p.formation==="focus" ? 14 : 26;
      const rowOffset = p.formation==="focus" ? 4 : 10;
      const oyBase = p.formation==="focus" ? 14 : 8;
      const ox=p.x+side*(spreadBase+row*rowOffset),oy=p.y+(row===0?oyBase:oyBase+18);
      ctx.save(); ctx.translate(ox,oy); ctx.fillStyle="#c4b5fd"; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    if(state.overdriveTimer>0){
      ctx.strokeStyle="rgba(251,191,36,0.8)"; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(p.x,p.y,22+Math.sin(state.frame*0.2)*2,0,Math.PI*2); ctx.stroke();
    }
    ctx.save(); ctx.translate(p.x,p.y);
    const grad=ctx.createLinearGradient(0,-26,0,22); grad.addColorStop(0,"#e0f2fe"); grad.addColorStop(1,"#60a5fa"); ctx.fillStyle=grad;
    ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(12,2); ctx.lineTo(8,16); ctx.lineTo(0,22); ctx.lineTo(-8,16); ctx.lineTo(-12,2); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#93c5fd";
    ctx.beginPath(); ctx.moveTo(-26,8); ctx.lineTo(-10,4); ctx.lineTo(-8,12); ctx.lineTo(-22,14); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(26,8); ctx.lineTo(10,4); ctx.lineTo(8,12); ctx.lineTo(22,14); ctx.closePath(); ctx.fill();
    ctx.fillStyle="#dbeafe"; ctx.fillRect(-3,-10,6,10); ctx.fillStyle="#bfdbfe"; ctx.fillRect(-4,16,8,8); ctx.fillStyle="rgba(56,189,248,0.85)"; ctx.fillRect(-2,24,4,10);
    if(keys.has("Shift")){ctx.strokeStyle="rgba(251,191,36,0.9)"; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.stroke();}
    ctx.restore();
  }

  function drawEnemy(e){
    ctx.save(); ctx.translate(e.x,e.y);
    if(e.buffAura){ctx.strokeStyle="rgba(74,222,128,0.7)"; ctx.beginPath(); ctx.arc(0,0,24+Math.sin(state.frame*0.1)*2,0,Math.PI*2); ctx.stroke();}
    if(e.buff){ctx.strokeStyle="rgba(255,220,120,0.7)"; ctx.strokeRect(-18,-14,36,28);}
    if(e.type==="drone"){
      ctx.fillStyle="#f87171"; ctx.beginPath(); ctx.moveTo(0,-11); ctx.lineTo(12,-2); ctx.lineTo(8,10); ctx.lineTo(-8,10); ctx.lineTo(-12,-2); ctx.closePath(); ctx.fill();
      ctx.fillStyle="#fee2e2"; ctx.fillRect(-4,-3,8,6);
    }
    else if(e.type==="sweeper"){
      ctx.fillStyle="#fb7185"; ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(18,0); ctx.lineTo(0,14); ctx.lineTo(-18,0); ctx.closePath(); ctx.fill();
      ctx.fillStyle="rgba(255,255,255,0.25)"; ctx.fillRect(-10,-2,20,4);
    }
    else if(e.type==="zigzag"){
      ctx.fillStyle="#b988ff"; ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(14,-2); ctx.lineTo(4,0); ctx.lineTo(14,12); ctx.lineTo(0,8); ctx.lineTo(-14,12); ctx.lineTo(-4,0); ctx.lineTo(-14,-2); ctx.closePath(); ctx.fill();
    }
    else if(e.type==="carrier"){
      ctx.fillStyle="#4ade80"; ctx.fillRect(-16,-10,32,20); ctx.fillStyle="#dcfce7"; ctx.fillRect(-8,-4,16,8); ctx.fillStyle="rgba(255,255,255,0.24)"; ctx.fillRect(-16,6,32,3);
    }
    else if(e.type==="chaser"){
      ctx.fillStyle="#f472b6"; ctx.beginPath(); ctx.arc(0,0,15,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fce7f3"; ctx.fillRect(-6,-2,12,4); ctx.strokeStyle="rgba(255,255,255,0.35)"; ctx.strokeRect(-10,-10,20,20);
    }
    else if(e.type==="buffer"){
      ctx.fillStyle="#22c55e"; ctx.fillRect(-15,-10,30,20); ctx.fillStyle="#dcfce7"; ctx.fillRect(-5,-4,10,8);
      ctx.strokeStyle="rgba(74,222,128,0.7)"; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.stroke();
    }
    else if(e.type==="shield"){
      ctx.fillStyle="#60a5fa"; ctx.fillRect(-16,-10,32,20); ctx.fillStyle="#dbeafe"; ctx.fillRect(4,-12,12,24); ctx.fillStyle="rgba(255,255,255,0.18)"; ctx.fillRect(-15,-9,10,18);
    }
    else if(e.type==="splitter"){
      ctx.fillStyle="#fb923c"; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fff7ed"; ctx.fillRect(-5,-5,10,10); ctx.strokeStyle="rgba(255,255,255,0.25)"; ctx.strokeRect(-10,-10,20,20);
    }
    else if(e.type==="sniper"){
      ctx.fillStyle="#f43f5e"; ctx.fillRect(-15,-8,30,16); ctx.fillStyle="#fff1f2"; ctx.fillRect(-3,-14,6,28);
    }
    else if(e.type==="mine"){
      ctx.fillStyle="#fb923c"; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill(); for(let i=0;i<6;i++){ const a=Math.PI*2*i/6; ctx.fillRect(Math.cos(a)*10-1, Math.sin(a)*10-1, 2, 6); }
    }
    else if(e.type==="boomerang"){
      ctx.fillStyle="#c084fc"; ctx.beginPath(); ctx.moveTo(-14,-8); ctx.lineTo(14,0); ctx.lineTo(-14,8); ctx.lineTo(-4,0); ctx.closePath(); ctx.fill();
    }
    else if(e.type==="turret2"){
      ctx.fillStyle="#38bdf8"; ctx.fillRect(-16,-12,32,24); ctx.fillStyle="#e0f2fe"; ctx.fillRect(-14,-2,28,4);
    }
    else if(e.type==="dash"){
      ctx.fillStyle="#fb7185"; ctx.beginPath(); ctx.moveTo(0,-14); ctx.lineTo(12,12); ctx.lineTo(0,6); ctx.lineTo(-12,12); ctx.closePath(); ctx.fill();
    }
    else if(e.type==="orbiter"){
      ctx.fillStyle="#60a5fa"; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="#dbeafe"; ctx.beginPath(); ctx.arc(0,0,20,0,Math.PI*2); ctx.stroke();
    }
    else if(e.type==="healer"){
      ctx.fillStyle="#22c55e"; ctx.fillRect(-14,-14,28,28); ctx.fillStyle="#dcfce7"; ctx.fillRect(-4,-10,8,20); ctx.fillRect(-10,-4,20,8);
    }
    else if(e.type==="bomber"){
      ctx.fillStyle="#f59e0b"; ctx.beginPath(); ctx.moveTo(0,-16); ctx.lineTo(16,0); ctx.lineTo(0,16); ctx.lineTo(-16,0); ctx.closePath(); ctx.fill(); ctx.fillStyle="#fff7ed"; ctx.fillRect(-6,-2,12,4);
    }
    else if(e.type==="lancer"){
      ctx.fillStyle="#f472b6"; ctx.fillRect(-10,-14,20,28); ctx.fillStyle="#fff1f2"; ctx.fillRect(-2,-18,4,36);
    }
    else {ctx.fillStyle="#f59e0b"; ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fff7ed"; ctx.fillRect(-8,-2,16,4);}
    ctx.restore();
  }

  function drawBossBar(hp,maxHp,color,y){}
  function drawMidboss(){
    const m=state.midboss; if(!m) return; ctx.save(); ctx.translate(m.x,m.y);
    if(m.style==="WIND"){
      const grad=ctx.createLinearGradient(-40,-30,40,30); grad.addColorStop(0,"#bfeaff"); grad.addColorStop(1,"#5ecbff"); ctx.fillStyle=grad;
      ctx.beginPath(); ctx.moveTo(0,-38); ctx.lineTo(30,-12); ctx.lineTo(40,8); ctx.lineTo(10,28); ctx.lineTo(-10,28); ctx.lineTo(-40,8); ctx.lineTo(-30,-12); ctx.closePath(); ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.4)"; ctx.beginPath(); ctx.arc(0,0,34,0,Math.PI*2); ctx.stroke();
    } else if(m.style==="CANYON"){
      const grad=ctx.createLinearGradient(-44,-30,44,30); grad.addColorStop(0,"#ffd4a8"); grad.addColorStop(1,"#ff8b3d"); ctx.fillStyle=grad;
      ctx.fillRect(-40,-24,80,48); ctx.fillStyle="#fff0df"; ctx.fillRect(-12,-10,24,20); ctx.fillStyle="rgba(60,30,20,0.28)"; ctx.fillRect(-34,-18,10,36); ctx.fillRect(24,-18,10,36);
    } else if(m.style==="NIGHT"){
      const grad=ctx.createRadialGradient(0,0,6,0,0,42); grad.addColorStop(0,"#efe0ff"); grad.addColorStop(1,"#8b5cf6"); ctx.fillStyle=grad;
      ctx.beginPath(); ctx.arc(0,0,38,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(0,0,10,0,Math.PI*2); ctx.fill();
    } else {
      const grad=ctx.createLinearGradient(-40,-30,40,30); grad.addColorStop(0,"#fda4af"); grad.addColorStop(1,"#fb7185"); ctx.fillStyle=grad;
      ctx.beginPath(); ctx.moveTo(0,-42); ctx.lineTo(34,-10); ctx.lineTo(44,20); ctx.lineTo(0,34); ctx.lineTo(-44,20); ctx.lineTo(-34,-10); ctx.closePath(); ctx.fill(); ctx.fillStyle="#fff1f2"; ctx.fillRect(-10,-12,20,12);
    }
    ctx.restore(); drawBossBar(m.hp,m.maxHp,m.style==="WIND"?"#5ecbff":(m.style==="CANYON"?"#ff9b3d":(m.style==="NIGHT"?"#b988ff":"#fb7185")),98);
  }
  function drawBoss(){
    const b=state.boss; if(!b) return; ctx.save(); ctx.translate(b.x,b.y);
    if(b.style==="WIND"){
      const grad=ctx.createLinearGradient(-60,-50,60,50); grad.addColorStop(0,"#d8f4ff"); grad.addColorStop(1,"#38bdf8"); ctx.fillStyle=grad;
      ctx.beginPath(); ctx.moveTo(0,-54); ctx.lineTo(54,-16); ctx.lineTo(28,12); ctx.lineTo(58,36); ctx.lineTo(0,24); ctx.lineTo(-58,36); ctx.lineTo(-28,12); ctx.lineTo(-54,-16); ctx.closePath(); ctx.fill();
      ctx.strokeStyle="rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.arc(0,4,20,0,Math.PI*2); ctx.stroke();
    } else if(b.style==="CANYON"){
      const grad=ctx.createLinearGradient(-60,-44,60,44); grad.addColorStop(0,"#ffd5ad"); grad.addColorStop(1,"#f97316"); ctx.fillStyle=grad;
      ctx.fillRect(-54,-34,108,68); ctx.fillStyle="#fff3e6"; ctx.fillRect(-16,-12,32,24); ctx.fillStyle="rgba(80,40,20,0.28)"; ctx.fillRect(-48,-28,16,56); ctx.fillRect(32,-28,16,56);
    } else if(b.style==="NIGHT"){
      const grad=ctx.createRadialGradient(0,0,12,0,0,60); grad.addColorStop(0,"#f5edff"); grad.addColorStop(1,"#7c3aed"); ctx.fillStyle=grad;
      ctx.beginPath(); ctx.arc(0,0,56,0,Math.PI*2); ctx.fill(); ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle="rgba(220,190,255,0.5)"; ctx.beginPath(); ctx.arc(0,0,38,0,Math.PI*2); ctx.stroke();
    } else {
      const grad=ctx.createLinearGradient(-60,-40,60,40); grad.addColorStop(0,"#c4b5fd"); grad.addColorStop(1,"#7c3aed"); ctx.fillStyle=grad;
      ctx.beginPath(); ctx.moveTo(0,-56); ctx.lineTo(46,-20); ctx.lineTo(60,18); ctx.lineTo(32,44); ctx.lineTo(-32,44); ctx.lineTo(-60,18); ctx.lineTo(-46,-20); ctx.closePath(); ctx.fill(); ctx.fillStyle="#ede9fe"; ctx.fillRect(-12,-18,24,18); ctx.fillStyle="#fb7185"; ctx.beginPath(); ctx.arc(0,6,10,0,Math.PI*2); ctx.fill();
    }
    ctx.restore(); drawBossBar(b.hp,b.maxHp,b.style==="WIND"?"#5ecbff":(b.style==="CANYON"?"#ff9b3d":(b.style==="NIGHT"?"#b988ff":"#a78bfa")),120);
  }

  function drawBullets(){
    for(const b of state.bullets){
      ctx.fillStyle=b.color;
      if(b.mode==="laser"){ctx.shadowBlur=10; ctx.shadowColor=b.color; ctx.fillRect(b.x-2.5,b.y-18,5,28); ctx.shadowBlur=0;}
      else{ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();}
    }
    for(const b of state.enemyBullets){
      ctx.shadowBlur=10; ctx.shadowColor=b.glow; ctx.fillStyle=b.color; ctx.beginPath(); ctx.arc(b.x,b.y,b.radius,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#ffffff"; ctx.beginPath(); ctx.arc(b.x,b.y,Math.max(1.5,b.radius*0.35),0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
    }
  }

  function drawItems(){
    for(const i of state.items){
      ctx.save(); ctx.translate(i.x,i.y);
      const c={power:"#22c55e",option:"#a78bfa",shield:"#60a5fa",bomb:"#f59e0b",life:"#38bdf8",overdrive:"#fbbf24"}[i.kind]||"#fff";
      const t={power:"P",option:"O",shield:"S",bomb:"B",life:"1UP",overdrive:"OD"}[i.kind]||"?";
      ctx.fillStyle=c; ctx.beginPath(); ctx.arc(0,0,i.radius,0,Math.PI*2); ctx.fill();
      ctx.fillStyle="#fff"; ctx.font="bold 10px sans-serif"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText(t,0,1);
      ctx.restore();
    }
  }

  function drawEffects(){for(const e of state.effects){const a=e.life/e.maxLife; ctx.globalAlpha=a; ctx.fillStyle=e.color||"#fff"; ctx.fillRect(e.x,e.y,e.size||3,e.size||3); ctx.globalAlpha=1;}}

  function drawPause(){if(!state.paused) return; ctx.fillStyle="rgba(2,6,23,0.55)"; ctx.fillRect(0,0,W,H); ctx.fillStyle="#e2e8f0"; ctx.font="bold 38px sans-serif"; ctx.textAlign="center"; ctx.fillText("PAUSE",W/2,H/2);}

  function render(){
    const sx=state.shake?rand(-state.shake,state.shake):0, sy=state.shake?rand(-state.shake,state.shake):0;
    ctx.save(); ctx.translate(sx,sy);
    drawBackground(); drawHazards(); drawItems(); drawBullets();
    for(const e of state.enemies) drawEnemy(e);
    drawMidboss(); drawBoss(); drawEffects(); drawPlayer(); drawPause();
    ctx.restore();
  }

  function loop(){try{update(); render(); requestAnimationFrame(loop);}catch(e){log("error",{message:e.message}); console.error(e); state.running=false; if(ui.overlay){ui.overlay.classList.remove("hidden"); ui.overlay.classList.add("show"); ui.overlay.style.pointerEvents="auto"}; safeSet(ui.overlayTitle, "ERROR"); safeSet(ui.overlayText, e.message); safeSet(ui.startBtn, "RESTART"); pauseBGM();}}

  window.addEventListener("keydown", async (e)=>{
    if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
    keys.add(e.key);
    if(audioCtx.state==="suspended"){try{await audioCtx.resume();}catch(_){}}    
    if((e.key==="p"||e.key==="P") && state.running && !state.gameOver) state.paused=!state.paused;
    if((e.key==="x"||e.key==="X") && state.running && !state.paused) { if(state.player && state.player.bombs>0){ state.player.bombs--; state.enemyBullets=[]; if(state.midboss) state.midboss.hp-=30; if(state.boss) state.boss.hp-=42; for(const en of state.enemies) en.hp-=14; spawnEffect(state.player.x,state.player.y,"bomb",80,"#c4b5fd",4); state.shake=18; sfx.bomb();}}
    if(e.key==="c"||e.key==="C"){ if(state.player){ state.player.weaponIndex=(state.player.weaponIndex+1)%3; showMessage(weaponName(),45); updateHud();}}
    if(e.key==="v"||e.key==="V"){ if(state.running&&!state.paused) startOverdrive(); }
    if(e.key==="f"||e.key==="F"){
      if(state.player){
        state.player.formation = state.player.formation==="wide" ? "focus" : "wide";
        showMessage(`${t("formation","FORM")} ${t(state.player.formation==="focus"?"form_focus":"form_wide", state.player.formation.toUpperCase())}`, 36);
        updateHud();
      }
    }
    if(e.key==="m"||e.key==="M"){ settings.bgm=!settings.bgm; ui.bgmToggle.checked=settings.bgm; settings.bgm?playBGM():pauseBGM(); saveSettings(); }
    if(e.key==="d"||e.key==="D"){ settings.debugVisible=!settings.debugVisible; ui.debugPanel.style.display=settings.debugVisible?"block":"none"; safeSet(ui.toggleDebugBtn, settings.debugVisible?"DEBUG: ON":"DEBUG: OFF"); saveSettings(); }
  });
  window.addEventListener("keyup",e=>keys.delete(e.key));

  async function startGameFlow(){
    try{ if(audioCtx.state==="suspended") await audioCtx.resume(); }catch(_){}
    safeSet(ui.overlayTitle, t("title","VERTICAL SHOOTER"));
    safeSet(ui.overlayText, t("subtitle","S-RANK AUTO HUD v6.3"));
    safeSet(ui.startBtn, t("start","START"));
    if(ui.overlay){
      ui.overlay.classList.remove("show");
      ui.overlay.classList.add("hidden"); ui.overlay.style.pointerEvents="none";
    }
    resetGame();
  }

  if(ui.startBtn){
    if (ui.startBtn) {
  ui.startBtn.addEventListener("click", startGameFlow);
}

if (ui.overlay) {
  ui.overlay.addEventListener("click", (ev) => {
    if (ev.target === ui.overlay) startGameFlow();
  });
}

setTimeout(() => {
  if (!state.running) {
    startGameFlow();
  }
}, 300);
  }

  updateHud();
  updateDebug();
  loop();

  // Guaranteed startup so the game is playable even if overlay interaction fails.
  setTimeout(() => {
    if(!state.running){
      startGameFlow();
    }
  }, 50);
})();

});





