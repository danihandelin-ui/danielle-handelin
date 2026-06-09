/* DNA TRAVELS — NYC */
(function () {
  const PLACES = window.__PLACES__ || [];
  let catalogFromFile = [];
  const POD_PLACE_ID = '/g/11g9vt9zm3';
  const DURATIONS = [15, 30, 45, 60, 75, 90, 105, 120, 150, 180, 210, 240, 300, 360, 420, 480];
  const MAX_DURATION = 720;
  const DEFAULT_DAY_START_TIME = '08:00';
  const DEFAULT_DAY_END_TIME = '22:00';
  const STORAGE_KEY = 'dna-travels-nyc-v6';
  const DRAG_MIME = 'application/x-dna-travels';
  const DEFAULT_HOME = POD_PLACE_ID;
  const DEFAULT_MAPS_LIST_URL = 'https://maps.app.goo.gl/SJWZdZ3FnuYX69Ri6';
  const DEFAULT_FERRY_SITE_URL = 'https://www.ferry.nyc/routes-and-schedules/';
  const DEFAULT_FERRY_PASS_URL = 'https://www.ferry.nyc/tickets/';
  const LIVE_FERRY_ENDPOINTS = ['https://subwayinfo.nyc/api/ferry/arrivals'];
  const DEFAULT_LOCATION = { city: 'New York', state: 'NY', country: 'USA' };
  const NYC_AIRPORTS = [
    { id: '', label: '— Airport —' },
    { id: 'JFK', label: 'JFK (Kennedy)' },
    { id: 'LGA', label: 'LGA (LaGuardia)' },
    { id: 'EWR', label: 'EWR (Newark)' },
    { id: 'OTHER', label: 'Other…' },
  ];
  const POOR_RATING_MAX = 2;

  let state;
  let selectedPlaceId = null;
  let selectedDayId = null;
  let expandedDayId = null;
  let plannerPage = 'calendar';
  let dragPayload = null;
  let reviewTarget = null;
  let reviewCheckTimer = null;
  let pendingReviewRating = 0;
  let liveFerryState = { loading: false, fetchedAt: 0, items: [], error: '' };

  const CAT_LABELS = {
    restaurant: 'Restaurant',
    museum: 'Museum',
    park: 'Park',
    shopping: 'Shopping',
    coffee: 'Coffee & breakfast',
    destination: 'Destination',
    other: 'Other',
  };
  const CAT_EMOJIS = {
    restaurant: '🍽️',
    museum: '🎨',
    park: '🌳',
    shopping: '🛍️',
    coffee: '☕',
    destination: '✨',
    other: '📌',
  };
  const CAT_ORDER = ['coffee', 'restaurant', 'destination', 'museum', 'park', 'shopping', 'other'];
  const HIDDEN_STREETS = [
    {
      id: 'hidden-washington-mews',
      name: 'Washington Mews',
      address: 'Washington Mews, New York, NY',
      neighborhood: 'Greenwich Village',
      lat: 40.7316,
      lng: -73.9967,
      duration: 30,
      category: 'destination',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Washington%20Mews%20NYC',
    },
    {
      id: 'hidden-staple-street',
      name: 'Staple Street Skybridge',
      address: 'Staple St, New York, NY 10013',
      neighborhood: 'Tribeca',
      lat: 40.7192,
      lng: -74.0089,
      duration: 25,
      category: 'destination',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Staple%20Street%20Skybridge',
    },
    {
      id: 'hidden-freeman-alley',
      name: 'Freeman Alley',
      address: 'Freeman Alley, New York, NY 10002',
      neighborhood: 'Lower East Side',
      lat: 40.7211,
      lng: -73.9923,
      duration: 30,
      category: 'destination',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Freeman%20Alley%20NYC',
    },
    {
      id: 'hidden-st-lukes-place',
      name: "St. Luke's Place",
      address: "St Luke's Pl, New York, NY 10014",
      neighborhood: 'West Village',
      lat: 40.7312,
      lng: -74.0027,
      duration: 25,
      category: 'destination',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=St%20Luke%27s%20Place%20NYC',
    },
  ];
  const FERRY_ROUTES = [
    {
      id: 'ferry-east-river',
      route: 'East River',
      terminal: 'North Williamsburg',
      lat: 40.7216,
      lng: -73.9630,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      id: 'ferry-south-brooklyn',
      route: 'South Brooklyn',
      terminal: 'DUMBO / Fulton Ferry',
      lat: 40.7033,
      lng: -73.9940,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    },
    {
      id: 'ferry-astoria',
      route: 'Astoria',
      terminal: 'E 90 St',
      lat: 40.7772,
      lng: -73.9439,
      weekdays: [1, 2, 3, 4, 5],
    },
    {
      id: 'ferry-governors-island',
      route: 'Governors Island',
      terminal: 'Battery Maritime Building',
      lat: 40.7018,
      lng: -74.0126,
      weekdays: [5, 6, 0],
    },
  ];

  const PLACE_CATEGORY_OVERRIDES = {
    '/m/01nbpn': 'destination',
    '/m/0pnb8': 'destination',
    '/g/11b7h5lb_c': 'shopping',
    '/g/11svrcyv2w': 'museum',
    '/g/11g9vt9zm3': 'other',
    '/g/11y8mzlcgn': 'coffee',
    '/g/1tfk0ryg': 'restaurant',
    '/g/11yvg27r3x': 'coffee',
    '/g/11w_fpbhvj': 'coffee',
    '/m/0gjdwm1': 'restaurant',
    '/g/11h0blkcdg': 'restaurant',
    '/g/1tcv775w': 'shopping',
    '/g/11flgglh27': 'destination',
    '/g/11fl78mh38': 'restaurant',
    '/g/1hc12738k': 'destination',
    '/g/11c2p86qdl': 'other',
  };

  function getCatalogPlaces() {
    if (state?.mapsPlaces?.length) return state.mapsPlaces;
    if (catalogFromFile.length) return catalogFromFile;
    return PLACES;
  }

  async function loadCatalogFromFile() {
    try {
      const res = await fetch('./places.json', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return;
      catalogFromFile = data;
      if (!state.mapsPlaces?.length && data.length >= PLACES.length) {
        state.mapsPlaces = data;
        state.mapsPlacesSyncedUrl = state.mapsPlacesSyncedUrl || state.mapsListUrl;
        saveState();
      }
    } catch (e) {
      /* file:// or offline */
    }
  }

  function applyMapsPlaces(places, url) {
    if (!Array.isArray(places) || !places.length) return;
    state.mapsPlaces = places;
    state.mapsPlacesSyncedUrl = url || state.mapsListUrl;
    catalogFromFile = places;
    saveState();
  }

  async function syncMapsListFromUrl(url, opts) {
    const options = opts || {};
    const listUrl = (url || state.mapsListUrl || '').trim();
    if (!listUrl) {
      if (!options.quiet) toast('Add your Google Maps list link on the Plan screen');
      return false;
    }
    if (!isMapsListUrl(listUrl)) {
      if (!options.quiet) toast('Use a Google Maps share link');
      return false;
    }
    const btn = document.getElementById('btn-sync-maps');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Syncing…';
    }
    try {
      const res = await fetch('/api/sync-maps-list?url=' + encodeURIComponent(listUrl));
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(
          data.error || 'Sync needs the local server — run ./start.sh in the NYC folder'
        );
      }
      applyMapsPlaces(data.places, listUrl);
      populateHomeSelects();
      if (!options.quiet) {
        toast(
          'Backlog updated — ' +
            data.count +
            ' places' +
            (data.listName ? ' from “' + data.listName + '”' : '')
        );
      }
      if (document.getElementById('planner').classList.contains('active')) renderAll();
      return true;
    } catch (e) {
      if (!options.quiet) toast(e.message || 'Could not refresh from Maps');
      return false;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Refresh from Maps';
      }
    }
  }

  async function init() {
    state = loadState();
    migrateBlocks();
    migrateNeverAgain();
    initDurationSelects();
    await loadCatalogFromFile();
    populateHomeSelects();
    bindLanding();
    bindPlannerChrome();
    bindReviewUI();
    startReviewChecks();

    ensureDaysMatchTrip();
    showLanding();
  }

  function defaultHomeBase() {
    const p = getCatalogPlaces().find(x => x.placeId === DEFAULT_HOME);
    return p ? { placeId: p.placeId, name: p.name } : { placeId: DEFAULT_HOME, name: 'Pod Brooklyn Hotel' };
  }

  function emptyFlightLeg() {
    return { airport: '', airportOther: '', date: '', depTime: '', arrTime: '', flightNumber: '' };
  }

  function defaultFlights() {
    return { arrival: emptyFlightLeg(), departure: emptyFlightLeg() };
  }

  function normalizeFlights(flights) {
    const base = defaultFlights();
    if (!flights || typeof flights !== 'object') return base;
    for (const key of ['arrival', 'departure']) {
      const leg = flights[key];
      if (!leg || typeof leg !== 'object') continue;
      // Migrate older single `time` field: arrival → landing, departure → takeoff.
      const legacyTime = String(leg.time || '').trim();
      base[key] = {
        airport: String(leg.airport || '').trim(),
        airportOther: String(leg.airportOther || '').trim(),
        date: String(leg.date || '').trim(),
        depTime: String(leg.depTime || (key === 'departure' ? legacyTime : '') || '').trim(),
        arrTime: String(leg.arrTime || (key === 'arrival' ? legacyTime : '') || '').trim(),
        flightNumber: String(leg.flightNumber || leg.confirmation || '').trim(),
      };
    }
    return base;
  }

  function airportLabel(leg) {
    if (!leg) return '';
    if (leg.airport === 'OTHER') return leg.airportOther || 'Other airport';
    const preset = NYC_AIRPORTS.find(a => a.id === leg.airport);
    return preset?.label?.replace(/\s*\([^)]*\)\s*/, '') || leg.airport || '';
  }

  function legHasDetails(leg) {
    return !!(leg?.date || leg?.airport || leg?.airportOther || leg?.flightNumber || leg?.depTime || leg?.arrTime);
  }

  function clockLabel(timeStr) {
    if (!timeStr) return '';
    const [hh, mm] = String(timeStr).split(':').map(Number);
    const t = new Date();
    t.setHours(hh || 0, mm || 0, 0, 0);
    return t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  function flightTimeRangeLabel(leg) {
    const dep = clockLabel(leg?.depTime);
    const arr = clockLabel(leg?.arrTime);
    if (dep && arr) return dep + '–' + arr;
    return dep || arr || '';
  }

  function formatFlightLeg(prefix, leg) {
    if (!legHasDetails(leg)) return '';
    const ap = airportLabel(leg);
    const parts = [prefix];
    if (ap) parts.push(ap);
    if (leg.flightNumber) parts.push(leg.flightNumber);
    if (leg.date) {
      const d = new Date(leg.date + 'T12:00:00');
      let when = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const range = flightTimeRangeLabel(leg);
      if (range) when += ' · ' + range;
      parts.push(when);
    }
    return parts.join(' · ');
  }

  function flightsHaveDetails(flights) {
    const f = flights || state.flights;
    if (!f) return false;
    return legHasDetails(f.arrival) || legHasDetails(f.departure);
  }

  function airportSelectOptions(selected) {
    return NYC_AIRPORTS.map(
      a => `<option value="${attr(a.id)}"${a.id === selected ? ' selected' : ''}>${esc(a.label)}</option>`
    ).join('');
  }

  function readFlightLegFromForm(prefix) {
    const airport = document.getElementById('landing-' + prefix + '-airport')?.value || '';
    const airportOther = document.getElementById('landing-' + prefix + '-airport-other')?.value.trim() || '';
    const date = document.getElementById('landing-' + prefix + '-date')?.value || '';
    const depTime = document.getElementById('landing-' + prefix + '-dep')?.value || '';
    const arrTime = document.getElementById('landing-' + prefix + '-arr')?.value || '';
    const flightNumber = document.getElementById('landing-' + prefix + '-flightno')?.value.trim() || '';
    return { airport, airportOther, date, depTime, arrTime, flightNumber };
  }

  function fillFlightLegForm(prefix, leg) {
    const ap = document.getElementById('landing-' + prefix + '-airport');
    const other = document.getElementById('landing-' + prefix + '-airport-other');
    const date = document.getElementById('landing-' + prefix + '-date');
    const dep = document.getElementById('landing-' + prefix + '-dep');
    const arr = document.getElementById('landing-' + prefix + '-arr');
    const flightno = document.getElementById('landing-' + prefix + '-flightno');
    if (ap) ap.value = leg?.airport || '';
    if (other) other.value = leg?.airportOther || '';
    if (date) date.value = leg?.date || '';
    if (dep) dep.value = leg?.depTime || '';
    if (arr) arr.value = leg?.arrTime || '';
    if (flightno) flightno.value = leg?.flightNumber || '';
    syncFlightOtherField(prefix);
  }

  function syncFlightOtherField(prefix) {
    const ap = document.getElementById('landing-' + prefix + '-airport');
    const other = document.getElementById('landing-' + prefix + '-airport-other');
    if (!ap || !other) return;
    const show = ap.value === 'OTHER';
    other.hidden = !show;
    other.required = show;
  }

  function bindFlightAirportToggles() {
    ['arrival', 'departure'].forEach(prefix => {
      const ap = document.getElementById('landing-' + prefix + '-airport');
      if (!ap || ap.dataset.bound) return;
      ap.dataset.bound = '1';
      ap.addEventListener('change', () => syncFlightOtherField(prefix));
    });
  }

  function parseTimeToHour(timeStr) {
    if (!timeStr) return 8;
    const [hh, mm] = String(timeStr).split(':').map(Number);
    return (hh || 0) + (mm || 0) / 60;
  }

  function getDaySchedule() {
    const start = parseTimeToHour(state?.dayStartTime || DEFAULT_DAY_START_TIME);
    let end = parseTimeToHour(state?.dayEndTime || DEFAULT_DAY_END_TIME);
    if (end <= start) end = start + 14;
    return { start, end };
  }

  function getScheduleHours() {
    const { start, end } = getDaySchedule();
    const startH = Math.floor(start);
    const endH = Math.max(startH + 1, Math.ceil(end));
    return Array.from({ length: endH - startH }, (_, i) => startH + i);
  }

  function timelineSlotCount() {
    return getScheduleHours().length;
  }

  function hourToTimelineTop(hour) {
    return (hour - getDaySchedule().start) * 60;
  }

  function timeStrToHour(time) {
    return parseTimeToHour(time);
  }

  function rangesOverlap(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function flightLegTag(leg) {
    return leg?.flightNumber ? ' · ' + leg.flightNumber : '';
  }

  function getFlightReservationsForDay(dayDate) {
    const reservations = [];
    const f = state.flights || defaultFlights();
    const { start: dayStart, end: dayEnd } = getDaySchedule();

    // Arrival day: block everything from the start of the day until the flight lands.
    if (f.arrival?.date === dayDate) {
      const ap = airportLabel(f.arrival);
      const landTime = f.arrival.arrTime || f.arrival.depTime;
      const tag = (ap ? ' · ' + ap : '') + flightLegTag(f.arrival);
      if (landTime) {
        const landed = timeStrToHour(landTime);
        reservations.push({
          id: 'flight-arrival',
          label: '✈️ Before arrival' + tag + ' · lands ' + clockLabel(landTime),
          start: dayStart,
          end: Math.max(Math.min(landed, dayEnd), dayStart + 0.25),
          kind: 'arrival',
        });
      } else {
        reservations.push({
          id: 'flight-arrival',
          label: '✈️ Arrival day' + tag,
          start: dayStart,
          end: dayEnd,
          kind: 'arrival',
        });
      }
    }

    // Departure day: block everything from take-off until the end of the day.
    if (f.departure?.date === dayDate) {
      const ap = airportLabel(f.departure);
      const offTime = f.departure.depTime || f.departure.arrTime;
      const tag = (ap ? ' · ' + ap : '') + flightLegTag(f.departure);
      if (offTime) {
        const off = timeStrToHour(offTime);
        reservations.push({
          id: 'flight-departure',
          label: '🛫 After departure' + tag + ' · takes off ' + clockLabel(offTime),
          start: Math.min(Math.max(off, dayStart), dayEnd - 0.25),
          end: dayEnd,
          kind: 'departure',
        });
      } else {
        reservations.push({
          id: 'flight-departure',
          label: '🛫 Departure day' + tag,
          start: dayStart,
          end: dayEnd,
          kind: 'departure',
        });
      }
    }
    return reservations;
  }

  function hourSlotBlocked(dayDate, hour) {
    const slotStart = hour;
    const slotEnd = hour + 1;
    return getFlightReservationsForDay(dayDate).some(r =>
      rangesOverlap(slotStart, slotEnd, r.start, r.end)
    );
  }

  function blockTimeBlocked(dayDate, hour, durationMins) {
    if (hour == null) return false;
    const start = hour;
    const end = hour + (durationMins || 60) / 60;
    return getFlightReservationsForDay(dayDate).some(r => rangesOverlap(start, end, r.start, r.end));
  }

  function flightBlockReason(dayDate, hour, durationMins) {
    const start = hour;
    const end = hour + (durationMins || 60) / 60;
    const hit = getFlightReservationsForDay(dayDate).find(r => rangesOverlap(start, end, r.start, r.end));
    return hit ? hit.label : '';
  }

  function mapsSearchUrl(name, address) {
    const q = [name, address, state.location?.city || 'New York'].filter(Boolean).join(', ');
    return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q);
  }

  function migrateBlocks() {
    state.days?.forEach(d => {
      (d.blocks || []).forEach(b => {
        if (b.hour === undefined) b.hour = null;
        if (!b.review) b.review = null;
      });
    });
  }

  function migrateNeverAgain() {
    state.neverAgain = state.neverAgain || {};
    state.days?.forEach(d => {
      d.blocks?.forEach(b => {
        if (b.review?.rating && b.review.rating <= POOR_RATING_MAX) {
          registerNeverAgain(b.placeId, b.review);
        }
      });
    });
  }

  function isPoorRating(rating) {
    return rating > 0 && rating <= POOR_RATING_MAX;
  }

  function neverAgainIds() {
    return new Set(Object.keys(state.neverAgain || {}));
  }

  function registerNeverAgain(placeId, review) {
    if (!placeId || !isPoorRating(review?.rating)) return;
    state.neverAgain = state.neverAgain || {};
    state.neverAgain[placeId] = {
      rating: review.rating,
      note: review.note || '',
      at: review.at || new Date().toISOString(),
    };
  }

  function getNeverAgainActivities() {
    return Object.keys(state.neverAgain || {})
      .map(id => getActivity(id))
      .filter(Boolean);
  }

  function normalizePlaceName(name) {
    return (name || '')
      .toLowerCase()
      .replace(/[''`]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  function dedupeActivities(list) {
    const seenId = new Set();
    const seenLoc = new Set();
    const out = [];
    for (const a of list) {
      const id = activityId(a);
      if (seenId.has(id)) continue;
      const nameKey = normalizePlaceName(a.name);
      const locKey =
        a.lat != null && a.lng != null
          ? nameKey + '@' + Math.round(a.lat * 2000) + ',' + Math.round(a.lng * 2000)
          : nameKey;
      if (seenLoc.has(locKey)) continue;
      seenId.add(id);
      seenLoc.add(locKey);
      out.push(a);
    }
    return out;
  }

  function getCategory(a) {
    const id = activityId(a);
    if (PLACE_CATEGORY_OVERRIDES[id]) return PLACE_CATEGORY_OVERRIDES[id];
    if (a?.category && CAT_LABELS[a.category]) return a.category;

    const name = (a?.name || '').toLowerCase();
    const hood = (a?.neighborhood || '').toLowerCase();

    if (/^little italy$|^chinatown$/.test(name.trim())) return 'destination';
    if (/\bfood truck\b/.test(name)) return 'restaurant';

    if (
      /coffee|espresso|café|cafe|roaster|roasters|qahwah|devoci|bagel|bakery|donut|doughnut|pastry|pastries|zeppola|brunch|diner\b|tick tock|glace|panna|moonrise|best bagel|radio bakery|funny face|pastry box|salt bread|i'm donut|hungry ghost|beanmonger|driftaway|sey coffee|blue bottle|obscure coffee|qahwah house|sunday morning|rhythm zero|papa d'amour|caffè panna|caffe panna/.test(
        name
      )
    )
      return 'coffee';

    if (
      /pizza|pizzeria|dumpling|restaurant|grill|grille|kitchen|hotpot|paella|tapas|burrito|taco|halal|souvlaki|sandwich|brisket|soba|soothr|thai|mexican|jazz|lounge|comedy|noodle|ramen|sushi|birria|katz|margon|palma|sirrah|umeko|or.?esh|le crocodile|rule of third|sixty three|santa fe|super taste|fu zhou|jin mei|xiang|maison premiere|pearl box|edith|salt hank|tony dragon|adel|luigi|jonny|john.?s|bleecker|juliana|l.?industrie|mama.?s|pugsley|tommy|mano.?s|rosario|philomena|cello|lucia|pasta bar|pasta de|time out market|night market|milano market|spumoni|t[ií]a julia|canticles|super burrito|nellie|taste of|a pasta|zeppola|candy shop|bar\b|bistro|taqueria|izakaya|dim sum|wok|eatery|food hall/.test(
        name
      )
    )
      return 'restaurant';

    if (/museum|library|gallery|photobooth|autophoto|morgan|snfl|stavros niarchos|city hall station/.test(name))
      return 'museum';

    if (
      /\bpark\b|carousel|greenacre|bethesda terrace|wagner jr|little island|seaglass/.test(name) &&
      !/market|pizza|book|food|coffee|restaurant|hotel/i.test(name)
    )
      return 'park';

    if (/bookstore|book store|strand|barnes|noble|harry potter shop|industrial plaza/.test(name))
      return 'shopping';

    if (/tramway|pier \d+|old city hall/.test(name)) return 'destination';

    if (/\bhotel\b|pod brooklyn/.test(name)) return 'other';

    return 'other';
  }

  function catClass(a) {
    return 'cat-' + getCategory(a);
  }

  function catLabel(a) {
    return CAT_LABELS[getCategory(a)];
  }

  function catEmoji(a) {
    return CAT_EMOJIS[getCategory(a)];
  }

  function renderCatLegend() {
    const el = document.getElementById('cat-legend');
    if (!el) return;
    el.innerHTML = Object.entries(CAT_LABELS)
      .map(([k, label]) => `<span class="cat-${k} cat-badge">${label}</span>`)
      .join('');
  }

  function loadState() {
    try {
      for (const key of [STORAGE_KEY, 'dna-travels-nyc-v5', 'dna-travels-nyc-v4', 'dna-travels-nyc-plan-v3']) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const s = JSON.parse(raw);
        s.customPlaces = s.customPlaces || [];
        s.mapsPlaces = s.mapsPlaces || [];
        s.mapsPlacesSyncedUrl = s.mapsPlacesSyncedUrl || '';
        s.homeBase = s.homeBase || defaultHomeBase();
        s.backlogView = s.backlogView || 'all';
        s.mapsListUrl = s.mapsListUrl || DEFAULT_MAPS_LIST_URL;
        s.ferrySiteUrl = s.ferrySiteUrl || DEFAULT_FERRY_SITE_URL;
        s.location = s.location || { ...DEFAULT_LOCATION };
        s.neverAgain = s.neverAgain || {};
        s.flights = normalizeFlights(s.flights);
        s.dayStartTime = s.dayStartTime || DEFAULT_DAY_START_TIME;
        s.dayEndTime = s.dayEndTime || DEFAULT_DAY_END_TIME;
        s.stay = s.stay || { name: '', checkinDate: '', checkinTime: '15:00', checkoutDate: '', checkoutTime: '11:00' };
        s.googlePlacesKey = s.googlePlacesKey || '';
        if (!s.tripEnd && s.tripStart && s.days?.length)
          s.tripEnd = s.days[s.days.length - 1]?.date || s.tripStart;
        if (key !== STORAGE_KEY && s.days?.length && s.tripStart) s.onboarded = true;
        if (s.onboarded == null) s.onboarded = !!(s.tripStart && s.tripEnd);
        return s;
      }
    } catch (e) {
      console.error(e);
    }
    const today = todayStr();
    return {
      onboarded: false,
      tripStart: today,
      tripEnd: addDays(today, 3),
      homeBase: defaultHomeBase(),
      customPlaces: [],
      mapsPlaces: [],
      mapsPlacesSyncedUrl: '',
      days: [],
      backlogView: 'all',
      mapsListUrl: DEFAULT_MAPS_LIST_URL,
      ferrySiteUrl: DEFAULT_FERRY_SITE_URL,
      location: { ...DEFAULT_LOCATION },
      flights: defaultFlights(),
      dayStartTime: DEFAULT_DAY_START_TIME,
      dayEndTime: DEFAULT_DAY_END_TIME,
      neverAgain: {},
      stay: { name: '', checkinDate: '', checkinTime: '15:00', checkoutDate: '', checkoutTime: '11:00' },
      googlePlacesKey: '',
    };
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      toast('Could not save');
    }
  }

  function getHome() {
    const id = state.homeBase?.placeId || DEFAULT_HOME;
    return getActivity(id) || PLACES.find(p => p.placeId === DEFAULT_HOME);
  }

  function distMi(a, b) {
    if (!a?.lat || !b?.lat) return 99;
    const R = 3959;
    const la1 = (a.lat * Math.PI) / 180;
    const la2 = (b.lat * Math.PI) / 180;
    const dLa = ((b.lat - a.lat) * Math.PI) / 180;
    const dLo = ((b.lng - a.lng) * Math.PI) / 180;
    const x = Math.sin(dLa / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLo / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(x)) * 10) / 10;
  }

  function distFromHome(place) {
    return distMi(place, getHome());
  }

  function formatLocation(loc) {
    if (!loc) return '';
    return [loc.city, loc.state, loc.country].filter(Boolean).join(', ');
  }

  function isMapsListUrl(url) {
    try {
      const u = new URL(url.trim());
      const host = u.hostname.replace(/^www\./, '');
      return (
        host === 'maps.app.goo.gl' ||
        host === 'goo.gl' ||
        host === 'google.com' ||
        host.endsWith('.google.com')
      );
    } catch (e) {
      return false;
    }
  }

  function showLanding() {
    document.getElementById('landing').classList.add('active');
    document.getElementById('planner').classList.remove('active');
    const loc = state.location || DEFAULT_LOCATION;
    document.getElementById('landing-city').value = loc.city || '';
    document.getElementById('landing-state').value = loc.state || '';
    document.getElementById('landing-country').value = loc.country || '';
    document.getElementById('landing-maps-list').value = state.mapsListUrl || DEFAULT_MAPS_LIST_URL;
    const ferryInput = document.getElementById('landing-ferry-site');
    if (ferryInput) ferryInput.value = state.ferrySiteUrl || DEFAULT_FERRY_SITE_URL;
    document.getElementById('landing-start').value = state.tripStart || todayStr();
    document.getElementById('landing-end').value = state.tripEnd || addDays(state.tripStart || todayStr(), 3);
    const sel = document.getElementById('landing-home');
    if (sel) sel.value = state.homeBase?.placeId || DEFAULT_HOME;
    const flights = state.flights || defaultFlights();
    fillFlightLegForm('arrival', flights.arrival);
    fillFlightLegForm('departure', flights.departure);
    bindFlightAirportToggles();
    const dayStartEl = document.getElementById('landing-day-start');
    const dayEndEl = document.getElementById('landing-day-end');
    if (dayStartEl) dayStartEl.value = state.dayStartTime || DEFAULT_DAY_START_TIME;
    if (dayEndEl) dayEndEl.value = state.dayEndTime || DEFAULT_DAY_END_TIME;
    const stay = state.stay || {};
    const f = id => document.getElementById(id);
    if (f('landing-stay-name')) f('landing-stay-name').value = stay.name || '';
    if (f('landing-stay-checkin-date')) f('landing-stay-checkin-date').value = stay.checkinDate || '';
    if (f('landing-stay-checkin-time')) f('landing-stay-checkin-time').value = stay.checkinTime || '15:00';
    if (f('landing-stay-checkout-date')) f('landing-stay-checkout-date').value = stay.checkoutDate || '';
    if (f('landing-stay-checkout-time')) f('landing-stay-checkout-time').value = stay.checkoutTime || '11:00';
    if (f('landing-places-key')) f('landing-places-key').value = state.googlePlacesKey || '';
    const submitBtn = document.querySelector('#landing-form .btn-main');
    if (submitBtn) {
      const hasPlan = state.days?.some(d => d.blocks?.length);
      submitBtn.textContent = hasPlan ? 'Continue planning' : 'Start planning';
    }
    updateSaveStatus();
  }

  function showPlanner() {
    document.getElementById('landing').classList.remove('active');
    document.getElementById('planner').classList.add('active');
    selectedDayId = selectedDayId || state.days[0]?.id;
    showPlannerPage(window.innerWidth <= 640 ? 'trip' : 'calendar');
    updateTripLabel();
    updateHomeLabel();
    updateMapsLink();
    updateSaveStatus();
    renderAll();
    checkForReviewPrompt();
  }

  function showPlannerPage(page) {
    plannerPage = page;
    const mobile = window.innerWidth <= 640;
    document.querySelectorAll('.planner-page').forEach(p => p.classList.remove('active'));

    if (page === 'trip') {
      if (mobile) {
        document.getElementById('page-trip')?.classList.add('active');
        renderTripOverview();
      } else {
        document.getElementById('page-calendar')?.classList.add('active');
        document.getElementById('page-backlog')?.classList.add('active');
        renderCalendar(); renderCatLegend(); renderBacklog();
      }
    } else if (page === 'calendar') {
      document.getElementById('page-calendar')?.classList.add('active');
      if (!mobile) document.getElementById('page-backlog')?.classList.add('active');
      renderCalendar(); renderCatLegend(); renderBacklog();
    } else if (page === 'day') {
      if (!expandedDayId && state.days?.length) expandedDayId = selectedDayId || state.days[0]?.id;
      document.getElementById('page-schedule')?.classList.add('active');
      renderSchedulePage();
    } else if (page === 'discover') {
      document.getElementById('page-discover')?.classList.add('active');
      renderDiscover();
    } else {
      const pageEl = document.getElementById('page-' + page);
      if (pageEl) pageEl.classList.add('active');
      if (page === 'backlog') { renderCatLegend(); renderBacklog(); }
      if (page === 'schedule') renderSchedulePage();
    }

    const nav = document.getElementById('planner-nav');
    if (nav) nav.hidden = page === 'schedule';

    document.querySelectorAll('[data-nav]').forEach(btn => {
      const bp = btn.dataset.nav;
      btn.classList.toggle('active',
        bp === page ||
        (bp === 'trip' && page === 'calendar' && !mobile) ||
        (bp === 'day' && page === 'schedule')
      );
    });

    renderStaySummary();
  }

  function updateTripLabel() {
    const el = document.getElementById('trip-label');
    if (!el || !state.tripStart || !state.tripEnd) return;
    const fmt = iso =>
      new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dates = fmt(state.tripStart) + ' – ' + fmt(state.tripEnd);
    const place = formatLocation(state.location);
    el.textContent = place ? dates + ' · ' + place : dates;
    document.title = place ? 'DNA TRAVELS — ' + place : 'DNA TRAVELS';
  }

  function updateMapsLink() {
    const a = document.getElementById('maps-list');
    if (a && state.mapsListUrl) {
      a.href = state.mapsListUrl;
      a.title = 'Open your Google Maps saved list';
    }
  }

  function updateHomeLabel() {
    const el = document.getElementById('home-label');
    if (el) el.textContent = state.homeBase?.name || 'Home base';
  }

  function populateHomeSelects() {
    const opts = getCatalogPlaces().filter(p => p.lat && p.lng)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(p => `<option value="${attr(p.placeId)}">${esc(p.name)}</option>`)
      .join('');
    ['landing-home', 'home-base-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = opts;
    });
  }

  function bindLanding() {
    document.getElementById('landing-form').addEventListener('submit', e => {
      e.preventDefault();
      const city = document.getElementById('landing-city').value.trim();
      const country = document.getElementById('landing-country').value.trim();
      const mapsUrl = document.getElementById('landing-maps-list').value.trim();
      if (!city || !country) return toast('Enter city and country');
      if (!mapsUrl) return toast('Paste your Google Maps list link');
      if (!isMapsListUrl(mapsUrl)) return toast('Use a Google Maps share link');
      const start = document.getElementById('landing-start').value;
      const end = document.getElementById('landing-end').value;
      if (!start || !end) return toast('Pick both dates');
      if (end < start) return toast('End date must be on or after start');
      state.location = {
        city,
        state: document.getElementById('landing-state').value.trim(),
        country,
      };
      state.mapsListUrl = mapsUrl;
      const ferryUrl = document.getElementById('landing-ferry-site')?.value.trim();
      if (ferryUrl && !/^https?:\/\//i.test(ferryUrl)) return toast('Ferry site should start with http');
      state.ferrySiteUrl = ferryUrl || DEFAULT_FERRY_SITE_URL;
      state.tripStart = start;
      state.tripEnd = end;
      const homeId = document.getElementById('landing-home')?.value || DEFAULT_HOME;
      const homePlace = getActivity(homeId);
      state.homeBase = { placeId: homeId, name: homePlace?.name || 'Home' };
      state.flights = normalizeFlights({
        arrival: readFlightLegFromForm('arrival'),
        departure: readFlightLegFromForm('departure'),
      });
      if (state.flights.arrival.airport === 'OTHER' && !state.flights.arrival.airportOther) {
        return toast('Enter your arrival airport name');
      }
      if (state.flights.departure.airport === 'OTHER' && !state.flights.departure.airportOther) {
        return toast('Enter your departure airport name');
      }
      const dayStartTime = document.getElementById('landing-day-start')?.value || DEFAULT_DAY_START_TIME;
      const dayEndTime = document.getElementById('landing-day-end')?.value || DEFAULT_DAY_END_TIME;
      if (parseTimeToHour(dayEndTime) <= parseTimeToHour(dayStartTime)) {
        return toast('Day end must be after day start');
      }
      state.dayStartTime = dayStartTime;
      state.dayEndTime = dayEndTime;
      const g = id => document.getElementById(id);
      state.stay = {
        name: (g('landing-stay-name')?.value || '').trim(),
        checkinDate: g('landing-stay-checkin-date')?.value || '',
        checkinTime: g('landing-stay-checkin-time')?.value || '15:00',
        checkoutDate: g('landing-stay-checkout-date')?.value || '',
        checkoutTime: g('landing-stay-checkout-time')?.value || '11:00',
      };
      state.googlePlacesKey = (g('landing-places-key')?.value || '').trim();
      state.onboarded = true;
      rebuildDaysPreservingBlocks();
      selectedDayId = state.days[0]?.id;
      saveState();
      showPlanner();
      syncMapsListFromUrl(mapsUrl);
    });
  }

  function serializeTrip() {
    return {
      version: 1,
      savedAt: state.lastSavedAt || null,
      tripStart: state.tripStart,
      tripEnd: state.tripEnd,
      location: state.location,
      mapsListUrl: state.mapsListUrl,
      ferrySiteUrl: state.ferrySiteUrl,
      flights: state.flights,
      dayStartTime: state.dayStartTime,
      dayEndTime: state.dayEndTime,
      homeBase: state.homeBase,
      customPlaces: state.customPlaces,
      mapsPlaces: state.mapsPlaces,
      mapsPlacesSyncedUrl: state.mapsPlacesSyncedUrl,
      days: state.days,
      backlogView: state.backlogView,
      neverAgain: state.neverAgain,
      stay: state.stay,
      googlePlacesKey: state.googlePlacesKey,
    };
  }

  function tripBackupFilename() {
    const slug = formatLocation(state.location)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return 'dna-travels-' + (slug || 'trip') + (state.tripStart ? '-' + state.tripStart : '') + '.json';
  }

  function downloadTripBackup() {
    const blob = new Blob([JSON.stringify(serializeTrip(), null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = tripBackupFilename();
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function saveTrip(opts) {
    const options = opts || {};
    state.lastSavedAt = new Date().toISOString();
    state.onboarded = true;
    saveState();
    if (options.download) downloadTripBackup();
    updateSaveStatus();
    if (!options.quiet) {
      toast(
        options.download
          ? 'Trip saved — backup file downloaded'
          : 'Trip saved on this device'
      );
    }
  }

  function updateSaveStatus() {
    const el = document.getElementById('save-status');
    if (!el) return;
    if (state.lastSavedAt) {
      const t = new Date(state.lastSavedAt);
      el.textContent =
        'Saved ' +
        t.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      el.hidden = false;
    } else {
      el.textContent = '';
      el.hidden = true;
    }
  }

  function bindPlannerChrome() {
    document.getElementById('btn-plan').addEventListener('click', () => {
      expandedDayId = null;
      plannerPage = 'calendar';
      showLanding();
    });
    document.getElementById('save-trip').addEventListener('click', () => saveTrip({ download: true }));
    document.getElementById('export-gcal').addEventListener('click', exportICS);
    document.querySelectorAll('[data-nav]').forEach(btn => {
      btn.addEventListener('click', () => {
        expandedDayId = null;
        showPlannerPage(btn.dataset.nav);
      });
    });
    document.getElementById('schedule-back').addEventListener('click', () => {
      expandedDayId = null;
      showPlannerPage('calendar');
    });
    document.getElementById('schedule-auto-day').addEventListener('click', () => {
      if (expandedDayId) autoScheduleDay(expandedDayId);
    });
    document.getElementById('edit-home').addEventListener('click', () => {
      document.getElementById('home-dialog').showModal();
      document.getElementById('home-base-select').value = state.homeBase?.placeId || DEFAULT_HOME;
    });
    document.getElementById('home-save').addEventListener('click', () => {
      const id = document.getElementById('home-base-select').value;
      const p = getActivity(id);
      state.homeBase = { placeId: id, name: p?.name || 'Home' };
      saveState();
      updateHomeLabel();
      document.getElementById('home-dialog').close();
      renderBacklog();
      toast('Home base updated');
    });
    document.getElementById('custom-form').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('custom-name').value.trim();
      const address = document.getElementById('custom-address').value.trim();
      const id = 'custom-' + Date.now();
      const saveUrl = mapsSearchUrl(name, address);
      state.customPlaces.push({
        id,
        placeId: id,
        name,
        neighborhood: document.getElementById('custom-hood').value.trim() || 'Custom',
        address,
        duration: clampDur(document.getElementById('custom-duration').value),
        mapsUrl: saveUrl,
        custom: true,
      });
      saveState();
      e.target.reset();
      document.getElementById('custom-duration').value = '60';
      renderBacklog();
      toast('Added to backlog — open your Maps list to add it there');
    });
    bindBacklogControls();
  }

  function blockEndTime(dayDate, block) {
    if (block.hour == null || !dayDate) return null;
    const start = blockDateTime(dayDate, block.hour);
    return new Date(start.getTime() + (block.duration || getDuration(block.placeId)) * 60000);
  }

  function isBlockPast(dayDate, block) {
    const end = blockEndTime(dayDate, block);
    return end && new Date() >= end;
  }

  function findReviewCandidate() {
    for (const day of state.days) {
      for (const block of day.blocks) {
        if (block.hour == null || block.review?.rating || block.reviewDismissed) continue;
        if (isBlockPast(day.date, block)) return { day, block };
      }
    }
    return null;
  }

  function startReviewChecks() {
    if (reviewCheckTimer) clearInterval(reviewCheckTimer);
    reviewCheckTimer = setInterval(checkForReviewPrompt, 45000);
    checkForReviewPrompt();
  }

  function checkForReviewPrompt() {
    if (!document.getElementById('planner')?.classList.contains('active')) return;
    if (reviewTarget || document.getElementById('review-dialog')?.open) return;
    const candidate = findReviewCandidate();
    const banner = document.getElementById('review-banner');
    if (!candidate) {
      if (banner) banner.classList.remove('show');
      return;
    }
    const a = getActivity(candidate.block.placeId);
    if (!a || !banner) return;
    banner.textContent = 'How was ' + a.name + '? Tap to rate';
    banner.classList.add('show');
    banner.onclick = () => openReviewDialog(candidate.day.id, candidate.block.id);
  }

  function openReviewDialog(dayId, blockId) {
    const day = state.days.find(d => d.id === dayId);
    const block = day?.blocks.find(b => b.id === blockId);
    const a = block && getActivity(block.placeId);
    if (!day || !block || !a) return;
    reviewTarget = { dayId, blockId };
    pendingReviewRating = block.review?.rating || 0;
    document.getElementById('review-activity-name').textContent = a.name;
    document.getElementById('review-note').value = block.review?.note || '';
    renderReviewStars();
    document.getElementById('review-banner')?.classList.remove('show');
    document.getElementById('review-dialog').showModal();
  }

  function renderReviewStars() {
    const el = document.getElementById('review-stars');
    if (!el) return;
    el.innerHTML = [1, 2, 3, 4, 5]
      .map(n => `<button type="button" data-star="${n}" class="${n <= pendingReviewRating ? 'on' : ''}">★</button>`)
      .join('');
    el.querySelectorAll('[data-star]').forEach(btn => {
      btn.addEventListener('click', () => {
        pendingReviewRating = parseInt(btn.dataset.star, 10);
        renderReviewStars();
      });
    });
  }

  function bindReviewUI() {
    document.getElementById('review-later').addEventListener('click', () => {
      if (reviewTarget) {
        const day = state.days.find(d => d.id === reviewTarget.dayId);
        const block = day?.blocks.find(b => b.id === reviewTarget.blockId);
        if (block) block.reviewDismissed = true;
        saveState();
      }
      reviewTarget = null;
      document.getElementById('review-dialog').close();
      checkForReviewPrompt();
    });
    document.getElementById('review-save').addEventListener('click', () => {
      if (!reviewTarget || !pendingReviewRating) return toast('Pick a star rating');
      const day = state.days.find(d => d.id === reviewTarget.dayId);
      const block = day?.blocks.find(b => b.id === reviewTarget.blockId);
      if (block) {
        const review = {
          rating: pendingReviewRating,
          note: document.getElementById('review-note').value.trim(),
          at: new Date().toISOString(),
        };
        block.review = review;
        if (isPoorRating(review.rating)) {
          registerNeverAgain(block.placeId, review);
        }
        saveState();
        renderAll();
        toast(
          isPoorRating(review.rating)
            ? 'Saved — moved to Never Again'
            : 'Thanks — saved your note'
        );
      }
      reviewTarget = null;
      document.getElementById('review-dialog').close();
      checkForReviewPrompt();
    });
    document.getElementById('review-banner').addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.getElementById('review-banner').click();
      }
    });
  }

  function openTimeView(dayId) {
    expandedDayId = dayId;
    selectedDayId = dayId;
    showPlannerPage('schedule');
  }

  function bindBacklogControls() {
    const syncBtn = document.getElementById('btn-sync-maps');
    if (syncBtn && !syncBtn.dataset.bound) {
      syncBtn.dataset.bound = '1';
      syncBtn.addEventListener('click', () => syncMapsListFromUrl(state.mapsListUrl));
    }
    const mapsLink = document.getElementById('custom-maps-link');
    if (mapsLink) mapsLink.href = state.mapsListUrl || DEFAULT_MAPS_LIST_URL;
    const searchEl = document.getElementById('backlog-search');
    if (searchEl && !searchEl.dataset.bound) {
      searchEl.dataset.bound = '1';
      searchEl.addEventListener('input', () => renderBacklog());
    }
    document.querySelectorAll('[data-backlog-view]').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        state.backlogView = btn.dataset.backlogView || 'all';
        saveState();
        renderBacklog();
      });
    });
  }

  function backlogMatchesSearch(a, q) {
    if (!q) return true;
    const hay = [a.name, a.neighborhood, a.address].filter(Boolean).join(' ').toLowerCase();
    return hay.includes(q);
  }

  function dayCount(start, end) {
    const a = new Date(start + 'T12:00:00');
    const b = new Date(end + 'T12:00:00');
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }

  function rebuildDaysPreservingBlocks() {
    const n = dayCount(state.tripStart, state.tripEnd);
    const oldByDate = {};
    (state.days || []).forEach(d => {
      if (d.date) oldByDate[d.date] = d.blocks || [];
    });
    state.days = [];
    for (let i = 0; i < n; i++) {
      const date = addDays(state.tripStart, i);
      state.days.push({ id: 'day-' + date, label: 'Day ' + (i + 1), date, blocks: oldByDate[date] || [] });
    }
  }

  function ensureDaysMatchTrip() {
    if (!state.tripStart || !state.tripEnd) return;
    if (state.days.length !== dayCount(state.tripStart, state.tripEnd)) rebuildDaysPreservingBlocks();
    state.days.forEach((d, i) => {
      d.date = d.date || addDays(state.tripStart, i);
      d.blocks = d.blocks || [];
    });
  }

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }
  function addDays(iso, n) {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function allActivities() {
    return dedupeActivities([...getCatalogPlaces(), ...state.customPlaces]);
  }
  function getActivity(id) {
    return allActivities().find(p => (p.placeId || p.id) === id);
  }
  function activityId(a) {
    return a.placeId || a.id;
  }
  function getDuration(id) {
    return clampDur(getActivity(id)?.duration || 60);
  }
  function clampDur(m) {
    return Math.max(15, Math.min(MAX_DURATION, parseInt(m, 10) || 60));
  }
  function durationLabel(mins) {
    const m = clampDur(mins);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? h + ' hr ' + r + ' min' : h + ' hr';
  }
  function durationOptionsHtml(selected) {
    const sel = clampDur(selected);
    const opts = DURATIONS.includes(sel) ? DURATIONS : [...DURATIONS, sel].sort((a, b) => a - b);
    return opts
      .map(m => `<option value="${m}"${m === sel ? ' selected' : ''}>${durationLabel(m)}</option>`)
      .join('');
  }
  function enjoyLabel(mins) {
    const m = clampDur(mins);
    if (m < 60) return '~' + m + ' min to enjoy';
    if (m === 60) return '~1 hr to enjoy';
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? '~' + h + ' hr ' + r + ' min to enjoy' : '~' + h + ' hr to enjoy';
  }
  function blockInHour(block, hour) {
    return block.hour != null && block.hour >= hour && block.hour < hour + 1;
  }
  function sortBlocksForDay(blocks) {
    return [...blocks].sort((a, b) => {
      if (a.hour == null && b.hour == null) return 0;
      if (a.hour == null) return 1;
      if (b.hour == null) return -1;
      return a.hour - b.hour;
    });
  }

  function mapsUrl(a) {
    if (a?.mapsUrl) return a.mapsUrl;
    return mapsSearchUrl(a?.name, a?.address);
  }

  function scheduledIds() {
    const ids = new Set();
    state.days.forEach(d => d.blocks.forEach(b => ids.add(b.placeId)));
    return ids;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s ?? '';
    return d.innerHTML;
  }
  function attr(s) {
    return String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2400);
  }

  function formatHour(h) {
    const ap = h >= 12 ? 'PM' : 'AM';
    return (h % 12 || 12) + ':00 ' + ap;
  }

  function formatRange(hour, dur) {
    const fmt = h => {
      const hr = Math.floor(h) % 12 || 12;
      const min = Math.round((h % 1) * 60);
      const ap = Math.floor(h) >= 12 ? 'PM' : 'AM';
      return min ? hr + ':' + String(min).padStart(2, '0') + ' ' + ap : hr + ' ' + ap;
    };
    return fmt(hour) + ' – ' + fmt(hour + dur / 60);
  }

  function blockDateTime(dateIso, hour) {
    const h = Math.floor(hour);
    const m = Math.round((hour % 1) * 60);
    return new Date(dateIso + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00');
  }

  function fmtGCal(d) {
    const p = n => String(n).padStart(2, '0');
    return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
  }

  function googleCalendarUrl(block, activity, dayDate) {
    const start = blockDateTime(dayDate, block.hour);
    const end = new Date(start.getTime() + block.duration * 60000);
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: activity.name + ' (DNA TRAVELS)',
      dates: fmtGCal(start) + '/' + fmtGCal(end),
      details: 'Enjoy ~' + block.duration + ' min. Maps: ' + mapsUrl(activity),
      location: activity.address || activity.neighborhood || 'New York, NY',
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  function exportICS() {
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DNA TRAVELS//NYC//EN', 'CALSCALE:GREGORIAN'];
    let count = 0;
    const fmtLocal = d => {
      const p = n => String(n).padStart(2, '0');
      return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + 'T' + p(d.getHours()) + p(d.getMinutes()) + '00';
    };
    const pushFlight = (uid, leg, verb) => {
      if (!leg?.date) return;
      const startTime = leg.depTime || leg.arrTime;
      const endTime = leg.arrTime || leg.depTime;
      if (!startTime) return;
      const start = new Date(leg.date + 'T' + startTime + ':00');
      if (Number.isNaN(start.getTime())) return;
      let end = new Date(leg.date + 'T' + endTime + ':00');
      if (Number.isNaN(end.getTime()) || end <= start) end = new Date(start.getTime() + 60 * 60000);
      const loc = airportLabel(leg).replace(/[,;\\]/g, ' ');
      const summary = (verb + ' ' + airportLabel(leg) + (leg.flightNumber ? ' (' + leg.flightNumber + ')' : '')).trim();
      lines.push(
        'BEGIN:VEVENT',
        'UID:' + uid + '@dna-travels',
        'DTSTAMP:' + fmtLocal(new Date()),
        'DTSTART:' + fmtLocal(start),
        'DTEND:' + fmtLocal(end),
        'SUMMARY:' + summary.replace(/[,;\\]/g, ' '),
        'LOCATION:' + loc,
        'DESCRIPTION:DNA TRAVELS flight' + (leg.flightNumber ? ' ' + leg.flightNumber : ''),
        'END:VEVENT'
      );
      count++;
    };
    const flights = state.flights || defaultFlights();
    pushFlight('flight-arrival', flights.arrival, 'Arrive');
    pushFlight('flight-departure', flights.departure, 'Depart');

    state.days.forEach(day => {
      day.blocks.forEach(block => {
        if (block.hour == null) return;
        const a = getActivity(block.placeId);
        if (!a || !day.date) return;
        const start = blockDateTime(day.date, block.hour);
        const end = new Date(start.getTime() + block.duration * 60000);
        lines.push(
          'BEGIN:VEVENT',
          'UID:' + block.id + '@dna-travels',
          'DTSTAMP:' + fmtLocal(new Date()),
          'DTSTART:' + fmtLocal(start),
          'DTEND:' + fmtLocal(end),
          'SUMMARY:' + (a.name || 'Activity').replace(/[,;\\]/g, ' '),
          'LOCATION:' + (a.address || '').replace(/[,;\\]/g, ' '),
          'DESCRIPTION:DNA TRAVELS - ' + mapsUrl(a),
          'END:VEVENT'
        );
        count++;
      });
    });
    lines.push('END:VCALENDAR');
    if (!count) return toast('Add flight times or assign activity times first');
    saveTrip({ quiet: true });
    const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const slug = formatLocation(state.location)
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    a.download = 'dna-travels-' + (slug || 'trip') + '.ics';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Trip saved — calendar file downloaded');
  }

  function initDurationSelects() {
    const sel = document.getElementById('custom-duration');
    if (!sel) return;
    sel.innerHTML = durationOptionsHtml(60);
    sel.value = '60';
  }

  function renderFlightSummary() {
    const el = document.getElementById('flight-summary');
    if (!el) return;
    const f = state.flights || defaultFlights();
    const arrive = formatFlightLeg('Arrive', f.arrival);
    const depart = formatFlightLeg('Depart', f.departure);
    if (!arrive && !depart) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML =
      '<div class="flight-summary-inner">' +
      (arrive ? `<p class="flight-line flight-arrive"><span class="flight-icon">✈️</span> ${esc(arrive)}</p>` : '') +
      (depart ? `<p class="flight-line flight-depart"><span class="flight-icon">🛫</span> ${esc(depart)}</p>` : '') +
      '<p class="flight-edit-hint"><button type="button" class="linkish" id="btn-edit-flights">Edit flights</button></p>' +
      '</div>';
    el.querySelector('#btn-edit-flights')?.addEventListener('click', () => showLanding());
  }

  /* ———— Stay / Trip / Discover ———— */

  function fmtTime12(t) {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return (h % 12 || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h >= 12 ? ' PM' : ' AM');
  }

  function fmtDateShort(d) {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  function renderStaySummary() {
    const el = document.getElementById('stay-summary');
    if (!el) return;
    const stay = state.stay;
    if (!stay?.name && !stay?.checkinDate) { el.hidden = true; return; }
    const ci = stay.checkinDate ? fmtDateShort(stay.checkinDate) + (stay.checkinTime ? ' · ' + fmtTime12(stay.checkinTime) : '') : '';
    const co = stay.checkoutDate ? fmtDateShort(stay.checkoutDate) + (stay.checkoutTime ? ' · ' + fmtTime12(stay.checkoutTime) : '') : '';
    el.hidden = false;
    el.innerHTML = `<span class="stay-summary-name">🏨 ${esc(stay.name || 'Your Stay')}</span>
      <div class="stay-summary-rows">
        ${ci ? `<span class="stay-summary-row"><strong>In:</strong> ${esc(ci)}</span>` : ''}
        ${co ? `<span class="stay-summary-row"><strong>Out:</strong> ${esc(co)}</span>` : ''}
      </div>
      <button class="stay-summary-edit" id="stay-edit-btn">Edit</button>`;
    el.querySelector('#stay-edit-btn')?.addEventListener('click', () => {
      document.getElementById('planner').classList.remove('active');
      document.getElementById('landing').classList.add('active');
    });
  }

  function renderTripOverview() {
    const daysEl = document.getElementById('trip-days');
    const stayCardEl = document.getElementById('trip-stay-card');
    const countEl = document.getElementById('trip-day-count');
    if (!daysEl) return;
    if (countEl) countEl.textContent = (state.days?.length || 0) + ' days';
    const stay = state.stay;
    if (stayCardEl) {
      if (stay?.name || stay?.checkinDate) {
        const ci = stay.checkinDate ? fmtDateShort(stay.checkinDate) + (stay.checkinTime ? ' · ' + fmtTime12(stay.checkinTime) : '') : '—';
        const co = stay.checkoutDate ? fmtDateShort(stay.checkoutDate) + (stay.checkoutTime ? ' · ' + fmtTime12(stay.checkoutTime) : '') : '—';
        stayCardEl.innerHTML = `<div class="trip-stay-card">
          <div class="trip-stay-header">🏨 ${esc(stay.name || 'Your Stay')}
            <button class="stay-summary-edit" id="trip-stay-edit">Edit</button>
          </div>
          <div class="trip-stay-rows">
            <div class="trip-stay-row"><span class="trip-stay-row-label">Check-in</span><span>${esc(ci)}</span></div>
            <div class="trip-stay-row"><span class="trip-stay-row-label">Check-out</span><span>${esc(co)}</span></div>
          </div>
        </div>`;
        stayCardEl.querySelector('#trip-stay-edit')?.addEventListener('click', () => {
          document.getElementById('planner').classList.remove('active');
          document.getElementById('landing').classList.add('active');
        });
      } else {
        stayCardEl.innerHTML = '';
      }
    }
    const html = (state.days || []).map(day => {
      const blocks = day.blocks || [];
      const dateLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const chips = [];
      if (stay?.checkinDate === day.date)
        chips.push(`<span class="mini-chip mc-stay">🏨 In${stay.checkinTime ? ' ' + fmtTime12(stay.checkinTime) : ''}</span>`);
      if (stay?.checkoutDate === day.date)
        chips.push(`<span class="mini-chip mc-stay">🏨 Out${stay.checkoutTime ? ' ' + fmtTime12(stay.checkoutTime) : ''}</span>`);
      sortBlocksForDay(blocks).forEach(b => {
        const place = getActivity(b.placeId);
        const cat = getCategory(place) || 'other';
        const timePfx = b.hour != null ? formatHour(b.hour) + ' · ' : '';
        chips.push(`<span class="mini-chip mc-${cat}" title="${attr(place?.name || '')}">${catEmoji(place) || '📌'} ${esc(timePfx + (place?.name?.slice(0, 18) || 'Activity'))}</span>`);
      });
      const chipsHtml = chips.length ? chips.join('') : `<span style="font-size:0.65rem;color:var(--muted)">No activities — tap to plan</span>`;
      return `<div class="trip-day-card" data-trip-day="${attr(day.id)}">
        <div class="trip-day-head">
          <div class="trip-day-name">${esc(dateLabel)}</div>
          <div class="trip-day-right">${blocks.length} planned <span>›</span></div>
        </div>
        <div class="trip-chips-row">${chipsHtml}</div>
      </div>`;
    }).join('');
    daysEl.innerHTML = html;
    daysEl.querySelectorAll('[data-trip-day]').forEach(card => {
      card.addEventListener('click', () => {
        selectedDayId = card.dataset.tripDay;
        expandedDayId = card.dataset.tripDay;
        showPlannerPage('day');
      });
    });
  }

  async function fetchNearbyPlaces(lat, lng) {
    const key = state.googlePlacesKey;
    if (!key || !lat || !lng) return [];
    const cacheKey = `dna-nearby-${Math.round(lat * 100)}-${Math.round(lng * 100)}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (e) { /* ignore */ }
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.displayName,places.location,places.primaryType,places.rating,places.formattedAddress,places.id',
        },
        body: JSON.stringify({
          includedTypes: ['restaurant', 'cafe', 'museum', 'park', 'tourist_attraction', 'art_gallery', 'shopping_mall', 'bakery'],
          maxResultCount: 10,
          locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: 800 } },
        }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      const places = (data.places || []).map(p => ({
        name: p.displayName?.text || 'Unknown',
        lat: p.location?.latitude,
        lng: p.location?.longitude,
        address: p.formattedAddress || '',
        primaryType: p.primaryType || '',
        rating: p.rating,
        googlePlaceId: p.id,
      }));
      try { sessionStorage.setItem(cacheKey, JSON.stringify(places)); } catch (e) { /* ignore */ }
      return places;
    } catch (e) {
      return [];
    }
  }

  function googleTypeToCategory(type) {
    if (/restaurant|food|bakery|cafe|bar/.test(type)) return 'restaurant';
    if (/cafe|coffee/.test(type)) return 'coffee';
    if (/museum|gallery|art/.test(type)) return 'museum';
    if (/park|garden|nature/.test(type)) return 'park';
    if (/shopping|mall|store/.test(type)) return 'shopping';
    if (/tourist|attraction|landmark/.test(type)) return 'destination';
    return 'other';
  }

  function renderDiscover() {
    const container = document.getElementById('discover-scroll');
    const labelEl = document.getElementById('discover-day-label');
    if (!container) return;
    const day = state.days.find(d => d.id === selectedDayId) || state.days[0];
    if (!day) { container.innerHTML = '<p class="empty-msg">Set up your trip to see suggestions.</p>'; return; }
    if (labelEl) labelEl.textContent = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    const scheduled = scheduledIds();
    const never = neverAgainIds();
    const dayBlocks = day.blocks || [];
    const scheduledPlaces = dayBlocks.map(b => getActivity(b.placeId)).filter(Boolean);
    let centerLat, centerLng;
    if (scheduledPlaces.length) {
      centerLat = scheduledPlaces.reduce((s, p) => s + (p.lat || 0), 0) / scheduledPlaces.length;
      centerLng = scheduledPlaces.reduce((s, p) => s + (p.lng || 0), 0) / scheduledPlaces.length;
    } else {
      const home = getHome();
      centerLat = home?.lat; centerLng = home?.lng;
    }
    const center = { lat: centerLat, lng: centerLng };

    const timed = dayBlocks.filter(b => b.hour != null).sort((a, b) => a.hour - b.hour);
    const dayStart = parseTimeToHour(state.dayStartTime || DEFAULT_DAY_START_TIME);
    const dayEnd = parseTimeToHour(state.dayEndTime || DEFAULT_DAY_END_TIME);
    let gapText = 'Full day open';
    if (timed.length) {
      const gaps = []; let prev = dayStart;
      timed.forEach(b => {
        if (b.hour > prev + 1) gaps.push(formatHour(prev) + '–' + formatHour(b.hour));
        prev = b.hour + Math.ceil((b.duration || 60) / 60);
      });
      if (prev < dayEnd - 1) gaps.push(formatHour(prev) + '+');
      gapText = gaps.length ? 'Free: ' + gaps.slice(0, 2).join(', ') : 'Fully scheduled';
    }

    const myList = allActivities()
      .filter(p => !scheduled.has(activityId(p)) && !never.has(activityId(p)))
      .map(p => ({ ...p, _dist: distMi(p, center) }))
      .sort((a, b) => a._dist - b._dist).slice(0, 8);

    const myListIds = new Set(allActivities().map(p => p.name.toLowerCase()));

    const dayStrip = state.days.map(d => {
      const lbl = new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      return `<button class="discover-day-btn${d.id === day.id ? ' active' : ''}" data-did="${attr(d.id)}">${esc(lbl)}</button>`;
    }).join('');

    function listItemHtml(p, isNew) {
      const emoji = catEmoji(p) || '📌';
      const distStr = (p._dist != null && p._dist < 99) ? p._dist + ' mi' : '';
      const badge = isNew ? '<span class="discover-new-badge">✨ new</span>' : '';
      const ratStr = p.rating ? ' · ★' + p.rating : '';
      const isOnDay = dayBlocks.some(b => b.placeId === activityId(p));
      return `<div class="discover-item">
        <div class="discover-emoji">${emoji}</div>
        <div class="discover-info">
          <div class="discover-name">${esc(p.name)}${badge}</div>
          <div class="discover-meta">${esc(p.neighborhood || p.address?.split(',')[0] || '')}${distStr ? ' · ' + distStr : ''}${ratStr} · ${durationLabel(p.duration || 60)}</div>
        </div>
        <button class="discover-add" data-pid="${attr(activityId(p))}" data-did="${attr(day.id)}"${isOnDay ? ' disabled' : ''}>${isOnDay ? '✓' : '+ Add'}</button>
      </div>`;
    }

    const hasKey = !!state.googlePlacesKey;
    const dayDateLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    container.innerHTML = `
      <div class="discover-day-strip">${dayStrip}</div>
      <div class="discover-context"><strong>${esc(dayDateLabel)}</strong> · ${esc(gapText)}</div>
      <div class="discover-section">
        <div class="discover-section-title">📋 From your list — not yet scheduled</div>
        ${myList.length ? myList.map(p => listItemHtml(p, false)).join('') : '<div style="font-size:0.75rem;padding:0.65rem;color:var(--muted)">Everything on your list is already scheduled!</div>'}
      </div>
      <div class="discover-section" id="discover-new-section">
        <div class="discover-section-title new">✨ Discover — not in your list</div>
        ${hasKey ? '<div class="discover-loading" id="discover-loading">Loading nearby places…</div>' : '<div style="font-size:0.75rem;padding:0.65rem;color:var(--muted)">Add your Google Places API key in Plan settings to discover new places.</div>'}
      </div>`;

    container.querySelectorAll('.discover-day-btn').forEach(btn => {
      btn.addEventListener('click', () => { selectedDayId = btn.dataset.did; renderDiscover(); });
    });

    bindDiscoverAddButtons(container, dayBlocks, day);

    if (hasKey && centerLat && centerLng) {
      fetchNearbyPlaces(centerLat, centerLng).then(googlePlaces => {
        const newSection = container.querySelector('#discover-new-section');
        if (!newSection) return;
        const filtered = googlePlaces.filter(p => !myListIds.has(p.name.toLowerCase()));
        const withDist = filtered.map(p => ({ ...p, _dist: distMi(p, center), neighborhood: '' }));
        const withCat = withDist.map(p => ({ ...p, category: googleTypeToCategory(p.primaryType) }));
        const getGCategory = p => p.category || 'other';
        const getGEmoji = p => CAT_EMOJIS[getGCategory(p)] || '📌';
        if (!withCat.length) {
          newSection.innerHTML = '<div class="discover-section-title new">✨ Discover — not in your list</div><div style="font-size:0.75rem;padding:0.65rem;color:var(--muted)">No new places found nearby right now.</div>';
          return;
        }
        const itemsHtml = withCat.map(p => {
          const emoji = getGEmoji(p);
          const distStr = p._dist < 99 ? p._dist + ' mi' : '';
          const ratStr = p.rating ? ' · ★' + p.rating : '';
          return `<div class="discover-item">
            <div class="discover-emoji">${emoji}</div>
            <div class="discover-info">
              <div class="discover-name">${esc(p.name)}<span class="discover-new-badge">✨ new</span></div>
              <div class="discover-meta">${esc(p.address?.split(',')[0] || '')}${distStr ? ' · ' + distStr : ''}${ratStr}</div>
            </div>
            <button class="discover-add" data-gpid="${attr(p.googlePlaceId)}" data-gname="${attr(p.name)}" data-glat="${p.lat}" data-glng="${p.lng}" data-gcat="${attr(getGCategory(p))}" data-did="${attr(day.id)}">+ Add</button>
          </div>`;
        }).join('');
        newSection.innerHTML = '<div class="discover-section-title new">✨ Discover — not in your list</div>' + itemsHtml;
        newSection.querySelectorAll('.discover-add').forEach(btn => {
          btn.addEventListener('click', () => {
            const d = state.days.find(x => x.id === btn.dataset.did);
            if (!d) return;
            const newPlace = {
              id: 'gp-' + Date.now(),
              placeId: 'gp-' + btn.dataset.gpid,
              name: btn.dataset.gname,
              lat: parseFloat(btn.dataset.glat) || null,
              lng: parseFloat(btn.dataset.glng) || null,
              neighborhood: '',
              duration: 60,
              category: btn.dataset.gcat,
            };
            if (!state.customPlaces.find(p => p.placeId === newPlace.placeId)) {
              state.customPlaces.push(newPlace);
            }
            if (!d.blocks.some(b => b.placeId === newPlace.placeId)) {
              d.blocks.push({ id: 'b-' + Date.now(), placeId: newPlace.placeId, hour: null, duration: 60 });
            }
            saveState();
            toast('Added ' + newPlace.name);
            btn.textContent = '✓'; btn.disabled = true;
          });
        });
      });
    }
  }

  function bindDiscoverAddButtons(container, dayBlocks, day) {
    container.querySelectorAll('.discover-add[data-pid]').forEach(btn => {
      btn.addEventListener('click', () => {
        const placeId = btn.dataset.pid;
        const d = state.days.find(x => x.id === btn.dataset.did);
        if (!d || d.blocks.some(b => b.placeId === placeId)) { toast('Already on this day'); return; }
        d.blocks.push({ id: 'b-' + Date.now(), placeId, hour: null, duration: getDuration(placeId) });
        saveState();
        toast('Added to ' + dayLabel(d));
        btn.textContent = '✓'; btn.disabled = true;
      });
    });
  }

  /* ———— End Stay / Trip / Discover ———— */

  function renderAll() {
    renderCalendar();
    renderBacklog();
    renderFlightSummary();
    renderStaySummary();
    if (plannerPage === 'schedule' || plannerPage === 'day') renderSchedulePage();
    if (plannerPage === 'trip') renderTripOverview();
    if (plannerPage === 'discover') renderDiscover();
    updateTripLabel();
    updateHomeLabel();
    updateMapsLink();
    updateSaveStatus();
    checkForReviewPrompt();
  }

  function renderSchedulePage() {
    const dayId = expandedDayId;
    const day = state.days.find(d => d.id === dayId);
    const labelEl = document.getElementById('schedule-day-label');
    const content = document.getElementById('schedule-content');
    if (!day || !content) return;
    if (labelEl) {
      labelEl.textContent = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
    }
    content.innerHTML = renderHoursPanel(dayId) + renderExcursionsPanel(day);
    bindHoursPanel(content);
    bindCalendarInteractions(content);
    content.querySelectorAll('[data-rate-block]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openReviewDialog(btn.dataset.day, btn.dataset.rateBlock);
      });
    });
    content.querySelectorAll('[data-add-excursion]').forEach(btn => {
      btn.addEventListener('click', () => addFerryExcursion(btn.dataset.addExcursion, btn.dataset.day));
    });
    content.querySelectorAll('[data-add-hidden]').forEach(btn => {
      btn.addEventListener('click', () => addHiddenStreet(btn.dataset.addHidden, btn.dataset.day));
    });
    hydrateExcursions(day);
  }

  function requiresTicket(a) {
    const c = getCategory(a);
    const name = (a?.name || '').toLowerCase();
    return (
      c === 'museum' ||
      /island|tramway|tour|observation|show|gallery|museum|library|ferry/i.test(name)
    );
  }

  function ticketUrlForActivity(a) {
    if (a?.ticketUrl) return a.ticketUrl;
    if (/ferry/i.test(a?.name || '')) return DEFAULT_FERRY_PASS_URL;
    if (requiresTicket(a)) return mapsUrl(a);
    return mapsUrl(a);
  }

  function weekdayIndex(isoDate) {
    return new Date(isoDate + 'T12:00:00').getDay();
  }

  function getFerriesForDay(day) {
    const w = weekdayIndex(day.date);
    const home = getHome();
    return FERRY_ROUTES.filter(r => r.weekdays.includes(w))
      .map(r => ({ ...r, dist: distMi(r, home) }))
      .sort((a, b) => a.dist - b.dist);
  }

  function isRecentLiveFerryCache() {
    return Date.now() - (liveFerryState.fetchedAt || 0) < 2 * 60 * 1000;
  }

  async function fetchJsonWithTimeout(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const res = await fetch(url, { signal: ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function normalizeLiveFerryItems(raw) {
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
        ? raw.data
        : Array.isArray(raw?.arrivals)
          ? raw.arrivals
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
    return list
      .map(x => ({
        route: x.route || x.route_name || x.line || x.service || '',
        terminal: x.terminal || x.stop_name || x.landing || x.stop || '',
        departure:
          x.departure_time ||
          x.departure ||
          x.scheduled_departure ||
          x.eta ||
          x.time ||
          '',
      }))
      .filter(x => x.route && x.departure);
  }

  function fmtLiveTime(when) {
    const d = new Date(when);
    if (!Number.isFinite(d.getTime())) return String(when);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  async function ensureLiveFerryData() {
    if (liveFerryState.loading || isRecentLiveFerryCache()) return;
    liveFerryState.loading = true;
    liveFerryState.error = '';
    try {
      for (const url of LIVE_FERRY_ENDPOINTS) {
        try {
          const raw = await fetchJsonWithTimeout(url, 5500);
          const items = normalizeLiveFerryItems(raw);
          if (items.length) {
            liveFerryState = {
              loading: false,
              fetchedAt: Date.now(),
              items,
              error: '',
            };
            return;
          }
        } catch (err) {}
      }
      liveFerryState.error = 'Live times unavailable right now';
    } finally {
      liveFerryState.loading = false;
    }
  }

  function getRouteLiveTimes(routeName) {
    const now = Date.now();
    return (liveFerryState.items || [])
      .filter(x => String(x.route).toLowerCase().includes(String(routeName).toLowerCase()))
      .map(x => ({
        ...x,
        ts: new Date(x.departure).getTime(),
      }))
      .filter(x => Number.isFinite(x.ts) && x.ts >= now - 5 * 60 * 1000)
      .sort((a, b) => a.ts - b.ts)
      .slice(0, 4);
  }

  function hydrateExcursions(day) {
    ensureLiveFerryData().then(() => {
      if (plannerPage !== 'schedule' || expandedDayId !== day.id) return;
      const root = document.getElementById('schedule-content');
      if (!root) return;
      root.querySelectorAll('[data-ferry-route]').forEach(el => {
        const route = el.dataset.ferryRoute;
        const times = getRouteLiveTimes(route);
        const status = el.querySelector('.excursion-live');
        if (!status) return;
        if (times.length) {
          status.textContent = 'Next departures: ' + times.map(t => fmtLiveTime(t.departure)).join(', ');
        } else if (liveFerryState.error) {
          status.textContent = liveFerryState.error + ' — showing day-based routes.';
        } else if (liveFerryState.loading) {
          status.textContent = 'Loading live times...';
        } else {
          status.textContent = 'No live departures found for this route.';
        }
      });
    });
  }

  function ensureCustomExcursion(place) {
    const existing = getActivity(place.placeId || place.id);
    if (existing) return activityId(existing);
    state.customPlaces.push({
      id: place.id,
      placeId: place.placeId || place.id,
      name: place.name,
      neighborhood: place.neighborhood || 'Excursion',
      address: place.address || '',
      lat: place.lat,
      lng: place.lng,
      duration: place.duration || 60,
      category: place.category || 'destination',
      mapsUrl: place.mapsUrl || '',
      ticketUrl: place.ticketUrl || '',
    });
    return place.placeId || place.id;
  }

  function addFerryExcursion(routeId, dayId) {
    const route = FERRY_ROUTES.find(r => r.id === routeId);
    if (!route) return;
    const placeId = ensureCustomExcursion({
      id: 'exc-' + route.id,
      name: 'NYC Ferry: ' + route.route + ' (' + route.terminal + ')',
      neighborhood: 'Ferry',
      address: route.terminal + ', NYC',
      lat: route.lat,
      lng: route.lng,
      duration: 60,
      category: 'destination',
      mapsUrl: state.ferrySiteUrl || DEFAULT_FERRY_SITE_URL,
      ticketUrl: DEFAULT_FERRY_PASS_URL,
    });
    addToDay(placeId, dayId);
  }

  function getNearbyHiddenStreets(day) {
    const anchors = day.blocks
      .map(b => getActivity(b.placeId))
      .filter(Boolean);
    const fallback = getHome();
    const hasHidden = new Set(day.blocks.map(b => b.placeId));
    return HIDDEN_STREETS.filter(h => !hasHidden.has(h.id))
      .map(h => {
        const d = anchors.length
          ? Math.min(...anchors.map(a => distMi(h, a)))
          : distMi(h, fallback);
        return { ...h, dist: d };
      })
      .filter(h => h.dist <= 1.5)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);
  }

  function addHiddenStreet(hiddenId, dayId) {
    const h = HIDDEN_STREETS.find(x => x.id === hiddenId);
    if (!h) return;
    const placeId = ensureCustomExcursion({
      ...h,
      placeId: h.id,
    });
    addToDay(placeId, dayId);
  }

  function renderExcursionsPanel(day) {
    const ferries = getFerriesForDay(day);
    const hidden = getNearbyHiddenStreets(day);
    let html = '<section class="excursion-panel"><h3>Excursions nearby</h3>';
    html += '<p class="excursion-hint">Ferries are filtered to this day. Hidden streets show if near your current route/home.</p>';
    html += '<div class="excursion-group"><h4>NYC Ferries</h4>';
    if (!ferries.length) {
      html += '<p class="excursion-empty">No ferry routes configured for this day.</p>';
    } else {
      html += ferries
        .map(f => {
          const close = f.dist <= 1.2 ? ' · near home' : '';
          return `<article class="excursion-card" data-ferry-route="${attr(f.route)}">
            <strong>${esc(f.route)}</strong>
            <p>${esc(f.terminal)} · ${f.dist} mi from home${close}</p>
            <p class="excursion-live">Loading live times...</p>
            <div class="spot-actions">
              <button type="button" class="btn-add" data-add-excursion="${attr(f.id)}" data-day="${attr(day.id)}">Add</button>
              <a class="link-btn" href="${attr(state.ferrySiteUrl || DEFAULT_FERRY_SITE_URL)}" target="_blank" rel="noopener">Website</a>
              <a class="link-btn" href="${DEFAULT_FERRY_PASS_URL}" target="_blank" rel="noopener">Pass</a>
            </div>
          </article>`;
        })
        .join('');
    }
    html += '</div><div class="excursion-group"><h4>Hidden streets</h4>';
    if (!hidden.length) {
      html += '<p class="excursion-empty">No nearby hidden streets detected around your route yet.</p>';
    } else {
      html += hidden
        .map(h => `<article class="excursion-card">
          <strong>${esc(h.name)}</strong>
          <p>${esc(h.neighborhood)} · ${h.dist} mi from your day</p>
          <div class="spot-actions">
            <button type="button" class="btn-add" data-add-hidden="${attr(h.id)}" data-day="${attr(day.id)}">Add</button>
            <a class="link-btn" href="${ticketUrlForActivity(h)}" target="_blank" rel="noopener">Tickets</a>
            <a class="link-btn" href="${mapsUrl(h)}" target="_blank" rel="noopener">Maps</a>
          </div>
        </article>`)
        .join('');
    }
    html += '</div></section>';
    return html;
  }

  /* —— Calendar: days overview —— */
  function renderCalendar() {
    renderTimelineCalendar();
  }

  function renderTimelineCalendar() {
    const overview = document.getElementById('calendar');
    if (!overview) return;

    let html = '<div class="timeline-grid-wrapper">';

    // Toolbar with Auto Day buttons (one per day)
    html += '<div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem; padding: 0.5rem; background: var(--bg); border-radius: 8px; align-items: center;">';
    html += '<span style="font-size: 0.7rem; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em;">Auto Day:</span>';
    state.days.forEach(day => {
      const label = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      html += `<button type="button" class="btn-mini" data-auto-day="${attr(day.id)}" style="font-size: 0.65rem; padding: 0.35rem 0.6rem;">${esc(label)}</button>`;
    });
    html += '</div>';

    // Legend header
    html += '<div class="legend-container" style="background: linear-gradient(135deg, var(--ink) 0%, var(--teal) 100%); color: white; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 0.75rem;">';
    html += '<div style="font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.6rem;">Activity Legend</div>';
    html += '<div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.5rem;">';
    CAT_ORDER.forEach(cat => {
      const emoji = CAT_EMOJIS[cat];
      const label = CAT_LABELS[cat];
      const colorVar = `--cat-${cat}`;
      html += `<div style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.65rem;">
        <div style="width: 14px; height: 14px; background: var(${colorVar}); border: 1px solid rgba(255,255,255,0.3); border-radius: 3px; flex-shrink: 0;"></div>
        <span>${emoji} ${label}</span>
      </div>`;
    });
    html += '</div></div>';

    // Header row with day names
    html += '<div class="timeline-header-row">';
    html += '<div class="timeline-header-spacer"></div>';
    state.days.forEach(day => {
      const label = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const count = day.blocks.length;
      const sel = selectedDayId === day.id ? ' selected' : '';
      html += `<div class="timeline-day-header${sel}" data-select-day="${attr(day.id)}" role="button" tabindex="0" title="Select this day for Add to day">
        <div class="day-header">${esc(label)}</div>
        <div class="day-subheader">${count} stop${count !== 1 ? 's' : ''}</div>
      </div>`;
    });
    html += '</div>';

    // Grid row with time column and day columns
    html += '<div class="timeline-grid-row">';

    const scheduleHours = getScheduleHours();
    const timelineH = timelineSlotCount() * 60;

    // Time column
    html += `<div class="time-col" style="min-height:${timelineH}px">`;
    scheduleHours.forEach(h => {
      html += `<div class="time-marker">${formatHour(h)}</div>`;
    });
    html += '</div>';

    const dayCount = Math.max(state.days.length, 1);
    const gridCols = `repeat(${dayCount}, 140px)`;

    // Grid container with activities
    html += `<div class="grid-container" style="grid-template-columns: ${gridCols}; min-height: ${timelineH}px">`;

    // Background grid lines (behind all day columns)
    html += '<div class="grid-background">';
    scheduleHours.forEach(() => {
      html += '<div class="grid-line"></div>';
    });
    html += '</div>';

    // Day columns with activities and drop zones (one grid column each)
    state.days.forEach((day, dayIndex) => {
      const col = dayIndex + 1;
      const sel = selectedDayId === day.id ? ' selected' : '';
      const untimed = day.blocks.filter(b => b.hour == null);
      html += `<div class="day-col${sel}" data-day-id="${attr(day.id)}" style="grid-column:${col};grid-row:1">`;
      html += `<div class="day-untimed day-drop timeline-drop-zone" data-drop-day="${attr(day.id)}" data-drop-type="day" title="Drop here for no set time">`;
      if (untimed.length) {
        untimed.forEach(b => {
          const a = getActivity(b.placeId);
          if (a) html += timelineUntimedChipHtml(b, a, day);
        });
      } else {
        html += '<span class="day-drop-hint">Drop here · no time</span>';
      }
      html += '</div>';
      html += `<div class="day-timeline" style="min-height:${timelineH}px">`;
      scheduleHours.forEach(h => {
        const top = hourToTimelineTop(h);
        const blocked = hourSlotBlocked(day.date, h);
        html += `<div class="timeline-drop-zone${blocked ? ' drop-blocked' : ''}" data-drop-day="${attr(day.id)}" data-drop-hour="${h}" data-drop-type="hour" style="top:${top}px"${blocked ? ' title="Blocked — flight"' : ''}></div>`;
      });
      getFlightReservationsForDay(day.date).forEach(res => {
        html += timelineFlightBlockHtml(res);
      });
      day.blocks
        .filter(b => b.hour != null)
        .forEach(b => {
          const a = getActivity(b.placeId);
          if (a) html += timelineActivityHtml(b, a, day);
        });
      html += '</div></div>';
    });

    html += '</div></div></div>';
    overview.innerHTML = html;
    bindTimelineInteractions(overview);
  }

  function timelineUntimedChipHtml(b, a, day) {
    const dur = b.duration || getDuration(b.placeId);
    const cc = catClass(a);
    return `<span class="timeline-untimed-chip ${cc}" draggable="true"
      data-block-id="${attr(b.id)}" data-place-id="${attr(b.placeId)}" data-day-id="${attr(day.id)}" data-hour=""
      title="${attr(enjoyLabel(dur))}">${catEmoji(a)} ${esc(a.name)}</span>`;
  }

  function timelineFlightBlockHtml(res) {
    const top = hourToTimelineTop(res.start);
    const height = Math.max((res.end - res.start) * 60, 36);
    const kind = res.kind === 'departure' ? 'flight-depart' : 'flight-arrive';
    return `<div class="timeline-flight-block ${kind}" style="top:${top}px;height:${height}px" title="${attr(res.label)}">
      <span class="flight-block-label">${esc(res.label)}</span>
      <span class="flight-block-time">${esc(formatRange(res.start, (res.end - res.start) * 60))}</span>
    </div>`;
  }

  function timelineActivityHtml(b, a, day) {
    const pos = calculateActivityPosition(b);
    const cc = catClass(a);
    return `<div class="timeline-activity ${cc}"
      draggable="true"
      style="top: ${pos.top}px; height: ${pos.height}px;"
      data-block-id="${attr(b.id)}"
      data-place-id="${attr(b.placeId)}"
      data-day-id="${attr(day.id)}"
      data-hour="${b.hour || ''}">
      <span class="activity-name">${catEmoji(a)} ${esc(a.name)}</span>
      <span class="activity-time">${formatRange(b.hour, b.duration)}</span>
      <button type="button" class="activity-remove" data-remove-block="${attr(b.id)}" data-day="${attr(day.id)}">×</button>
      <button type="button" class="activity-edit" data-edit-block="${attr(b.id)}" data-day="${attr(day.id)}" title="Edit duration">✎</button>
    </div>`;
  }

  function calculateActivityPosition(b) {
    if (b.hour == null) return { top: 0, height: 30 };
    const dur = b.duration || 60;
    const topPx = hourToTimelineTop(b.hour) + (b.minute || 0);
    const heightPx = Math.max(dur, 40);
    return { top: topPx, height: heightPx };
  }

  function bindTimelineInteractions(root) {
    root.querySelectorAll('[data-select-day]').forEach(hdr => {
      const pick = () => {
        selectedDayId = hdr.dataset.selectDay;
        renderCalendar();
        renderBacklog();
        toast('Day selected — use Add to day or drag onto this column');
      };
      hdr.addEventListener('click', pick);
      hdr.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
    });

    root.querySelectorAll('[data-auto-day]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        autoScheduleDay(btn.dataset.autoDay);
      });
    });

    root.querySelectorAll('[data-edit-block]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        showEditDurationDialog(btn.dataset.editBlock, btn.dataset.day);
      });
    });

    bindDropZones(root);
    bindDragSources(root);
    bindBlockActions(root);
  }

  function showEditDurationDialog(blockId, dayId) {
    const day = state.days.find(d => d.id === dayId);
    const block = day?.blocks.find(b => b.id === blockId);
    const activity = block ? getActivity(block.placeId) : null;

    if (!block || !activity) return;

    const current = clampDur(block.duration || getDuration(block.placeId));
    const dialog = document.createElement('dialog');
    dialog.className = 'timeline-dialog';
    dialog.innerHTML = `
      <div class="dialog-form">
        <h3 style="margin: 0 0 0.5rem; font-size: 1rem; color: var(--ink);">${esc(activity.name)}</h3>
        <label for="duration-select">How long to enjoy</label>
        <select id="duration-select">
          ${durationOptionsHtml(current)}
        </select>
        <label for="duration-custom" style="margin-top:0.6rem;">Custom (hours & minutes)</label>
        <div class="dur-custom-row">
          <input type="number" id="duration-custom-h" min="0" max="12" step="1" value="${Math.floor(current / 60)}" aria-label="Hours">
          <span>hr</span>
          <input type="number" id="duration-custom-m" min="0" max="59" step="5" value="${current % 60}" aria-label="Minutes">
          <span>min</span>
        </div>
        <p class="dur-hint">Set any length — e.g. a Broadway show is 3 hr.</p>
        <div class="dialog-actions">
          <button class="btn-cancel" onclick="this.closest('dialog').close()">Cancel</button>
          <button class="btn-save" id="save-duration">Save</button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);
    dialog.showModal();

    const selEl = dialog.querySelector('#duration-select');
    const hEl = dialog.querySelector('#duration-custom-h');
    const mEl = dialog.querySelector('#duration-custom-m');
    const syncCustomFromSelect = () => {
      const v = parseInt(selEl.value, 10) || 60;
      hEl.value = Math.floor(v / 60);
      mEl.value = v % 60;
    };
    selEl.addEventListener('change', syncCustomFromSelect);

    dialog.querySelector('#save-duration').addEventListener('click', () => {
      const h = parseInt(hEl.value, 10) || 0;
      const m = parseInt(mEl.value, 10) || 0;
      const total = h * 60 + m;
      block.duration = clampDur(total || parseInt(selEl.value, 10) || 60);
      saveState();
      renderAll();
      dialog.close();
      dialog.remove();
      toast('Set to ' + durationLabel(block.duration));
    });

    dialog.addEventListener('close', () => dialog.remove());
  }

  function dayChipHtml(b, day) {
    const a = getActivity(b.placeId);
    if (!a) return '';
    const dur = b.duration || getDuration(b.placeId);
    const timeLabel = b.hour != null ? formatRange(b.hour, dur) : 'No time yet';
    const cc = catClass(a);
    return `<div class="day-chip ${cc} ${b.hour == null ? 'untimed' : ''}" draggable="true"
      data-block-id="${attr(b.id)}" data-place-id="${attr(b.placeId)}" data-day-id="${attr(day.id)}" data-hour="${b.hour ?? ''}">
      <div class="chip-content">
        <span class="chip-name">${esc(a.name)}</span>
        <span class="chip-enjoy">${enjoyLabel(dur)}</span>
        <span class="chip-time">${timeLabel}</span>
      </div>
      <span class="chip-emoji">${catEmoji(a)}</span>
      <button type="button" class="chip-remove" data-remove-block="${attr(b.id)}" data-day="${attr(day.id)}">×</button>
    </div>`;
  }

  function renderHoursPanel(dayId) {
    const day = state.days.find(d => d.id === dayId);
    if (!day) return '';
    const dt = new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    const untimed = day.blocks.filter(b => b.hour == null);
    let html = `<div class="hours-head"><strong>${esc(dt)}</strong><span>Your day in route order from home — drag to adjust</span></div>`;
    if (untimed.length) {
      html += `<div class="untimed-row"><span class="untimed-label">Unscheduled:</span>${untimed.map(b => {
        const a = getActivity(b.placeId);
        const dur = b.duration || getDuration(b.placeId);
        return a ? `<span class="untimed-chip" draggable="true" data-block-id="${attr(b.id)}" data-place-id="${attr(b.placeId)}" data-day-id="${attr(day.id)}" title="${attr(enjoyLabel(dur))}">${esc(a.name)} <em>${esc(enjoyLabel(dur))}</em></span>` : '';
      }).join('')}</div>`;
    }
    html += '<div class="calendar-grid hours-grid"><div class="cal-header corner"></div><div class="cal-header">Schedule</div>';
    getScheduleHours().forEach(hour => {
      const blocked = hourSlotBlocked(day.date, hour);
      html += `<div class="cal-hour">${formatHour(hour)}</div>`;
      html += `<div class="cal-slot${blocked ? ' slot-blocked' : ''}" data-drop-day="${attr(day.id)}" data-drop-hour="${hour}" data-drop-type="hour"${blocked ? ' title="Blocked — flight"' : ''}>`;
      if (blocked) {
        const res = getFlightReservationsForDay(day.date).find(r =>
          rangesOverlap(hour, hour + 1, r.start, r.end)
        );
        if (res) html += `<div class="slot-flight-label">${esc(res.label)}</div>`;
      }
      day.blocks.filter(b => blockInHour(b, hour)).forEach(b => {
        const a = getActivity(b.placeId);
        if (a) html += blockHtml(b, a, day.id, day.date);
      });
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function blockHtml(b, a, dayId, dayDate) {
    const past = isBlockPast(dayDate, b);
    const reviewHtml = b.review?.rating
      ? `<div class="block-review">★ ${b.review.rating}/5${b.review.note ? ' — ' + esc(b.review.note) : ''}</div>`
      : past
        ? `<button type="button" class="btn-rate" data-rate-block="${attr(b.id)}" data-day="${attr(dayId)}">Rate this stop</button>`
        : '';
    return `<div class="block ${catClass(a)}" draggable="true" data-block-id="${attr(b.id)}" data-place-id="${attr(b.placeId)}" data-day-id="${attr(dayId)}" data-hour="${b.hour}">
      <button type="button" class="remove" data-remove-block="${attr(b.id)}" data-day="${attr(dayId)}">×</button>
      <div class="block-name">${catEmoji(a)} ${esc(a.name)}</div>
      <div class="block-enjoy">${enjoyLabel(b.duration)}</div>
      <div class="block-time">${formatRange(b.hour, b.duration)}</div>
      ${reviewHtml}
      <div class="block-actions">
        <a class="link-btn" href="${mapsUrl(a)}" target="_blank" rel="noopener">Maps</a>
        ${requiresTicket(a) ? `<a class="link-btn" href="${ticketUrlForActivity(a)}" target="_blank" rel="noopener">Tickets</a>` : ''}
        <a class="link-btn" href="${googleCalendarUrl(b, a, dayDate)}" target="_blank" rel="noopener">Calendar</a>
      </div>
    </div>`;
  }

  function bindCalendarInteractions(root) {
    root.querySelectorAll('.day-column').forEach(col => {
      col.addEventListener('click', e => {
        if (e.target.closest('button, a, .day-chip, .day-drop')) {
          if (!e.target.closest('.day-col-head')) return;
        }
        selectedDayId = col.dataset.dayId;
        renderCalendar();
      });
    });

    root.querySelectorAll('[data-expand-day]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openTimeView(btn.dataset.expandDay);
      });
    });

    root.querySelectorAll('[data-auto-day]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        autoScheduleDay(btn.dataset.autoDay);
      });
    });

    root.querySelectorAll('.day-drop').forEach(zone => {
      zone.addEventListener('click', e => {
        if (selectedPlaceId && !e.target.closest('.day-chip, button')) {
          addToDay(selectedPlaceId, zone.dataset.dropDay);
        }
      });
    });

    bindDropZones(root);
    bindDragSources(root);
    bindBlockActions(root);
  }

  function bindHoursPanel(panel) {
    bindDropZones(panel);
    bindDragSources(panel);
    bindBlockActions(panel);
    panel.querySelectorAll('[data-edit-block]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        showEditDurationDialog(btn.dataset.editBlock, btn.dataset.day);
      });
    });
  }

  function addToDay(placeId, dayId, hour = null) {
    const day = state.days.find(d => d.id === dayId);
    if (!day || !placeId) return;
    if (scheduledIds().has(placeId)) return toast('Already on your trip');
    if (neverAgainIds().has(placeId)) return toast('On your Never Again list');
    if (day.blocks.some(b => b.placeId === placeId)) return toast('Already on this day');
    const dur = getDuration(placeId);
    if (hour != null && blockTimeBlocked(day.date, hour, dur)) {
      return toast('That time is blocked — ' + (flightBlockReason(day.date, hour, dur) || 'flight'));
    }
    day.blocks.push({
      id: 'b-' + Date.now(),
      placeId,
      hour,
      duration: getDuration(placeId),
    });
    selectedPlaceId = null;
    selectedDayId = dayId;
    saveState();
    renderAll();
    toast(hour != null ? 'Scheduled ' + formatHour(hour) : 'Added to day — removed from backlog');
  }

  function autoScheduleDay(dayId) {
    const day = state.days.find(d => d.id === dayId);
    if (!day || !day.blocks.length) return toast('Add stops to this day first');

    const home = getHome();
    let pool = day.blocks.map(b => ({ block: b, act: getActivity(b.placeId) })).filter(x => x.act);
    if (!pool.length) return toast('Could not schedule these stops');

    const ordered = [];
    let cur = { lat: home?.lat, lng: home?.lng };
    while (pool.length) {
      pool.sort((a, b) => distMi(a.act, cur) - distMi(b.act, cur));
      const next = pool.shift();
      ordered.push(next.block);
      cur = { lat: next.act.lat, lng: next.act.lng };
    }

    const { start: schedStart, end: schedEnd } = getDaySchedule();
    const DAY_START = schedStart + 1;
    const DAY_END = schedEnd - 0.5;
    const GAP = 0.25;
    let t = DAY_START;
    let overflow = false;

    const advancePastBlocks = () => {
      while (t < DAY_END && hourSlotBlocked(day.date, Math.floor(t))) {
        const res = getFlightReservationsForDay(day.date).find(r =>
          rangesOverlap(t, t + 0.5, r.start, r.end)
        );
        t = res ? res.end + GAP : t + 0.25;
      }
    };

    ordered.forEach(block => {
      block.duration = getDuration(block.placeId);
      advancePastBlocks();
      block.hour = Math.round(t * 4) / 4;
      if (blockTimeBlocked(day.date, block.hour, block.duration)) {
        advancePastBlocks();
        block.hour = Math.round(t * 4) / 4;
      }
      const end = block.hour + block.duration / 60;
      if (end > DAY_END) overflow = true;
      t = end + GAP;
      advancePastBlocks();
    });

    maybeInsertHiddenStreet(day, ordered, t);
    day.blocks = ordered;
    openTimeView(dayId);
    saveState();
    renderAll();
    toast(
      overflow
        ? 'Auto-scheduled — day is tight; drag to adjust times'
        : 'Auto-scheduled in route order from home'
    );
  }

  function maybeInsertHiddenStreet(day, ordered, nextTime) {
    const hidden = getNearbyHiddenStreets(day);
    if (!hidden.length) return;
    const h = hidden[0];
    const placeId = ensureCustomExcursion({ ...h, placeId: h.id });
    if (ordered.some(b => b.placeId === placeId)) return;
    const block = {
      id: 'b-' + Date.now() + '-hidden',
      placeId,
      duration: h.duration || 30,
      hour: null,
    };
    const { end: schedEnd } = getDaySchedule();
    if (nextTime + block.duration / 60 <= schedEnd - 0.25 && !blockTimeBlocked(day.date, nextTime, block.duration)) {
      block.hour = Math.round(nextTime * 4) / 4;
    }
    ordered.push(block);
    toast('Auto day added nearby hidden street: ' + h.name);
  }

  function getSuggestions() {
    const scheduled = scheduledIds();
    const hoodScores = {};
    state.days.forEach(d => {
      d.blocks.forEach(b => {
        const a = getActivity(b.placeId);
        if (a?.neighborhood) hoodScores[a.neighborhood] = (hoodScores[a.neighborhood] || 0) + 2;
      });
    });

    const candidates = allActivities().filter(a => {
      const id = activityId(a);
      return id !== state.homeBase?.placeId && !scheduled.has(id) && !neverAgainIds().has(id);
    });

    return candidates
      .map(a => {
        let score = 0;
        if (a.neighborhood && hoodScores[a.neighborhood]) score += hoodScores[a.neighborhood] * 3;
        score += Math.max(0, 5 - distFromHome(a));
        return { a, score };
      })
      .filter(x => x.score > 0)
      .sort((x, y) => y.score - x.score)
      .slice(0, 12)
      .map(x => x.a);
  }

  function renderBacklog() {
    const el = document.getElementById('backlog');
    const suggestionsEl = document.getElementById('suggestions');
    const neverEl = document.getElementById('never-again');
    const scheduled = scheduledIds();
    const banned = neverAgainIds();
    const unscheduled = allActivities().filter(a => {
      const id = activityId(a);
      return id !== state.homeBase?.placeId && !scheduled.has(id) && !banned.has(id);
    });

    const q = (document.getElementById('backlog-search')?.value || '').trim().toLowerCase();
    const view = state.backlogView || 'all';
    const filtered = unscheduled.filter(a => backlogMatchesSearch(a, q));

    const countText =
      (q ? filtered.length + ' shown' : unscheduled.length + ' in backlog') +
      ' · ' +
      scheduled.size +
      ' on trip' +
      (banned.size ? ' · ' + banned.size + ' never again' : '');
    document.getElementById('backlog-count').textContent = countText;
    const top = document.getElementById('backlog-count-top');
    if (top) top.textContent = countText;

    document.querySelectorAll('[data-backlog-view]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.backlogView === view);
    });

    const suggestions = getSuggestions().filter(a => backlogMatchesSearch(a, q));
    const suggestIds = new Set(suggestions.map(a => activityId(a)));
    const mainList = filtered.filter(a => !suggestIds.has(activityId(a)));

    if (suggestionsEl) {
      if (suggestions.length) {
        suggestionsEl.innerHTML =
          '<h3 class="suggest-title">Suggested for you</h3><div class="spots-grid">' +
          suggestions.map(a => backlogCard(a, true)).join('') +
          '</div>';
        bindBacklogCards(suggestionsEl);
      } else if (!q) {
        suggestionsEl.innerHTML =
          '<p class="suggest-empty">Add spots to your days — we\'ll suggest nearby favorites still in your backlog.</p>';
      } else {
        suggestionsEl.innerHTML = '';
      }
    }

    if (!mainList.length && !suggestions.length) {
      el.innerHTML = q
        ? '<p class="empty-msg">No spots match your search.</p>'
        : '<p class="empty-msg">Everything on your list is on your trip days. Remove a stop from a day to see it here again.</p>';
    } else if (view === 'all') {
      const sorted = [...mainList].sort((a, b) => distFromHome(a) - distFromHome(b));
      el.innerHTML =
        (sorted.length
          ? '<h3 class="hood-title">All backlog <span>' +
            sorted.length +
            '</span></h3><div class="spots-grid">' +
            sorted.map(a => backlogCard(a, false)).join('') +
            '</div>'
          : '') +
        (suggestions.length
          ? ''
          : !sorted.length
            ? '<p class="empty-msg">See suggestions above, or everything is on your trip.</p>'
            : '');
    } else if (view === 'types') {
      const byCat = {};
      mainList.forEach(a => {
        const c = getCategory(a);
        (byCat[c] = byCat[c] || []).push(a);
      });
      el.innerHTML = CAT_ORDER
        .filter(c => byCat[c]?.length)
        .map(c => {
          const spots = byCat[c].sort((a, b) => distFromHome(a) - distFromHome(b));
          return `<div class="hood-section">
          <h3 class="hood-title cat-${c}"><span class="cat-badge">${esc(CAT_LABELS[c])}</span> <span>${spots.length}</span></h3>
          <div class="hood-scroll">${spots.map(a => backlogCard(a, false)).join('')}</div>
        </div>`;
        })
        .join('');
    } else {
      const byHood = {};
      mainList.forEach(a => {
        const hood = a.neighborhood || 'Other';
        (byHood[hood] = byHood[hood] || []).push(a);
      });
      const hoodOrder = Object.keys(byHood).sort((a, b) => {
        const minA = Math.min(...byHood[a].map(x => distFromHome(x)));
        const minB = Math.min(...byHood[b].map(x => distFromHome(x)));
        return minA - minB || a.localeCompare(b);
      });
      el.innerHTML = hoodOrder
        .map(hood => {
          const spots = byHood[hood].sort((a, b) => distFromHome(a) - distFromHome(b));
          return `<div class="hood-section">
          <h3 class="hood-title">${esc(hood)} <span>${spots.length}</span></h3>
          <div class="hood-scroll">${spots.map(a => backlogCard(a, false)).join('')}</div>
        </div>`;
        })
        .join('');
    }

    bindBacklogCards(el);
    if (suggestionsEl && suggestions.length) bindBacklogCards(suggestionsEl);
    renderNeverAgain(neverEl, q);
  }

  function renderNeverAgain(el, q) {
    if (!el) return;
    const items = getNeverAgainActivities()
      .filter(a => backlogMatchesSearch(a, q))
      .sort((a, b) => {
        const ta = state.neverAgain[activityId(a)]?.at || '';
        const tb = state.neverAgain[activityId(b)]?.at || '';
        return tb.localeCompare(ta);
      });
    if (!items.length) {
      el.innerHTML = '';
      el.hidden = true;
      return;
    }
    el.hidden = false;
    el.innerHTML =
      '<div class="never-again-section">' +
      '<h3 class="never-again-title">NEVER AGAIN</h3>' +
      '<p class="never-again-hint">Poor reviews (1–2 stars) — hidden from your main backlog.</p>' +
      '<div class="spots-grid">' +
      items.map(a => neverAgainCard(a)).join('') +
      '</div></div>';
  }

  function neverAgainCard(a) {
    const id = activityId(a);
    const meta = state.neverAgain[id] || {};
    const cc = catClass(a);
    const stars = '★'.repeat(meta.rating || 0) + '☆'.repeat(5 - (meta.rating || 0));
    return `<article class="spot-card never-again-card ${cc}">
      <h4>${catEmoji(a)} ${esc(a.name)}</h4>
      <p class="never-again-stars">${stars}</p>
      ${meta.note ? `<p class="never-again-note">${esc(meta.note)}</p>` : ''}
      <p class="spot-meta">${esc(a.neighborhood || 'NYC')}</p>
      <div class="spot-actions">
        <a class="link-btn" href="${mapsUrl(a)}" target="_blank" rel="noopener">Maps</a>
      </div>
    </article>`;
  }

  function backlogCard(a, isSuggest) {
    const id = activityId(a);
    const sel = selectedPlaceId === id ? ' selected' : '';
    const dur = getDuration(id);
    const cc = catClass(a);
    return `<article class="spot-card ${cc}${sel}${isSuggest ? ' suggest' : ''}" draggable="true" data-place-id="${attr(id)}">
      <h4>${catEmoji(a)} ${esc(a.name)}</h4>
      <p class="spot-enjoy">${enjoyLabel(dur)}</p>
      <p class="spot-meta">${esc(a.neighborhood || 'NYC')}</p>
      <span class="spot-duration-badge">${dur} min</span>
      <div class="spot-actions">
        <button type="button" class="btn-add" data-place-id="${attr(id)}">Add to day</button>
        ${
          a.custom
            ? `<a class="link-btn" href="${attr(state.mapsListUrl || DEFAULT_MAPS_LIST_URL)}" target="_blank" rel="noopener">Open Maps list</a>`
            : `<a class="link-btn" href="${mapsUrl(a)}" target="_blank" rel="noopener">Maps</a>`
        }
      </div>
    </article>`;
  }

  function bindBacklogCards(root) {
    root.querySelectorAll('.spot-card').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('a, button')) return;
        const id = card.dataset.placeId;
        selectedPlaceId = selectedPlaceId === id ? null : id;
        document.querySelectorAll('.spot-card').forEach(c =>
          c.classList.toggle('selected', c.dataset.placeId === selectedPlaceId)
        );
        document.querySelectorAll('.day-col, .timeline-day-header').forEach(s =>
          s.classList.toggle('selected-target', !!selectedPlaceId)
        );
        toast(selectedPlaceId ? 'Drag onto a day column, or tap a day header then Add to day' : 'Cleared');
      });
    });
    root.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (!selectedDayId) {
          toast('Tap a day header on the calendar first, then Add to day');
          return;
        }
        addToDay(btn.dataset.placeId, selectedDayId);
      });
    });
    bindDragSources(root);
  }

  function parseDragData(e) {
    try {
      const raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain');
      if (raw) return JSON.parse(raw);
    } catch (err) {}
    return dragPayload;
  }

  function bindDragSources(root) {
    root.querySelectorAll('[draggable="true"]').forEach(el => {
      el.addEventListener('dragstart', e => {
        if (el.dataset.blockId) {
          dragPayload = {
            type: 'block',
            blockId: el.dataset.blockId,
            placeId: el.dataset.placeId,
            fromDay: el.dataset.dayId,
            hour: el.dataset.hour !== '' ? parseFloat(el.dataset.hour) : null,
          };
        } else {
          dragPayload = { type: 'backlog', placeId: el.dataset.placeId };
        }
        const json = JSON.stringify(dragPayload);
        e.dataTransfer.setData(DRAG_MIME, json);
        e.dataTransfer.setData('text/plain', json);
        e.dataTransfer.effectAllowed = 'move';
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => {
        el.classList.remove('dragging');
        dragPayload = null;
      });
    });
  }

  function applyDrop(payload, dayId, hour, dropType) {
    const day = state.days.find(d => d.id === dayId);
    if (!day || !payload) return;

    if (payload.type === 'backlog' && scheduledIds().has(payload.placeId)) {
      toast('Already on your trip');
      return;
    }
    if (payload.type === 'backlog' && neverAgainIds().has(payload.placeId)) {
      toast('On your Never Again list');
      return;
    }
    if (payload.type === 'backlog' && day.blocks.some(b => b.placeId === payload.placeId)) {
      toast('Already on this day');
      return;
    }

    if (payload.type === 'block') {
      const from = state.days.find(d => d.id === payload.fromDay);
      const block = from?.blocks.find(b => b.id === payload.blockId);
      if (!block || !from) return;
      from.blocks = from.blocks.filter(b => b.id !== block.id);
      if (dropType === 'hour' && hour != null) {
        if (blockTimeBlocked(day.date, hour, block.duration)) {
          from.blocks.push(block);
          toast('That time is blocked — ' + (flightBlockReason(day.date, hour, block.duration) || 'flight'));
          return;
        }
        block.hour = hour;
        day.blocks.push(block);
      } else if (dropType === 'day') {
        block.hour = null;
        day.blocks.push(block);
      }
    } else if (!scheduledIds().has(payload.placeId) && !neverAgainIds().has(payload.placeId) && !day.blocks.some(b => b.placeId === payload.placeId)) {
      const dur = getDuration(payload.placeId);
      const schedHour = dropType === 'hour' && hour != null ? hour : null;
      if (schedHour != null && blockTimeBlocked(day.date, schedHour, dur)) {
        toast('That time is blocked — ' + (flightBlockReason(day.date, schedHour, dur) || 'flight'));
        return;
      }
      day.blocks.push({
        id: 'b-' + Date.now(),
        placeId: payload.placeId,
        hour: schedHour,
        duration: dur,
      });
    }

    selectedPlaceId = null;
    selectedDayId = dayId;
    saveState();
    renderAll();
    if (payload.type === 'backlog') {
      toast(
        dropType === 'hour' && hour != null
          ? 'Scheduled ' + formatHour(hour) + ' on ' + dayLabel(day)
          : 'Added to ' + dayLabel(day)
      );
    }
  }

  function dayLabel(day) {
    return new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  }

  function bindDropZones(root) {
    root.querySelectorAll('[data-drop-day]').forEach(zone => {
      if (zone.dataset.dropBound) return;
      zone.dataset.dropBound = '1';
      const dropType = zone.dataset.dropType || (zone.dataset.dropHour ? 'hour' : 'day');
      const hour = zone.dataset.dropHour != null ? parseInt(zone.dataset.dropHour, 10) : null;

      zone.addEventListener('dragover', e => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        zone.classList.add('drag-over');
      });
      zone.addEventListener('dragleave', e => {
        if (zone.contains(e.relatedTarget)) return;
        zone.classList.remove('drag-over');
      });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        zone.classList.remove('drag-over');
        if (zone.classList.contains('drop-blocked')) {
          const day = state.days.find(d => d.id === zone.dataset.dropDay);
          toast('That time is blocked for a flight');
          return;
        }
        const payload = parseDragData(e);
        if (!payload) {
          toast('Drop failed — try again');
          return;
        }
        applyDrop(payload, zone.dataset.dropDay, hour, dropType);
      });
    });
  }

  function bindBlockActions(root) {
    root.querySelectorAll('[data-remove-block]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const day = state.days.find(d => d.id === btn.dataset.day);
        if (day) {
          day.blocks = day.blocks.filter(b => b.id !== btn.dataset.removeBlock);
          saveState();
          renderAll();
          toast('Back in backlog');
        }
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
