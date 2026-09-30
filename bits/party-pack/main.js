window.plethoraBit = {
  async init(ctx) {
    const root = ctx.createRoot({ className: "pp-root", layer: "content", touchAction: "manipulation" });

    // ---------------- content ----------------
    const NHIE = [
      "been on a blind date", "sung karaoke sober", "stalked an ex online", "fallen asleep in a class or meeting",
      "lied about my age", "sent a text to the wrong person", "pretended to like a gift", "cried at a movie in public",
      "eaten food off the floor", "forgotten someone's name mid-conversation", "gone skinny dipping",
      "binge-watched a whole season in one day", "laughed so hard I snorted", "been kicked out of a bar or club",
      "had a crush on a friend's sibling", "ghosted someone", "broken something and blamed someone else",
      "sleepwalked", "faked being sick to skip plans", "gotten a tattoo I regret", "dyed my hair a wild color",
      "danced on a table", "stayed up for 24 hours straight", "read someone else's messages",
      "gone on a trip without telling anyone", "walked into a glass door", "lost my phone on a night out",
      "sung in the shower this week", "cheated at a board game", "been on TV", "slid into a celebrity's DMs",
      "worn the same outfit three days in a row", "tripped in front of a crush", "eaten a whole pizza alone",
      "pretended to be on a call to avoid someone", "had a secret social media account", "been in a physical fight",
      "googled myself", "re-gifted a present", "said 'I love you' first", "fallen asleep on public transport and missed my stop",
      "been caught talking to myself", "used a fake name at a coffee shop", "taken a selfie with a stranger",
      "cut my own hair", "forgotten a friend's birthday", "fibbed on my resume", "had a song stuck in my head for a week",
      "waved back at someone who wasn't waving at me", "laughed at a funeral"
    ];
    const MOST_LIKELY = [
      "become famous", "survive a zombie apocalypse", "text their ex tonight", "get lost in their own city",
      "win a hot-dog eating contest", "join a cult by accident", "cry during a kids' movie", "become a millionaire",
      "forget their own birthday", "adopt ten cats", "get arrested for something silly", "marry a stranger in Vegas",
      "start a band", "move to another country on a whim", "laugh at the worst possible moment",
      "be late to their own wedding", "go viral online", "fall asleep at this party", "talk their way out of a ticket",
      "eat something off a dare", "lose their keys twice in one day", "become a reality TV star",
      "run a marathon without training", "still be dancing at 4am", "befriend the bouncer", "believe in ghosts",
      "start a conspiracy theory", "win the lottery and lose the ticket", "give the best wedding speech",
      "accidentally like an old photo", "sing every word of every song", "order for the whole table",
      "get a matching tattoo with a stranger", "call their mom tonight", "trip over nothing",
      "become president", "have a secret talent", "cause a group chat drama", "cook the best meal", "live to 100"
    ];
    const TRUTHS = [
      "What's your most embarrassing moment?", "Who in this room would you swap lives with for a day?",
      "What's the worst gift you've ever received?", "What's a secret talent nobody here knows about?",
      "What's the last lie you told?", "What's your worst habit?", "Who was your first crush?",
      "What's the most childish thing you still do?", "What's your go-to karaoke song?",
      "What's the weirdest thing you've ever eaten?", "What's something you've never told your parents?",
      "What's the worst date you've been on?", "If you could delete one photo of yourself, which would it be?",
      "What's the pettiest thing you've ever done?", "What's the most money you've wasted on something dumb?",
      "What's the strangest dream you remember?", "Which app do you spend too much time on?",
      "What's your guilty-pleasure TV show?", "Who here would you call to help you hide a (fake) body?",
      "What's the worst haircut you've ever had?", "What's your biggest pet peeve?",
      "What rumor have you heard about yourself?", "What's the longest you've gone without showering?",
      "What's your most irrational fear?", "Have you ever pretended to know a song you didn't?",
      "What's one thing you'd change about your personality?", "What's your worst cooking disaster?",
      "What's the most rebellious thing you did as a teen?", "Who was the last person you stalked online?",
      "What's the cringiest thing in your camera roll?", "What's the best compliment you've ever received?",
      "What's a movie you pretend to have seen?", "What's your biggest regret from this year?",
      "Which person here do you think knows you best?", "What's the silliest thing you've cried about?",
      "What's the most trouble you've been in at school or work?", "What's a hill you'd die on?",
      "What's your weirdest food combination?", "What would your autobiography be called?",
      "What's the most spontaneous thing you've done?"
    ];
    const CATEGORIES = [
      "Beer brands", "Cocktails", "Pizza toppings", "Car brands", "Dog breeds", "Countries in Europe",
      "Disney movies", "Things in a kitchen", "Fast food chains", "Superheroes", "Board games", "Fruits",
      "Breakfast cereals", "Musical instruments", "Sports played with a ball", "Things that are yellow",
      "Harry Potter characters", "Types of cheese", "Capital cities", "Clothing brands", "Social media apps",
      "Words that rhyme with 'cat'", "Taylor Swift songs", "Ice cream flavors", "Animals in the ocean",
      "Things you'd find at a beach", "Video game characters", "Vegetables", "Famous rappers", "Card games",
      "Things with wheels", "Board-game pieces", "Dance moves", "Things that are cold", "US states",
      "Types of pasta", "Candy bars", "Movie villains", "Kitchen appliances", "Things you do on a first date"
    ];
    const WHEEL_ACTIONS = [
      { t: "drinks {n}", kind: "self" }, { t: "gives out {n}", kind: "give" }, { t: "drinks {n}", kind: "self" },
      { t: "picks a mate to drink with", kind: "mate" }, { t: "is safe this round", kind: "safe" },
      { t: "and the person on their left drink {n}", kind: "left" }, { t: "starts a waterfall", kind: "waterfall" },
      { t: "makes a new rule", kind: "rule" }
    ];
    const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
    const SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
    const KINGS_RULES = {
      A: ["Waterfall", "Everyone starts drinking at the same time. You can only stop when the person before you stops \u2014 the drawer stops first."],
      2: ["You", "Pick someone to drink."],
      3: ["Me", "You drink."],
      4: ["Floor", "Everyone touches the floor. Last one down drinks."],
      5: ["Thumb Master", "You're Thumb Master. Any time you put your thumb on the table, everyone copies \u2014 last to notice drinks."],
      6: ["Never Have I Ever", "Quick round: everyone holds up 3 fingers, go around saying 'never have I ever\u2026'. First to lose all 3 drinks."],
      7: ["Heaven", "Everyone points to the sky. Last one to point drinks."],
      8: ["Mate", "Pick a mate. Whenever you drink, they drink too (and vice versa)."],
      9: ["Rhyme", "Say a word. Going round, everyone says a word that rhymes. First to repeat or blank drinks."],
      10: ["Categories", "Pick a category. Going round, name things in it. First to repeat or blank drinks."],
      J: ["Make a Rule", "Invent a rule everyone must follow for the rest of the game (e.g. no first names). Break it, drink."],
      Q: ["Question Master", "You're Question Master. Anyone who answers a question you ask drinks."],
      K: ["King's Cup", "Pour some of your drink into the cup in the middle. Whoever draws the 4th King drinks the King's Cup!"]
    };

    const GAMES = [
      {
        id: "kings", name: "King's Cup", emoji: "\ud83d\udc51", color: "#ffcf3d", players: "3\u201310",
        tagline: "Every card is a rule. Four kings and someone finishes the cup.",
        rules: [
          "Put a big empty cup in the middle \u2014 the King's Cup.",
          "Take turns tapping the deck to draw a card. The app shows whose turn it is.",
          "Each card has a rule (A Waterfall, 2 You, 3 Me, 4 Floor, 5 Thumb Master, 6 Never Have I Ever, 7 Heaven, 8 Mate, 9 Rhyme, 10 Categories, J Make a Rule, Q Question Master, K King's Cup).",
          "Tap the names of whoever has to drink \u2014 the app tracks mates, thumb master, question master and your custom rules for you.",
          "When the 4th King is drawn, that player drinks the King's Cup and the game ends."
        ]
      },
      {
        id: "nhie", name: "Never Have I Ever", emoji: "\ud83d\ude48", color: "#ff5fa2", players: "2\u201310",
        tagline: "Confess or keep your fingers up.",
        rules: [
          "Everyone starts with 3 fingers up (the app tracks them as dots).",
          "Read the prompt out loud: 'Never have I ever\u2026'.",
          "Anyone who HAS done it drinks and puts a finger down \u2014 tap their name.",
          "Lose all 3 fingers and you're out (and take a bonus drink). Last player with fingers wins."
        ]
      },
      {
        id: "likely", name: "Most Likely To", emoji: "\ud83d\udc49", color: "#5fd4ff", players: "3\u201310",
        tagline: "Point on three. Most votes drinks.",
        rules: [
          "Read the prompt: 'Who's most likely to\u2026'.",
          "Count to three and everyone points at someone.",
          "Tap each person's name once per finger pointing at them.",
          "Hit Reveal \u2014 whoever got the most votes drinks one per vote."
        ]
      },
      {
        id: "truth", name: "Truth or Drink", emoji: "\ud83e\udd2b", color: "#b58cff", players: "2\u201310",
        tagline: "Answer honestly \u2014 or drink twice.",
        rules: [
          "The app picks whose turn it is and gives them a question.",
          "Answer it honestly, or refuse and drink 2.",
          "Tap Answered or Drank, and it passes to the next player."
        ]
      },
      {
        id: "hilo", name: "Higher or Lower", emoji: "\ud83c\udccf", color: "#4dffa6", players: "2\u201310",
        tagline: "Guess the next card. The pile gets pricier.",
        rules: [
          "A card is face up. The player whose turn it is guesses if the next card is Higher or Lower (Aces are low).",
          "Get it right and your streak grows. Three right in a row and you pass the turn safely.",
          "Get it wrong (or hit the same value) and drink one for every card in your streak, plus one.",
          "Then it's the next player's turn."
        ]
      },
      {
        id: "buzz", name: "Buzz", emoji: "\ud83d\udd22", color: "#ff8a3d", players: "3\u201310",
        tagline: "Count up. Say BUZZ on the sevens.",
        rules: [
          "Go around counting up from 1, one number each.",
          "Buzz mode: instead of any number that's a multiple of 7 or contains a 7, say 'BUZZ'. FizzBuzz mode: 'Fizz' for multiples of 3, 'Buzz' for 5, 'FizzBuzz' for both.",
          "The app shows whose turn it is \u2014 tap Reveal to check the right answer.",
          "Mess up or hesitate and you drink; the count restarts at 1."
        ]
      },
      {
        id: "cats", name: "Categories", emoji: "\u23f1\ufe0f", color: "#ff4d6d", players: "2\u201310",
        tagline: "Five seconds to name something. Go.",
        rules: [
          "The app picks a category (or roll a new one).",
          "Tap Start. The player on the clock has 5 seconds to name something in the category.",
          "Tap Got it to pass to the next player \u2014 the timer resets.",
          "Repeat an answer, blank, or run out of time and you drink. The phone buzzes when time's up."
        ]
      },
      {
        id: "bomb", name: "Hot Potato Bomb", emoji: "\ud83d\udca3", color: "#ff6b3d", players: "3\u201310",
        tagline: "Say a word, pass the phone, don't be holding it.",
        rules: [
          "Tap Arm \u2014 a secret fuse between 12 and 45 seconds starts. The phone ticks faster as it burns.",
          "Whoever holds the phone says something from the category, then passes it to the next person.",
          "When it explodes, whoever is holding it drinks 2 \u2014 tap their name.",
          "No throwing the phone. Seriously."
        ]
      },
      {
        id: "wheel", name: "Drink Wheel", emoji: "\ud83c\udfa1", color: "#3dd6ff", players: "2\u201310",
        tagline: "Spin. Fate decides.",
        rules: [
          "Tap Spin. The wheel lands on a player and picks what happens to them.",
          "Do what it says \u2014 the app logs the drinks.",
          "Great as a tiebreaker or between other games."
        ]
      }
    ];

    // ---------------- helpers ----------------
    const MAX_PLAYERS = 10;
    const MIN_PLAYERS = 2;
    function esc(s) {
      return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
    }
    function shuffle(a) {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    }
    function order(n) {
      return shuffle(Array.from({ length: n }, (_, i) => i));
    }
    function newDeck() {
      const d = [];
      for (const s of SUITS) for (let r = 0; r < RANKS.length; r++) d.push({ r: RANKS[r], v: r + 1, s });
      return shuffle(d);
    }
    function tune(id, fallback) {
      try {
        const v = ctx.tune.get(id);
        return v === undefined || v === null ? fallback : v;
      } catch (e) {
        return fallback;
      }
    }
    let lastHap = 0;
    function hap(kind, force) {
      if (!tune("haptics_on", true)) return;
      if (ctx.capabilities && ctx.capabilities.haptics === false) return;
      const now = performance.now();
      if (!force && now - lastHap < 40) return;
      lastHap = now;
      try { ctx.platform.haptic(kind); } catch (e) { /* haptics unavailable */ }
    }

    // ---------------- persistent setup ----------------
    const setup = {
      count: 4,
      names: Array.from({ length: MAX_PLAYERS }, (_, i) => "Player " + (i + 1)),
      unit: "sip"
    };
    try {
      const saved = await Promise.resolve(ctx.storage.get("party_pack_setup"));
      if (saved && Array.isArray(saved.names)) {
        setup.count = Math.min(MAX_PLAYERS, Math.max(MIN_PLAYERS, saved.count | 0 || 4));
        saved.names.slice(0, MAX_PLAYERS).forEach((n, i) => { if (typeof n === "string" && n.trim()) setup.names[i] = n.slice(0, 18); });
        if (saved.unit === "point" || saved.unit === "sip") setup.unit = saved.unit;
        if (saved._seen) setup._seen = true;
      }
    } catch (e) { /* storage optional */ }
    let saveTimer = null;
    function persist() {
      if (saveTimer) return;
      saveTimer = ctx.timeout(() => {
        saveTimer = null;
        try { Promise.resolve(ctx.storage.set("party_pack_setup", setup)).catch(() => {}); } catch (e) { /* ignore */ }
      }, 400);
    }

    let tallies = new Array(MAX_PLAYERS).fill(0);
    let totalDrinks = 0;
    let waterShown = 0;
    const N = () => setup.count;
    const name = i => esc(setup.names[i] || "Player " + (i + 1));
    const sober = () => setup.unit === "point";
    function amount(n) {
      return sober() ? n + (n === 1 ? " point" : " points") : n + (n === 1 ? " sip" : " sips");
    }
    function verb() {
      return sober() ? "takes" : "drinks";
    }

    // ---------------- app state ----------------
    let screen = setup._seen ? "menu" : "setup";
    let gameId = null;
    let S = {};
    let started = false;
    let lastInteract = 0;

    function touched(type) {
      if (!started) {
        started = true;
        ctx.platform.start();
      }
      const now = performance.now();
      if (now - lastInteract > 800) {
        lastInteract = now;
        ctx.platform.interact({ type, game: gameId });
      }
    }

    // ---------------- drinks ----------------
    function drink(i, n, quiet) {
      if (i < 0 || i >= N()) return;
      tallies[i] += n;
      totalDrinks += n;
      const extra = [];
      if (gameId === "kings" && S.mates) {
        for (const [a, b] of S.mates) {
          const other = a === i ? b : b === i ? a : -1;
          if (other >= 0) {
            tallies[other] += n;
            totalDrinks += n;
            extra.push(setup.names[other]);
          }
        }
      }
      if (!quiet) {
        toast(setup.names[i] + " " + verb() + " " + amount(n) + (extra.length ? " (mate " + extra.join(", ") + " too)" : ""));
        hap("medium", true);
      }
      checkWater();
    }
    function drinkAll(n) {
      for (let i = 0; i < N(); i++) { tallies[i] += n; totalDrinks += n; }
      toast("Everyone " + (sober() ? "takes " : "drinks ") + amount(n) + "!");
      hap("heavy", true);
      checkWater();
    }
    function checkWater() {
      const every = tune("water_every", 20);
      if (every > 0 && Math.floor(totalDrinks / every) > waterShown) {
        waterShown = Math.floor(totalDrinks / every);
        ctx.timeout(() => {
          toast("\ud83d\udca7 Water break! Everyone grab some water.", "water", 3200);
          hap("success", true);
        }, 1400);
      }
    }

    // ---------------- toast ----------------
    let toastToken = 0;
    function toast(msg, kind, ms) {
      const el = root.querySelector("#pp-toast");
      if (!el) return;
      el.textContent = msg;
      el.className = "pp-toast show" + (kind ? " " + kind : "");
      const token = ++toastToken;
      ctx.timeout(() => {
        if (token === toastToken) el.className = "pp-toast";
      }, ms || 2100);
    }

    // ---------------- games: init ----------------
    function initGame(id) {
      gameId = id;
      const n = N();
      if (id === "kings") S = { deck: newDeck(), card: null, kings: 0, turn: 0, thumb: -1, qm: -1, mates: [], rules: [], over: false, draft: "" };
      else if (id === "nhie") S = { order: order(NHIE.length), pos: 0, fingers: new Array(n).fill(3) };
      else if (id === "likely") S = { order: order(MOST_LIKELY.length), pos: 0, votes: new Array(n).fill(0), result: "" };
      else if (id === "truth") S = { order: order(TRUTHS.length), pos: 0, turn: Math.floor(Math.random() * n) };
      else if (id === "hilo") { const d = newDeck(); S = { deck: d, card: d.pop(), streak: 0, turn: 0, result: "" }; }
      else if (id === "buzz") S = { n: 1, turn: 0, revealed: false, mode: S && S.mode ? S.mode : "7", best: 0 };
      else if (id === "cats") S = { order: order(CATEGORIES.length), pos: 0, turn: 0, running: false, t: tune("cat_seconds", 5), lastSec: -1 };
      else if (id === "bomb") S = { order: order(CATEGORIES.length), pos: 0, state: "idle", fuse: 0, t: 0, nextTick: 0, pulse: 0 };
      else if (id === "wheel") S = { angle: 0, vel: 0, spinning: false, idx: -1, result: null, pending: null };
    }
    function game() {
      return GAMES.find(g => g.id === gameId);
    }

    // ---------------- rendering ----------------
    const CSS = `
      .pp-root{font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#fff;background:radial-gradient(120% 80% at 50% 0%,#3a1470 0%,#1a0b3a 45%,#0b061c 100%);}
      .pp-app{position:absolute;inset:0;display:flex;flex-direction:column;}
      .pp-top{display:flex;align-items:center;gap:8px;padding:10px 14px 6px;min-height:52px;}
      .pp-top h1{flex:1;margin:0;font-size:18px;font-weight:800;text-align:center;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .pp-ib{min-width:44px;height:40px;border:0;border-radius:14px;background:rgba(255,255,255,.1);color:#fff;font-size:15px;font-weight:700;padding:0 12px;}
      .pp-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 16px 0;touch-action:pan-y;}
      .pp-pad{height:28px;}
      .pp-card{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:16px;margin:10px 0;}
      .pp-hero{text-align:center;padding:10px 0 4px;}
      .pp-hero .big{font-size:44px;line-height:1.1;}
      .pp-hero h2{margin:6px 0 2px;font-size:26px;font-weight:900;}
      .pp-muted{color:rgba(255,255,255,.62);font-size:13.5px;line-height:1.45;}
      .pp-warn{background:rgba(255,200,60,.1);border:1px solid rgba(255,200,60,.35);color:#ffe7a3;border-radius:14px;padding:10px 12px;font-size:12.5px;line-height:1.45;margin:10px 0;}
      .pp-btn{display:block;width:100%;min-height:52px;border:0;border-radius:16px;font-size:17px;font-weight:800;color:#1a0b3a;background:var(--acc,#ffcf3d);margin:10px 0;box-shadow:0 6px 22px -8px var(--acc,#ffcf3d);}
      .pp-btn.alt{background:rgba(255,255,255,.12);color:#fff;box-shadow:none;}
      .pp-btn.bad{background:#ff4d6d;color:#fff;box-shadow:0 6px 22px -8px #ff4d6d;}
      .pp-btn.good{background:#4dffa6;}
      .pp-row{display:flex;gap:10px;} .pp-row>.pp-btn{flex:1;}
      .pp-step{display:flex;align-items:center;justify-content:center;gap:18px;margin:8px 0;}
      .pp-step button{width:52px;height:52px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font-size:26px;font-weight:800;}
      .pp-step .n{font-size:40px;font-weight:900;min-width:60px;text-align:center;}
      .pp-names{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
      .pp-names input{width:100%;box-sizing:border-box;height:44px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.25);color:#fff;font-size:15px;padding:0 12px;}
      .pp-seg{display:flex;background:rgba(0,0,0,.25);border-radius:14px;padding:4px;gap:4px;}
      .pp-seg button{flex:1;height:40px;border:0;border-radius:11px;background:transparent;color:rgba(255,255,255,.7);font-weight:700;font-size:14px;}
      .pp-seg button.on{background:#fff;color:#1a0b3a;}
      .pp-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px;}
      .pp-game{border:0;text-align:left;border-radius:20px;padding:14px 12px;min-height:128px;color:#fff;background:linear-gradient(160deg,color-mix(in srgb,var(--acc) 38%,transparent),rgba(255,255,255,.05));border:1px solid color-mix(in srgb,var(--acc) 55%,transparent);}
      .pp-game .e{font-size:30px;} .pp-game b{display:block;font-size:16px;margin:6px 0 3px;} .pp-game span{font-size:12px;color:rgba(255,255,255,.72);line-height:1.35;display:block;}
      .pp-rules{margin:0;padding-left:22px;} .pp-rules li{margin:0 0 10px;line-height:1.5;font-size:15px;}
      .pp-chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0;}
      .pp-chip{border:0;border-radius:999px;padding:10px 14px;min-height:44px;font-size:14.5px;font-weight:700;background:rgba(255,255,255,.13);color:#fff;position:relative;}
      .pp-chip.on{background:var(--acc,#ffcf3d);color:#1a0b3a;}
      .pp-chip.out{opacity:.35;text-decoration:line-through;}
      .pp-chip .badge{display:inline-block;margin-left:6px;min-width:20px;padding:1px 6px;border-radius:999px;background:#1a0b3a;color:#fff;font-size:12px;}
      .pp-chip .dots{margin-left:6px;letter-spacing:1px;color:var(--acc);}
      .pp-label{font-size:12px;font-weight:800;letter-spacing:.9px;text-transform:uppercase;color:rgba(255,255,255,.55);margin:14px 0 2px;}
      .pp-turn{font-size:22px;font-weight:900;text-align:center;margin:8px 0;} .pp-turn em{font-style:normal;color:var(--acc);}
      .pp-prompt{font-size:24px;font-weight:800;line-height:1.3;text-align:center;padding:26px 14px;border-radius:22px;background:linear-gradient(150deg,color-mix(in srgb,var(--acc) 30%,transparent),rgba(255,255,255,.04));border:1px solid color-mix(in srgb,var(--acc) 50%,transparent);margin:10px 0;}
      .pp-prompt small{display:block;font-size:13px;font-weight:700;color:rgba(255,255,255,.6);margin-bottom:8px;letter-spacing:.6px;text-transform:uppercase;}
      .pp-playing{display:flex;justify-content:center;margin:10px 0;}
      .pp-pc{width:128px;height:178px;border-radius:16px;background:#fff;color:#1a0b3a;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:900;box-shadow:0 14px 34px -12px rgba(0,0,0,.7);animation:ppflip .35s ease-out;}
      .pp-pc .r{font-size:54px;line-height:1;} .pp-pc .s{font-size:38px;} .pp-pc.red{color:#e8284d;}
      .pp-pc.back{background:repeating-linear-gradient(45deg,var(--acc) 0 10px,color-mix(in srgb,var(--acc) 70%,#000) 10px 20px);color:#1a0b3a;border:6px solid #fff;box-sizing:border-box;font-size:18px;animation:none;}
      @keyframes ppflip{from{transform:rotateY(90deg) scale(.9);}to{transform:none;}}
      .pp-stat{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:6px 0;}
      .pp-stat span{background:rgba(255,255,255,.09);border-radius:999px;padding:6px 11px;font-size:12.5px;font-weight:700;}
      .pp-big{font-size:64px;font-weight:900;text-align:center;margin:4px 0;line-height:1.1;}
      .pp-timer{font-size:84px;font-weight:900;text-align:center;font-variant-numeric:tabular-nums;margin:6px 0;transition:color .2s;}
      .pp-timer.hot{color:#ff4d6d;}
      .pp-bomb{font-size:120px;text-align:center;margin:10px 0;line-height:1.1;transition:transform .08s;}
      .pp-wheelwrap{position:relative;width:min(78vw,320px);aspect-ratio:1;margin:18px auto 8px;}
      .pp-wheel{position:absolute;inset:0;border-radius:50%;border:6px solid #fff;box-shadow:0 10px 40px -10px rgba(0,0,0,.8);}
      .pp-wl{position:absolute;inset:0;display:flex;justify-content:center;pointer-events:none;}
      .pp-wl span{margin-top:9%;font-weight:900;font-size:13px;color:#1a0b3a;max-width:34%;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .pp-ptr{position:absolute;left:50%;top:-14px;transform:translateX(-50%);width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:26px solid #fff;filter:drop-shadow(0 3px 4px rgba(0,0,0,.5));z-index:2;}
      .pp-bar{height:10px;border-radius:6px;background:linear-gradient(90deg,#ffcf3d,#ff5fa2);margin-top:6px;}
      .pp-tally{display:flex;justify-content:space-between;align-items:baseline;font-weight:800;font-size:16px;}
      .pp-toast{position:absolute;left:16px;right:16px;top:calc(var(--st,0px) + 62px);padding:12px 14px;border-radius:16px;background:#fff;color:#1a0b3a;font-weight:800;font-size:15px;text-align:center;box-shadow:0 12px 34px -10px rgba(0,0,0,.7);transform:translateY(-12px);opacity:0;transition:all .22s;pointer-events:none;z-index:5;}
      .pp-toast.show{transform:none;opacity:1;} .pp-toast.water{background:#5fd4ff;}
      .pp-input{width:100%;box-sizing:border-box;height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.25);color:#fff;font-size:15px;padding:0 12px;margin-top:6px;}
    `;
    root.innerHTML = "<style>" + CSS + "</style><div class='pp-app' id='pp-app'></div><div id='pp-toast' class='pp-toast'></div>";
    const app = root.querySelector("#pp-app");

    function topBar(left, title, right) {
      return "<div class='pp-top'>" + (left || "<span style='min-width:44px'></span>") + "<h1>" + title + "</h1>" + (right || "<span style='min-width:44px'></span>") + "</div>";
    }
    function chips(opts) {
      let h = "<div class='pp-chips'>";
      for (let i = 0; i < N(); i++) {
        const o = opts(i) || {};
        h += "<button class='pp-chip" + (o.cls ? " " + o.cls : "") + "' data-act='" + (o.act || "chip") + "' data-i='" + i + "'>" + name(i) + (o.extra || "") + "</button>";
      }
      return h + "</div>";
    }
    function cardHtml(c) {
      const red = c.s === "\u2665" || c.s === "\u2666";
      return "<div class='pp-playing'><div class='pp-pc" + (red ? " red" : "") + "'><div class='r'>" + c.r + "</div><div class='s'>" + c.s + "</div></div></div>";
    }

    function render() {
      const safe = ctx.safeArea || { top: 0, bottom: 0 };
      app.style.paddingTop = (safe.top || 0) + "px";
      root.style.setProperty("--st", (safe.top || 0) + "px");
      const g = game();
      app.style.setProperty("--acc", g ? g.color : "#ffcf3d");
      const tallyBtn = "<button class='pp-ib' data-act='tally'>\ud83c\udf7a " + totalDrinks + "</button>";
      let h = "";
      if (screen === "setup") {
        h += topBar(setup._seen ? "<button class='pp-ib' data-act='menu'>\u2039</button>" : "", "Party Pack", "");
        h += "<div class='pp-body'>";
        h += "<div class='pp-hero'><div class='big'>\ud83c\udf7b\ud83c\udfb2\ud83c\udccf</div><h2>Who's playing?</h2><div class='pp-muted'>9 party games that explain themselves and run the round for you.</div></div>";
        h += "<div class='pp-warn'>\ud83d\udd1e For adults of legal drinking age only. Drink responsibly \u2014 anyone can swap any drink for water, and nobody has to drink. Never drink and drive.</div>";
        h += "<div class='pp-card'><div class='pp-label' style='margin-top:0'>Players</div>";
        h += "<div class='pp-step'><button data-act='minus'>\u2212</button><div class='n'>" + N() + "</div><button data-act='plus'>+</button></div>";
        h += "<div class='pp-names'>";
        for (let i = 0; i < N(); i++) h += "<input data-name='" + i + "' maxlength='18' value='" + esc(setup.names[i]) + "' aria-label='Player " + (i + 1) + " name'>";
        h += "</div></div>";
        h += "<div class='pp-card'><div class='pp-label' style='margin-top:0'>Penalties count as</div><div class='pp-seg'>";
        h += "<button data-act='unit' data-v='sip' class='" + (setup.unit === "sip" ? "on" : "") + "'>\ud83c\udf7a Sips</button>";
        h += "<button data-act='unit' data-v='point' class='" + (setup.unit === "point" ? "on" : "") + "'>\ud83e\udd64 Points (sober)</button></div></div>";
        h += "<button class='pp-btn' data-act='go'>Let's play \u2192</button><div class='pp-pad'></div></div>";
      } else if (screen === "menu") {
        h += topBar("<button class='pp-ib' data-act='setup'>\ud83d\udc65 " + N() + "</button>", "Pick a game", tallyBtn);
        h += "<div class='pp-body'><div class='pp-grid'>";
        for (const gm of GAMES) {
          h += "<button class='pp-game' style='--acc:" + gm.color + "' data-act='open' data-id='" + gm.id + "'><div class='e'>" + gm.emoji + "</div><b>" + gm.name + "</b><span>" + gm.tagline + "</span></button>";
        }
        h += "</div><div class='pp-warn' style='margin-top:14px'>\ud83d\udca7 The app calls a water break every " + tune("water_every", 20) + " drinks. Pace yourselves.</div><div class='pp-pad'></div></div>";
      } else if (screen === "rules") {
        h += topBar("<button class='pp-ib' data-act='menu'>\u2039</button>", "How to play", tallyBtn);
        h += "<div class='pp-body'><div class='pp-hero'><div class='big'>" + g.emoji + "</div><h2>" + g.name + "</h2><div class='pp-muted'>" + g.players + " players \u00b7 " + g.tagline + "</div></div>";
        h += "<div class='pp-card'><ol class='pp-rules'>" + g.rules.map(r => "<li>" + r + "</li>").join("") + "</ol></div>";
        h += "<button class='pp-btn' data-act='play'>" + (S._live ? "Back to the game" : "Start playing") + "</button>";
        if (S._live) h += "<button class='pp-btn alt' data-act='restart'>Restart this game</button>";
        h += "<div class='pp-pad'></div></div>";
      } else if (screen === "tally") {
        h += topBar("<button class='pp-ib' data-act='back'>\u2039</button>", "Drink tally", "");
        const max = Math.max(1, ...tallies.slice(0, N()));
        const rows = Array.from({ length: N() }, (_, i) => i).sort((a, b) => tallies[b] - tallies[a]);
        h += "<div class='pp-body'><div class='pp-muted' style='text-align:center'>" + totalDrinks + " total " + (sober() ? "points" : "sips") + " this session</div>";
        for (const i of rows) {
          h += "<div class='pp-card' style='padding:12px 14px'><div class='pp-tally'><span>" + name(i) + "</span><span>" + amount(tallies[i]) + "</span></div><div class='pp-bar' style='width:" + Math.max(2, (tallies[i] / max) * 100) + "%'></div></div>";
        }
        h += "<button class='pp-btn alt' data-act='resettally'>Reset tally</button><div class='pp-pad'></div></div>";
      } else if (screen === "play") {
        h += topBar("<button class='pp-ib' data-act='menu'>\u2039</button>", g.emoji + " " + g.name, "<button class='pp-ib' data-act='rules'>?</button>" + tallyBtn);
        h += "<div class='pp-body'>" + renderGame() + "<div class='pp-pad'></div></div>";
      }
      const body = app.querySelector(".pp-body");
      const scroll = body ? body.scrollTop : 0;
      app.innerHTML = h;
      const nb = app.querySelector(".pp-body");
      if (nb && keepScroll) nb.scrollTop = scroll;
      keepScroll = false;
    }
    let keepScroll = false;

    function turnLine(i, suffix) {
      return "<div class='pp-turn'><em>" + name(i) + "</em>" + (suffix || "'s turn") + "</div>";
    }

    function renderGame() {
      let h = "";
      if (gameId === "kings") {
        const kingsDots = "\ud83d\udc51".repeat(S.kings) + "\u25cb".repeat(4 - S.kings);
        h += "<div class='pp-stat'><span>" + kingsDots + "</span><span>\ud83c\udccf " + S.deck.length + " left</span>";
        if (S.thumb >= 0) h += "<span>\ud83d\udc4d Thumb: " + name(S.thumb) + "</span>";
        if (S.qm >= 0) h += "<span>\u2753 Q-Master: " + name(S.qm) + "</span>";
        for (const [a, b] of S.mates) h += "<span>\ud83e\udd1d " + name(a) + " + " + name(b) + "</span>";
        h += "</div>";
        if (S.over) {
          h += "<div class='pp-prompt'><small>4th King!</small>" + name(S.turn) + " drinks the King's Cup \ud83c\udfc6</div>";
          h += "<button class='pp-btn' data-act='restart'>New game</button>";
        } else if (!S.card) {
          h += turnLine(S.turn);
          h += "<div class='pp-playing' data-act='k-draw'><div class='pp-pc back'>TAP TO<br>DRAW</div></div>";
          h += "<button class='pp-btn' data-act='k-draw'>Draw a card</button>";
        } else {
          const c = S.card;
          const rule = KINGS_RULES[c.r];
          h += turnLine(S.turn, " drew");
          h += cardHtml(c);
          h += "<div class='pp-card' style='text-align:center'><div style='font-size:22px;font-weight:900;color:var(--acc)'>" + rule[0] + "</div><div class='pp-muted' style='font-size:15px;margin-top:4px'>" + rule[1] + "</div></div>";
          if (c.r === "J") {
            h += "<input class='pp-input' id='pp-rule' maxlength='80' placeholder='Type the new rule\u2026' value='" + esc(S.draft) + "'><button class='pp-btn alt' data-act='k-rule'>Add rule</button>";
          }
          if (c.r === "8" && !S.mateSet) {
            h += "<div class='pp-label'>Pick " + name(S.turn) + "'s mate</div>" + chips(i => (i === S.turn ? { cls: "out", act: "noop" } : { act: "k-mate" }));
          } else if (c.r !== "3" && c.r !== "A" && c.r !== "K") {
            h += "<div class='pp-label'>Tap whoever drinks</div>" + chips(() => ({}));
          }
          h += "<button class='pp-btn' data-act='k-next'>Next player \u2192</button>";
        }
        if (S.rules.length) {
          h += "<div class='pp-label'>House rules</div><div class='pp-card' style='padding:10px 14px'>" + S.rules.map(r => "<div style='margin:4px 0'>\u2022 " + esc(r) + "</div>").join("") + "</div>";
        }
      } else if (gameId === "nhie") {
        const p = NHIE[S.order[S.pos % S.order.length]];
        h += "<div class='pp-prompt'><small>Never have I ever\u2026</small>" + esc(p) + "</div>";
        h += "<div class='pp-label'>Tap everyone who has \u2014 they drink &amp; lose a finger</div>";
        h += chips(i => ({ cls: S.fingers[i] <= 0 ? "out" : "", extra: "<span class='dots'>" + "\u25cf".repeat(Math.max(0, S.fingers[i])) + "\u25cb".repeat(3 - Math.max(0, S.fingers[i])) + "</span>" }));
        const alive = S.fingers.slice(0, N()).map((f, i) => (f > 0 ? i : -1)).filter(i => i >= 0);
        if (alive.length === 1) h += "<div class='pp-prompt'><small>Winner</small>\ud83c\udfc6 " + name(alive[0]) + "</div>";
        h += "<button class='pp-btn' data-act='n-next'>Next prompt</button><button class='pp-btn alt' data-act='n-reset'>Everyone back to 3 fingers</button>";
      } else if (gameId === "likely") {
        const p = MOST_LIKELY[S.order[S.pos % S.order.length]];
        h += "<div class='pp-prompt'><small>Who's most likely to\u2026</small>" + esc(p) + "?</div>";
        h += "<div class='pp-muted' style='text-align:center'>3\u2026 2\u2026 1\u2026 point!</div>";
        h += "<div class='pp-label'>Tap once per finger pointing at them</div>";
        h += chips(i => ({ cls: S.votes[i] ? "on" : "", extra: S.votes[i] ? "<span class='badge'>" + S.votes[i] + "</span>" : "" }));
        if (S.result) h += "<div class='pp-card' style='text-align:center;font-weight:800;font-size:17px'>" + S.result + "</div>";
        h += "<div class='pp-row'><button class='pp-btn' data-act='l-reveal'>Reveal</button><button class='pp-btn alt' data-act='l-next'>Next prompt</button></div>";
      } else if (gameId === "truth") {
        h += turnLine(S.turn, ", truth or drink?");
        h += "<div class='pp-prompt'><small>Truth</small>" + esc(TRUTHS[S.order[S.pos % S.order.length]]) + "</div>";
        h += "<div class='pp-row'><button class='pp-btn good' data-act='t-ans'>Answered \u2713</button><button class='pp-btn bad' data-act='t-drink'>" + (sober() ? "Take 2" : "Drink 2") + "</button></div>";
        h += "<button class='pp-btn alt' data-act='t-skip'>Different question</button>";
      } else if (gameId === "hilo") {
        h += turnLine(S.turn);
        h += "<div class='pp-stat'><span>Streak " + "\ud83d\udd25".repeat(S.streak) + "\u25cb".repeat(3 - S.streak) + "</span><span>At stake: " + amount(S.streak + 1) + "</span><span>\ud83c\udccf " + S.deck.length + " left</span></div>";
        h += cardHtml(S.card);
        if (S.result) h += "<div class='pp-card' style='text-align:center;font-weight:800'>" + S.result + "</div>";
        h += "<div class='pp-row'><button class='pp-btn' data-act='h-hi'>\u2b06 Higher</button><button class='pp-btn' data-act='h-lo'>\u2b07 Lower</button></div>";
      } else if (gameId === "buzz") {
        h += "<div class='pp-seg'><button data-act='b-mode' data-v='7' class='" + (S.mode === "7" ? "on" : "") + "'>Buzz (7s)</button><button data-act='b-mode' data-v='fizz' class='" + (S.mode === "fizz" ? "on" : "") + "'>FizzBuzz</button></div>";
        h += turnLine(S.turn, " says\u2026");
        h += "<div class='pp-big' style='color:var(--acc)'>" + (S.revealed ? buzzAnswer(S.n) : "#" + S.n) + "</div>";
        h += "<div class='pp-muted' style='text-align:center'>" + (S.revealed ? "Correct answer for " + S.n : "Say the number \u2014 or the magic word") + " \u00b7 best run " + S.best + "</div>";
        h += "<button class='pp-btn alt' data-act='b-reveal'>" + (S.revealed ? "Hide answer" : "Reveal answer") + "</button>";
        h += "<div class='pp-row'><button class='pp-btn good' data-act='b-ok'>Correct \u2713</button><button class='pp-btn bad' data-act='b-bad'>Messed up \u2717</button></div>";
      } else if (gameId === "cats") {
        h += "<div class='pp-prompt'><small>Category</small>" + esc(CATEGORIES[S.order[S.pos % S.order.length]]) + "</div>";
        h += "<div id='pp-turn'>" + turnLine(S.turn, " is on the clock") + "</div>";
        h += "<div class='pp-timer' id='pp-timer'>" + Math.ceil(S.t) + "</div>";
        if (!S.running) {
          h += "<button class='pp-btn' data-act='c-start'>Start the clock</button><button class='pp-btn alt' data-act='c-new'>New category</button>";
        } else {
          h += "<div class='pp-row'><button class='pp-btn good' data-act='c-ok'>Got it \u2713</button><button class='pp-btn bad' data-act='c-bad'>Blanked \u2717</button></div>";
        }
      } else if (gameId === "bomb") {
        h += "<div class='pp-prompt'><small>Say one\u2026 then pass!</small>" + esc(CATEGORIES[S.order[S.pos % S.order.length]]) + "</div>";
        if (S.state === "idle") {
          h += "<div class='pp-bomb' id='pp-bomb'>\ud83d\udca3</div><button class='pp-btn' data-act='o-arm'>Arm the bomb</button><button class='pp-btn alt' data-act='o-new'>New category</button>";
        } else if (S.state === "live") {
          h += "<div class='pp-bomb' id='pp-bomb'>\ud83d\udca3</div><div class='pp-muted' style='text-align:center;font-size:16px'>Tick\u2026 tick\u2026 say one and PASS IT!</div>";
        } else {
          h += "<div class='pp-bomb'>\ud83d\udca5</div><div class='pp-turn'>BOOM!</div><div class='pp-label'>Who was holding it? (" + amount(2) + ")</div>" + chips(() => ({ act: "o-boom" }));
          h += "<button class='pp-btn alt' data-act='o-reset'>Skip</button>";
        }
      } else if (gameId === "wheel") {
        const n = N();
        const cols = ["#ffcf3d", "#ff5fa2", "#5fd4ff", "#b58cff", "#4dffa6", "#ff8a3d", "#ff4d6d", "#3dd6ff", "#f7ff5f", "#ff9ee0"];
        const segs = [];
        for (let i = 0; i < n; i++) segs.push(cols[i % cols.length] + " " + (i * 360 / n) + "deg " + ((i + 1) * 360 / n) + "deg");
        h += "<div class='pp-wheelwrap'><div class='pp-ptr'></div><div class='pp-wheel' id='pp-wheel' style='background:conic-gradient(" + segs.join(",") + ");transform:rotate(" + S.angle + "rad)'>";
        for (let i = 0; i < n; i++) h += "<div class='pp-wl' style='transform:rotate(" + ((i + 0.5) * 360 / n) + "deg)'><span>" + name(i) + "</span></div>";
        h += "</div></div>";
        if (S.result) h += "<div class='pp-card' style='text-align:center;font-weight:800;font-size:18px'>" + S.result + "</div>";
        if (S.pending) h += "<div class='pp-label'>" + S.pending.label + "</div>" + chips(i => (i === S.pending.who ? { cls: "out", act: "noop" } : { act: "w-pick" }));
        h += "<button class='pp-btn' data-act='w-spin'" + (S.spinning ? " disabled style='opacity:.5'" : "") + ">Spin!</button>";
      }
      return h;
    }

    function buzzAnswer(n) {
      if (S.mode === "fizz") {
        if (n % 15 === 0) return "FizzBuzz";
        if (n % 3 === 0) return "Fizz";
        if (n % 5 === 0) return "Buzz";
        return String(n);
      }
      return n % 7 === 0 || String(n).indexOf("7") >= 0 ? "BUZZ" : String(n);
    }

    // ---------------- actions ----------------
    function nextTurn(t) {
      return (t + 1) % N();
    }
    let prevScreen = "menu";
    function go(s) {
      if (s === "tally") prevScreen = screen;
      screen = s;
      render();
    }

    function act(a, el) {
      const i = el.dataset.i !== undefined ? Number(el.dataset.i) : -1;
      touched(a);
      switch (a) {
        case "noop": return;
        case "minus": if (N() > MIN_PLAYERS) { setup.count--; persist(); hap("light", true); render(); } return;
        case "plus": if (N() < MAX_PLAYERS) { setup.count++; persist(); hap("light", true); render(); } return;
        case "unit": setup.unit = el.dataset.v; persist(); hap("light", true); render(); return;
        case "go": setup._seen = true; persist(); gameId = null; hap("medium", true); go("menu"); return;
        case "setup": go("setup"); return;
        case "menu": gameId = null; go("menu"); return;
        case "tally": go("tally"); return;
        case "back": screen = prevScreen; render(); return;
        case "resettally": tallies = new Array(MAX_PLAYERS).fill(0); totalDrinks = 0; waterShown = 0; hap("medium", true); render(); return;
        case "open": initGame(el.dataset.id); hap("light", true); go("rules"); return;
        case "rules": go("rules"); return;
        case "play": S._live = true; hap("medium", true); go("play"); return;
        case "restart": initGame(gameId); S._live = true; hap("medium", true); go("play"); return;
      }
      keepScroll = true;
      // ----- per game -----
      if (a === "chip") {
        if (gameId === "nhie") {
          if (S.fingers[i] > 0) {
            S.fingers[i]--;
            if (S.fingers[i] === 0) {
              drink(i, 2, true);
              toast(setup.names[i] + " is out! " + verb() + " " + amount(2));
              hap("heavy", true);
            } else {
              drink(i, 1);
            }
          }
        } else if (gameId === "likely") {
          S.votes[i]++;
          S.result = "";
          hap("light", true);
        } else {
          drink(i, 1);
        }
      } else if (a === "k-draw") {
        if (!S.deck.length) S.deck = newDeck();
        S.card = S.deck.pop();
        S.mateSet = false;
        hap("medium", true);
        const r = S.card.r;
        if (r === "3") drink(S.turn, 1);
        else if (r === "A") drinkAll(1);
        else if (r === "5") S.thumb = S.turn;
        else if (r === "Q") S.qm = S.turn;
        else if (r === "K") {
          S.kings++;
          if (S.kings >= 4) {
            S.over = true;
            drink(S.turn, 4, true);
            toast(setup.names[S.turn] + " drinks the King's Cup! \ud83d\udc51");
            hap("error", true);
            ctx.platform.complete({ game: "kings" });
          } else {
            toast("King #" + S.kings + " \u2014 add to the cup!");
          }
        }
      } else if (a === "k-mate") {
        S.mates = S.mates.filter(([x, y]) => x !== S.turn && y !== S.turn);
        S.mates.push([S.turn, i]);
        S.mateSet = true;
        toast(setup.names[S.turn] + " \ud83e\udd1d " + setup.names[i] + " are mates");
        hap("success", true);
      } else if (a === "k-rule") {
        const inp = root.querySelector("#pp-rule");
        const v = (inp ? inp.value : S.draft).trim();
        if (v) {
          S.rules.push(v.slice(0, 80));
          S.draft = "";
          hap("success", true);
        }
      } else if (a === "k-next") {
        S.card = null;
        S.turn = nextTurn(S.turn);
        hap("light", true);
      } else if (a === "n-next") {
        S.pos++;
        hap("light", true);
      } else if (a === "n-reset") {
        S.fingers = new Array(N()).fill(3);
        hap("medium", true);
      } else if (a === "l-next") {
        S.pos++;
        S.votes = new Array(N()).fill(0);
        S.result = "";
        hap("light", true);
      } else if (a === "l-reveal") {
        const max = Math.max(...S.votes.slice(0, N()));
        if (max <= 0) {
          toast("Tap names to count the votes first");
        } else {
          const losers = [];
          for (let k = 0; k < N(); k++) if (S.votes[k] === max) losers.push(k);
          losers.forEach(k => drink(k, max, true));
          S.result = losers.map(k => name(k)).join(" & ") + " " + (losers.length > 1 ? (sober() ? "take " : "drink ") : verb() + " ") + amount(max) + (losers.length > 1 ? " each" : "") + " \ud83c\udf7a";
          hap("heavy", true);
        }
      } else if (a === "t-ans" || a === "t-drink" || a === "t-skip") {
        if (a === "t-drink") drink(S.turn, 2);
        if (a !== "t-skip") S.turn = nextTurn(S.turn);
        S.pos++;
        hap("light", true);
      } else if (a === "h-hi" || a === "h-lo") {
        if (!S.deck.length) S.deck = newDeck();
        const next = S.deck.pop();
        const right = a === "h-hi" ? next.v > S.card.v : next.v < S.card.v;
        const prevCard = S.card;
        S.card = next;
        if (right) {
          S.streak++;
          hap("success", true);
          if (S.streak >= 3) {
            S.result = "\u2705 " + next.r + next.s + " \u2014 three in a row! " + name(S.turn) + " passes safely.";
            S.streak = 0;
            S.turn = nextTurn(S.turn);
          } else {
            S.result = "\u2705 " + prevCard.r + prevCard.s + " \u2192 " + next.r + next.s + " \u2014 keep going!";
          }
        } else {
          const n = S.streak + 1;
          S.result = "\u274c " + prevCard.r + prevCard.s + " \u2192 " + next.r + next.s + (next.v === prevCard.v ? " (same!)" : "") + " \u2014 " + name(S.turn) + " " + verb() + " " + amount(n);
          drink(S.turn, n, true);
          hap("error", true);
          S.streak = 0;
          S.turn = nextTurn(S.turn);
        }
      } else if (a === "b-mode") {
        S.mode = el.dataset.v;
        S.n = 1;
        S.revealed = false;
      } else if (a === "b-reveal") {
        S.revealed = !S.revealed;
        hap("light", true);
      } else if (a === "b-ok") {
        S.n++;
        S.best = Math.max(S.best, S.n - 1);
        S.revealed = false;
        S.turn = nextTurn(S.turn);
        hap(buzzAnswer(S.n - 1) !== String(S.n - 1) ? "medium" : "light", true);
      } else if (a === "b-bad") {
        drink(S.turn, 1);
        toast(setup.names[S.turn] + " " + verb() + " " + amount(1) + " \u2014 back to 1!");
        S.n = 1;
        S.revealed = false;
        S.turn = nextTurn(S.turn);
      } else if (a === "c-start") {
        S.running = true;
        S.t = tune("cat_seconds", 5);
        S.lastSec = -1;
        hap("medium", true);
      } else if (a === "c-ok") {
        S.turn = nextTurn(S.turn);
        S.t = tune("cat_seconds", 5);
        S.lastSec = -1;
        hap("light", true);
      } else if (a === "c-bad") {
        catsFail();
        return;
      } else if (a === "c-new") {
        S.pos++;
        hap("light", true);
      } else if (a === "o-arm") {
        S.state = "live";
        S.fuse = 12 + Math.random() * 33;
        S.t = 0;
        S.nextTick = 0;
        hap("heavy", true);
      } else if (a === "o-new") {
        S.pos++;
      } else if (a === "o-boom") {
        drink(i, 2);
        S.state = "idle";
        S.pos++;
      } else if (a === "o-reset") {
        S.state = "idle";
        S.pos++;
      } else if (a === "w-spin") {
        if (S.spinning) return;
        S.spinning = true;
        S.vel = 14 + Math.random() * 10;
        S.result = null;
        S.pending = null;
        hap("medium", true);
      } else if (a === "w-pick") {
        const p = S.pending;
        if (p.kind === "give") {
          drink(i, p.n);
        } else if (p.kind === "mate") {
          drink(p.who, 1, true);
          drink(i, 1, true);
          toast(setup.names[p.who] + " & " + setup.names[i] + " " + (sober() ? "take " : "drink ") + amount(1));
          hap("medium", true);
        }
        S.pending = null;
      }
      render();
    }

    function catsFail() {
      S.running = false;
      drink(S.turn, 1);
      hap("error", true);
      S.turn = nextTurn(S.turn);
      S.t = tune("cat_seconds", 5);
      keepScroll = true;
      render();
    }

    function wheelLanded() {
      const n = N();
      const seg = (Math.PI * 2) / n;
      const local = ((-S.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const who = Math.floor(local / seg) % n;
      const action = WHEEL_ACTIONS[Math.floor(Math.random() * WHEEL_ACTIONS.length)];
      const k = 1 + Math.floor(Math.random() * 3);
      const nm = name(who);
      let text = nm + " " + action.t.replace("{n}", amount(k));
      if (sober()) text = text.replace("drinks", "takes").replace(" drink ", " take ");
      S.result = text;
      if (action.kind === "self") drink(who, k, true);
      else if (action.kind === "left") { drink(who, k, true); drink((who + 1) % n, k, true); S.result = nm + " and " + name((who + 1) % n) + " " + (sober() ? "take " : "drink ") + amount(k); }
      else if (action.kind === "waterfall") S.result = nm + " starts a waterfall \u2014 everyone drinks until the person before them stops!";
      else if (action.kind === "give") S.pending = { kind: "give", who, n: k, label: "Who does " + nm + " give " + amount(k) + " to?" };
      else if (action.kind === "mate") S.pending = { kind: "mate", who, n: 1, label: "Pick " + nm + "'s drinking buddy" };
      hap("success", true);
      keepScroll = true;
      render();
    }

    // ---------------- events ----------------
    ctx.listen(root, "click", e => {
      const el = e.target && e.target.closest ? e.target.closest("[data-act]") : null;
      if (!el || el.disabled) return;
      act(el.dataset.act, el);
    });
    ctx.listen(root, "input", e => {
      const t = e.target;
      if (!t || !t.dataset) return;
      if (t.dataset.name !== undefined) {
        setup.names[Number(t.dataset.name)] = t.value.slice(0, 18) || "Player " + (Number(t.dataset.name) + 1);
        persist();
      } else if (t.id === "pp-rule") {
        S.draft = t.value;
      }
    });

    // ---------------- timers (categories, bomb, wheel) ----------------
    ctx.game.loop({
      update(dtMs) {
        if (screen !== "play") return;
        const dt = Math.min(0.1, dtMs / 1000);
        if (gameId === "cats" && S.running) {
          S.t -= dt;
          const el = root.querySelector("#pp-timer");
          const sec = Math.ceil(Math.max(0, S.t));
          if (el) {
            el.textContent = sec;
            el.className = "pp-timer" + (S.t < 2 ? " hot" : "");
          }
          if (sec !== S.lastSec) {
            S.lastSec = sec;
            if (sec <= 2 && sec > 0) hap("medium");
            else if (sec > 0) hap("light");
          }
          const tl = root.querySelector("#pp-turn");
          if (tl && tl.dataset.t !== String(S.turn)) {
            tl.dataset.t = String(S.turn);
          }
          if (S.t <= 0) catsFail();
        } else if (gameId === "bomb" && S.state === "live") {
          S.t += dt;
          const frac = Math.min(1, S.t / S.fuse);
          const interval = 0.95 - 0.8 * frac;
          if (S.t >= S.nextTick) {
            S.nextTick = S.t + interval;
            S.pulse = 1;
            hap(frac > 0.7 ? "medium" : "light", true);
          }
          S.pulse = Math.max(0, S.pulse - dt * 6);
          const b = root.querySelector("#pp-bomb");
          if (b) b.style.transform = "scale(" + (1 + S.pulse * (0.12 + 0.2 * frac)) + ") rotate(" + (Math.sin(S.t * 30) * 6 * frac) + "deg)";
          if (S.t >= S.fuse) {
            S.state = "boom";
            hap("heavy", true);
            ctx.timeout(() => hap("error", true), 120);
            keepScroll = true;
            render();
          }
        } else if (gameId === "wheel" && S.spinning) {
          S.angle += S.vel * dt;
          S.vel *= Math.pow(0.42, dt);
          const n = N();
          const seg = (Math.PI * 2) / n;
          const local = ((-S.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
          const idx = Math.floor(local / seg);
          if (idx !== S.idx) {
            S.idx = idx;
            hap("light");
          }
          const w = root.querySelector("#pp-wheel");
          if (w) w.style.transform = "rotate(" + S.angle + "rad)";
          if (S.vel < 0.35) {
            S.spinning = false;
            wheelLanded();
          }
        }
      }
    });

    ctx.onResize(() => { if (screen !== "setup") render(); });
    render();
    ctx.platform.ready();
  }
};
