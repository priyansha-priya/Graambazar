/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DailyChecklistItem,
  SafetyExamQuestion,
  SafetyTrainingModule,
} from '../types/safety';

export const PASSING_EXAM_SCORE_PERCENT = 80;

/* ============================================================================
 * 1. FOOD SELLER TRAINING MODULES (11 Core Safety & Hygiene Standards)
 * ========================================================================== */
export const FOOD_TRAINING_MODULES: SafetyTrainingModule[] = [
  {
    id: 'food_mod_01',
    track: 'FOOD',
    moduleNumber: 1,
    title: 'Personal Hygiene & Handwashing',
    hindiTitle: 'व्यक्तिगत स्वच्छता और हाथ धोना',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Every food handler must maintain clean hands, trimmed nails, covered hair, and clean clothing to stop bacterial transfer before touching ingredients or cooked meals.',
    keyStandards: [
      'Wash hands with soap and clean running water for at least 20 seconds before cooking, after toilet breaks, handling cash, or touching waste.',
      'Keep fingernails short, clean, and free of polish; remove rings and loose wrist accessories during food prep.',
      'Wear a clean apron and hairnet/cap while cooking or packing meals.',
      'Staff with open cuts must wear waterproof bandages; staff with fever, diarrhea, or skin infections must not handle food.',
    ],
    doPractices: [
      'Maintain a dedicated handwash station with liquid soap and clean towel/air-dry near the kitchen entry.',
      'Wash hands immediately after counting customer currency notes.',
    ],
    dontPractices: [
      'Do not wipe hands on aprons or kitchen rags used for cleaning counters.',
      'Do not smoke, chew paan/gutkha, or cough over open utensils.',
    ],
    criticalControlPoint:
      'Mandatory 20-second soap handwash after handling raw produce, currency, or mobile phones.',
    villagePracticalTip:
      'Keep a small tap-fitted plastic bucket with liquid soap right outside the kitchen doorway if piped water is intermittent.',
  },
  {
    id: 'food_mod_02',
    track: 'FOOD',
    moduleNumber: 2,
    title: 'Kitchen & Food Preparation Area Cleanliness',
    hindiTitle: 'रसोई और खाना बनाने के स्थान की सफाई',
    durationMinutes: 6,
    mandatory: true,
    summary:
      'A spotless, well-ventilated kitchen prevents cross-contamination, grease buildup, and pest attraction throughout service hours.',
    keyStandards: [
      'Clean and disinfect cooking slabs, gas stoves, and chopping surfaces before opening and after every rush shift.',
      'Keep floors dry, grease-free, and swept regularly; clear drains daily with mesh traps.',
      'Store utensils inverted on clean racks elevated at least 15 cm above the floor.',
      'Ensure adequate lighting and smoke exhaust so dirt or spoilage is clearly visible.',
    ],
    doPractices: [
      'Follow a clean-as-you-go habit between thali and snack batches.',
      'Use separate clean cloths for food-prep tables vs. floor/stove grease.',
    ],
    dontPractices: [
      'Never chop vegetables directly on the floor or unwashed wooden planks.',
      'Never leave unwashed kadais or oil trays overnight.',
    ],
    criticalControlPoint:
      'Zero stagnant water, food spills, or uncovered leftover batter on prep surfaces.',
    villagePracticalTip:
      'Use smooth steel or granite prep surfaces that wash clean quickly without absorbing oil and spices.',
  },
  {
    id: 'food_mod_03',
    track: 'FOOD',
    moduleNumber: 3,
    title: 'Safe Food Handling & Serving Practices',
    hindiTitle: 'सुरक्षित भोजन संभालना और परोसना',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Minimize bare-hand contact with ready-to-eat dishes like salads, chutneys, rotis, sweets, and snacks during plating and packing.',
    keyStandards: [
      'Use clean tongs, ladles, spoons, or food-grade gloves when packing samosas, jalebi, mithai, and salads.',
      'Taste dishes using a separate clean tasting spoon — never re-dip the tasting spoon into the cooking pot.',
      'Avoid reusing deep-frying oil once it turns dark, thick, smoky, or foamy (max 2–3 frying cycles).',
      'Keep ready-to-eat sweets and chaat covered inside glass or fine mesh display cases.',
    ],
    doPractices: [
      'Hold plates and containers by their outer rims, never touching the inside surface.',
      'Filter frying oil daily and replace degraded oil promptly.',
    ],
    dontPractices: [
      'Never serve hot oily snacks wrapped directly in printed newspaper ink.',
      'Never blow air with your mouth into polybags to open them.',
    ],
    criticalControlPoint:
      'Zero bare-hand handling of ready-to-eat sweets, chutneys, and sliced salads.',
    villagePracticalTip:
      'Use inexpensive stainless-steel tongs for samosas, kachoris, and tandoori rotis — customers notice and trust it immediately.',
  },
  {
    id: 'food_mod_04',
    track: 'FOOD',
    moduleNumber: 4,
    title: 'Raw & Cooked Food Separation',
    hindiTitle: 'कच्चे और पके भोजन का अलगाव',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Raw vegetables, raw paneer/dairy, and raw meats carry soil and bacteria that easily contaminate cooked meals if tools or shelves are shared.',
    keyStandards: [
      'Use dedicated knives and chopping boards for raw unwashed produce versus cooked/ready-to-eat items.',
      'Inside refrigerators, always store cooked dishes and chutneys on upper shelves and raw items in sealed containers on lower shelves.',
      'Wash root vegetables (potatoes, onions, ginger) in a separate basin away from cooked food counters.',
      'Maintain strict vegetarian and non-vegetarian utensil segregation if both are prepared.',
    ],
    doPractices: [
      'Color-code or clearly label chopping boards and storage boxes.',
      'Keep all cooked gravies covered with tight lids while raw prep happens nearby.',
    ],
    dontPractices: [
      'Never place cooked paneer or cut salad on a board that just held unwashed muddy vegetables.',
      'Never store raw milk or raw vegetables above uncovered cooked dal or sweets.',
    ],
    criticalControlPoint:
      'Physical separation of raw prep utensils and lower-shelf raw storage inside coolers.',
    villagePracticalTip:
      'Tie a simple colored cloth tag or etch "RAW" / "COOKED" on knife handles so every kitchen helper follows the rule.',
  },
  {
    id: 'food_mod_05',
    track: 'FOOD',
    moduleNumber: 5,
    title: 'Food Storage & Temperature Management',
    hindiTitle: 'भोजन भंडारण और तापमान प्रबंधन',
    durationMinutes: 6,
    mandatory: true,
    summary:
      'Bacteria multiply rapidly in the Temperature Danger Zone (5°C to 60°C). Proper cooling, hot-holding, and reheating keep food safe.',
    keyStandards: [
      'Keep hot cooked food above 60°C until packed; keep refrigerated dairy, paneer, curd, and chutneys below 5°C.',
      'Do not leave cooked rice, dal, milk sweets, or gravies at village room temperature for more than 2 hours in summer.',
      'Reheat previously chilled gravies thoroughly to steaming hot (above 75°C) only once — never reheat repeatedly.',
      'Label stored gravies and dough with preparation date and time.',
    ],
    doPractices: [
      'Cook in smaller fresh batches aligned to morning, lunch, and dinner order peaks.',
      'Check fridge cooling daily, especially during summer voltage fluctuations.',
    ],
    dontPractices: [
      'Never mix today’s freshly cooked dal or curry with yesterday’s leftover batch.',
      'Never pack steaming hot food directly into airtight containers for overnight refrigeration without cooling first.',
    ],
    criticalControlPoint:
      'Keep perishable food out of the 5°C–60°C Danger Zone for more than 2 hours.',
    villagePracticalTip:
      'Use insulated steel hot-cases during lunch rush and prepare fresh chutneys twice daily in hot weather.',
  },
  {
    id: 'food_mod_06',
    track: 'FOOD',
    moduleNumber: 6,
    title: 'Ingredient Freshness & Expiry Checking',
    hindiTitle: 'सामग्री की ताज़गी और एक्सपायरी जांच',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Safe meals begin with fresh, unspoiled raw ingredients, verified oil and masala packs, and daily morning stock inspection.',
    keyStandards: [
      'Inspect dairy (milk, paneer, curd, khoya), vegetables, and bread every morning for smell, color, sourness, or mold.',
      'Verify FSSAI license number and Best Before / Expiry dates on packaged oil, butter, sauces, and spices before purchasing.',
      'Reject dented, puffed, or leaking tins and pouches immediately.',
      'Store dry ingredients like besan, maida, and spices in airtight containers to avoid lumps and weevils.',
    ],
    doPractices: [
      'Use First-In First-Out (FIFO) when opening new spice and oil packs.',
      'Buy milk, paneer, and vegetables daily from trusted local suppliers.',
    ],
    dontPractices: [
      'Never mask souring paneer or stale vegetables with extra chili or garam masala.',
      'Never use expired sauces, baking powder, or synthetic food colors.',
    ],
    criticalControlPoint:
      'Morning freshness check of milk, paneer, khoya, and packaged expiry labels before first order.',
    villagePracticalTip:
      'Keep a small marker pen in the kitchen to write the opening date on bulk sauce bottles and masala jars.',
  },
  {
    id: 'food_mod_07',
    track: 'FOOD',
    moduleNumber: 7,
    title: 'Safe & Potable Water Usage',
    hindiTitle: 'सुरक्षित और शुद्ध पानी का उपयोग',
    durationMinutes: 4,
    mandatory: true,
    summary:
      'Contaminated water causes rapid waterborne illness. Drinking, cooking, ice, chutney-grinding, and final utensil rinse water must be potable.',
    keyStandards: [
      'Use filtered, RO, or boiled-and-cooled potable water for cooking, making tea/lassi/chutneys, and washing salads.',
      'Keep water storage drums covered with tight lids and fitted with taps — never dip cups by hand into storage drums.',
      'Clean and scrub water tanks/drums at least once a week.',
      'Ensure ice used in lassi, buttermilk, or cold drinks is made strictly from safe drinking water.',
    ],
    doPractices: [
      'Use a long-handled clean steel ladle if a water container does not have a tap.',
      'Keep separate water containers for cooking vs. utensil washing.',
    ],
    dontPractices: [
      'Never use untreated open-well or cloudy borewell water for chutneys or cold drinks.',
      'Never leave drinking water vessels uncovered near flies or dust.',
    ],
    criticalControlPoint:
      '100% potable, covered, tap-dispensed water for cooking, chutneys, and beverages.',
    villagePracticalTip:
      'A ceramic candle filter or boiling + covered steel matka provides reliable safe water even without electricity.',
  },
  {
    id: 'food_mod_08',
    track: 'FOOD',
    moduleNumber: 8,
    title: 'Cleaning & Sanitization Protocols',
    hindiTitle: 'सफाई और सैनिटाइजेशन नियम',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Cleaning removes visible oil and food residue; sanitization kills invisible microbes on dishes, boards, and prep surfaces.',
    keyStandards: [
      'Follow the 3-step wash process: scrape food scraps → wash with hot soapy water → rinse thoroughly with clean water and air-dry.',
      'Sanitize chopping boards, knives, mixer jars, and counter tops daily using hot water or food-safe sanitizer.',
      'Store all detergents, phenyl, and floor cleaners in a locked/separate bottom cabinet far away from food and spices.',
      'Wash kitchen dusters and aprons daily with soap and dry them in direct sunlight.',
    ],
    doPractices: [
      'Air-dry steel plates and containers upside down on slotted drying racks.',
      'Deep-clean mixer-grinder blades and gaskets every evening.',
    ],
    dontPractices: [
      'Never reuse soapy wash water once it turns greasy or murky.',
      'Never store phenyl or dishwash liquid in recycled cooking oil or water bottles.',
    ],
    criticalControlPoint:
      'Strict chemical separation and daily sanitization of mixer jars, knives, and prep slabs.',
    villagePracticalTip:
      'Sunlight drying of steel trays, chopping boards, and clean cloths naturally reduces moisture and bacteria.',
  },
  {
    id: 'food_mod_09',
    track: 'FOOD',
    moduleNumber: 9,
    title: 'Food Packaging & Delivery Safety',
    hindiTitle: 'फूड पैकेजिंग और डिलीवरी सुरक्षा',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Clean, food-grade, tamper-evident packaging keeps meals hot, spill-free, and protected across village roads during delivery.',
    keyStandards: [
      'Pack hot curries, dal, and snacks only in food-grade containers, aluminum foil pouches, or butter paper — never thin recycled black plastic or newspaper.',
      'Seal containers tightly and apply tamper-evident tape/staple-free stickers (avoid metal staples near food).',
      'Separate hot items (dal, sabzi, rotis) from cold items (raita, salad, lassi) inside delivery bags.',
      'Clean and wipe delivery runner bags daily; ensure runners never place food bags directly on muddy ground.',
    ],
    doPractices: [
      'Double-check order items, chutney packs, and special notes before sealing.',
      'Use spill-proof round containers for liquid gravies and raita.',
    ],
    dontPractices: [
      'Never staple directly through foil packs where metal pins can fall into food.',
      'Never pack raw onions/raita inside the same hot pouch as crispy samosas or rotis.',
    ],
    criticalControlPoint:
      'Food-grade, spill-proof, staple-free sealed packaging inside clean runner bags.',
    villagePracticalTip:
      'Place a cardboard separator inside the runner’s delivery box so liquid gravy containers stay upright on bumpy rural lanes.',
  },
  {
    id: 'food_mod_10',
    track: 'FOOD',
    moduleNumber: 10,
    title: 'Waste Management & Pest Prevention',
    hindiTitle: 'कचरा प्रबंधन और कीट नियंत्रण',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Covered waste bins and sealed entry points eliminate flies, cockroaches, ants, and rodents from food zones.',
    keyStandards: [
      'Use foot-operated covered dustbins lined with bags; empty bins before they exceed 75% capacity and every night.',
      'Segregate wet kitchen waste from dry packaging waste and dispose of it outside the kitchen zone.',
      'Install fine mesh screens on windows/doors and seal floor cracks or wall gaps.',
      'Keep stray animals away from cooking and serving areas; schedule regular safe pest control outside cooking hours.',
    ],
    doPractices: [
      'Wash and disinfect dustbins every evening after disposal.',
      'Inspect behind gas cylinders, flour sacks, and fridge coils weekly for pest signs.',
    ],
    dontPractices: [
      'Never spray chemical insecticide while food, utensils, or ingredients are uncovered.',
      'Never pile vegetable peels or food scraps outside the kitchen door.',
    ],
    criticalControlPoint:
      'Covered lined dustbins emptied nightly and zero pests/flies in cooking and display zones.',
    villagePracticalTip:
      'Close gaps under wooden doors with a simple rubber strip to block rodents and crawling insects at night.',
  },
  {
    id: 'food_mod_11',
    track: 'FOOD',
    moduleNumber: 11,
    title: 'Customer Handling & Food Complaint Resolution',
    hindiTitle: 'ग्राहक व्यवहार और शिकायत समाधान',
    durationMinutes: 4,
    mandatory: true,
    summary:
      'Respectful communication and rapid, honest resolution of missing or quality-flagged items turn complaints into lifelong village trust.',
    keyStandards: [
      'Accept or reject incoming orders promptly within the 5-minute accept window and honor promised prep times.',
      'Respond politely and calmly to any customer concern about spice level, temperature, spillage, or missing items.',
      'Immediately replace spoiled, spilled, or wrong items or issue an instant refund/credit without argument.',
      'Log recurring complaints (e.g., leaking containers, soggy rotis) and fix the root cause in kitchen workflow.',
    ],
    doPractices: [
      'Call the customer proactively if an item is unavailable before substituting.',
      'Verify delivery address landmark and phone number with the runner before dispatch.',
    ],
    dontPractices: [
      'Never argue with a customer reporting stale or contaminated food.',
      'Never silently substitute an item without customer consent.',
    ],
    criticalControlPoint:
      'Fast, polite replacement/refund on verified food quality or spillage complaints.',
    villagePracticalTip:
      'In a village community, one politely resolved complaint earns more repeat families than any discount offer.',
  },
];

/* ============================================================================
 * 2. GROCERY SELLER TRAINING MODULES (11 Core Quality & Storage Standards)
 * ========================================================================== */
export const GROCERY_TRAINING_MODULES: SafetyTrainingModule[] = [
  {
    id: 'groc_mod_01',
    track: 'GROCERY',
    moduleNumber: 1,
    title: 'Product Quality & Brand Authenticity',
    hindiTitle: 'उत्पाद गुणवत्ता और असली ब्रांड पहचान',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Village families rely on their local kirana for genuine, unadulterated staples and branded goods. Always source from authorized distributors.',
    keyStandards: [
      'Purchase packaged staples, oils, dairy, and FMCG brands strictly from authorized distributors with valid GST/purchase bills.',
      'Verify FSSAI license number, AGMARK/ISI seal (where applicable), and intact tamper seals on edible oils, ghee, honey, and spices.',
      'Inspect spelling, print clarity, and holograms to avoid counterfeit look-alike products.',
      'Reject unlabelled or suspiciously cheap loose edible oil and adulterated spice powders.',
    ],
    doPractices: [
      'Keep supplier invoices organized for batch traceability if a quality issue arises.',
      'Showcase verified AGMARK/FSSAI sealed packs prominently.',
    ],
    dontPractices: [
      'Never sell counterfeit look-alike soap, oil, or masala brands.',
      'Never refill branded oil tins or spice jars with inferior loose stock.',
    ],
    criticalControlPoint:
      '100% genuine, authorized-source products with intact manufacturer seals and valid FSSAI markings.',
    villagePracticalTip:
      'Check the back label for the FSSAI 14-digit number and customer care details whenever trying a new wholesale supplier.',
  },
  {
    id: 'groc_mod_02',
    track: 'GROCERY',
    moduleNumber: 2,
    title: 'Expiry Date & Batch Checking',
    hindiTitle: 'एक्सपायरी डेट और बैच नंबर जांच',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Selling expired biscuits, dairy, oil, or baby food harms health and breaks marketplace rules. Perform daily shelf expiry audits.',
    keyStandards: [
      'Check Manufacturing Date (MFD), Expiry Date (EXP), and Best Before dates on arrival from distributors and before packing every online order.',
      'Immediately remove expired products and place them in a clearly marked "DO NOT SELL / RETURN" bin away from shop shelves.',
      'Flag near-expiry stock (within 15–30 days for packaged snacks/dairy, 3 days for bread/milk) for priority review or supplier return.',
      'Record batch numbers for high-turnover items like cooking oil, infant nutrition, and packaged flour.',
    ],
    doPractices: [
      'Conduct a weekly 15-minute expiry sweep across dairy, snacks, beverages, and masalas.',
      'Verify expiry dates again at the packing counter before sealing customer bags.',
    ],
    dontPractices: [
      'Never scratch, overwrite, or stick price tags over manufacturing or expiry dates.',
      'Never bundle near-expired goods into online orders without explicit customer knowledge.',
    ],
    criticalControlPoint:
      'Zero expired items on shelves or packed into any customer order.',
    villagePracticalTip:
      'Maintain a small notebook or chalkboard behind the counter listing the next-expiring dairy and bread dates.',
  },
  {
    id: 'groc_mod_03',
    track: 'GROCERY',
    moduleNumber: 3,
    title: 'Product Storage & Preservation',
    hindiTitle: 'उत्पाद भंडारण और संरक्षण',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Heat, humidity, sunlight, and floor dampness rapidly spoil groceries. Proper shelving and airflow preserve freshness and shelf life.',
    keyStandards: [
      'Store all food sacks, cartons, and drums on wooden/plastic pallets at least 15 cm off the floor and away from damp walls.',
      'Keep edible oils, chocolates, biscuits, and spices away from direct afternoon sunlight and hot metal shutters.',
      'Maintain refrigerator temperatures below 5°C for milk, curd, paneer, butter, and cold beverages.',
      'Ensure store roofs and windows are leak-proof during monsoon to prevent fungal spoilage.',
    ],
    doPractices: [
      'Leave narrow airflow gaps between wall and grain sacks.',
      'Use shade curtains if afternoon sun hits snack and oil racks.',
    ],
    dontPractices: [
      'Never stack atta or rice bags directly on bare damp cement floors.',
      'Never turn off the dairy refrigerator overnight to save electricity.',
    ],
    criticalControlPoint:
      'Elevated dry pallet storage (15 cm off floor) and continuous cold-chain (<5°C) for dairy.',
    villagePracticalTip:
      'Simple plastic crates or wooden planks under 25 kg/50 kg sacks prevent monsoon dampness and rodent nesting.',
  },
  {
    id: 'groc_mod_04',
    track: 'GROCERY',
    moduleNumber: 4,
    title: 'Handling of Packaged & Unpackaged Products',
    hindiTitle: 'पैक्ड और खुले सामान की सुरक्षित हैंडलिंग',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Packaged items need intact seals while loose kirana items require hygienic scoops, food-grade pouches, and clean hands.',
    keyStandards: [
      'Keep unpackaged sugar, poha, dal, rice, and jaggery inside clean, tightly lidded steel or food-grade plastic drums.',
      'Use clean, dry stainless-steel scoops dedicated to each bin — avoid scooping loose food with bare sweaty hands.',
      'Pack loose items in fresh, clean, food-grade poly pouches or paper bags with clear weight labels.',
      'Wipe dust off packaged bottles, pouches, and cartons before handing over or packing for delivery.',
    ],
    doPractices: [
      'Label loose packed pouches with product name, net weight (e.g., 500g / 1 Pav), and packing date.',
      'Pack heavy items (atta, oil, rice) at the bottom and fragile items (eggs, bread, chips) on top.',
    ],
    dontPractices: [
      'Never pack loose sugar or spices in torn or previously used bags.',
      'Never put leaking oil pouches in the same bag as flour or biscuits.',
    ],
    criticalControlPoint:
      'Clean dedicated scoops for loose bins and food-grade sealed packing with weight labels.',
    villagePracticalTip:
      'Pre-weigh popular local quantities (250g Pav, 500g, 1 kg) during quiet afternoon hours in sealed labeled pouches for fast hygienic dispatch.',
  },
  {
    id: 'groc_mod_05',
    track: 'GROCERY',
    moduleNumber: 5,
    title: 'Damaged Product Identification',
    hindiTitle: 'खराब और फटे पैकेट की पहचान',
    durationMinutes: 4,
    mandatory: true,
    summary:
      'Torn pouches, bloated cans, rusted lids, and crushed cartons signal contamination or spoilage and must never be dispatched.',
    keyStandards: [
      'Inspect every incoming distributor shipment for torn seals, oil seepage, swollen tetra-packs, or rodent bite marks.',
      'Immediately quarantine dented/puffed cans, clumped salt/sugar, or discolored dal.',
      'Check egg shells for cracks and fresh produce for bruising or rot before bagging.',
      'Never tape over a punctured biscuit, atta, or spice packet to sell at full price.',
    ],
    doPractices: [
      'Maintain a separate "Damaged / Return to Distributor" carton out of customer reach.',
      'Perform a 5-second visual squeeze & seal check on every item while packing orders.',
    ],
    dontPractices: [
      'Never dispatch leaking milk/oil packs hoping they survive delivery.',
      'Never sell swollen curd cups or bloated juice cartons.',
    ],
    criticalControlPoint:
      'Zero torn, leaking, puffed, or pest-bitten packages dispatched to customers.',
    villagePracticalTip:
      'Place fragile glass jars and soft bread loaves inside a separate inner paper bag during runner bike delivery.',
  },
  {
    id: 'groc_mod_06',
    track: 'GROCERY',
    moduleNumber: 6,
    title: 'Stock Rotation Using FIFO & FEFO Principles',
    hindiTitle: 'FIFO और FEFO स्टॉक रोटेशन नियम',
    durationMinutes: 6,
    mandatory: true,
    summary:
      'Smart stock rotation eliminates expired losses and guarantees village customers always receive fresh goods.',
    keyStandards: [
      'FIFO (First-In, First-Out): Place newly arrived stock behind older stock so earlier arrivals sell first.',
      'FEFO (First-Expired, First-Out): Always prioritize selling items with the earliest expiry date first, even if they arrived in a later shipment.',
      'Apply FEFO strictly to dairy, bakery, biscuits, edible oils, packaged atta, and baby food.',
      'Avoid over-ordering slow-moving perishable items beyond 2–3 weeks of village demand.',
    ],
    doPractices: [
      'Restock shelves from the back whenever a new distributor delivery arrives.',
      'Review slow-moving shelf items every Sunday before placing Monday wholesale orders.',
    ],
    dontPractices: [
      'Never push old stock to the back corner of a shelf where it gets forgotten until expiry.',
      'Never dump new loose grain on top of old grain at the bottom of a drum without emptying and cleaning first.',
    ],
    criticalControlPoint:
      'Consistent front-facing FEFO rotation on all dated food items and empty-before-refill on loose bins.',
    villagePracticalTip:
      'Before pouring a new sack of dal or sugar into a counter drum, empty the remaining 2–3 kg into a clean bowl, wipe the drum dry, pour new stock in, and place the older stock on top.',
  },
  {
    id: 'groc_mod_07',
    track: 'GROCERY',
    moduleNumber: 7,
    title: 'Storage of Food Away from Contamination',
    hindiTitle: 'खाद्य पदार्थों को केमिकल और गंदगी से अलग रखना',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'Kirana shops stock soaps, detergents, phenyl, kerosene/oils, and mosquito coils alongside food — strict zoning prevents toxic contamination and odor transfer.',
    keyStandards: [
      'Store all detergents, washing powders, soaps, toilet cleaners, phenyl, and insecticides in a completely separate rack/aisle away from food items.',
      'Never place chemical bottles above food sacks or open grain bins where leaks could drip onto food.',
      'Keep strong-smelling items (agarbatti, naphthalene balls, camphor, soap) far away from tea leaves, biscuits, flour, and rice.',
      'Always pack household cleaners (detergent, dishwash, phenyl) in a separate carry bag from groceries during customer delivery.',
    ],
    doPractices: [
      'Create a dedicated "Home Care & Cleaning" zone on the opposite side of the shop from grains and snacks.',
      'Double-bag liquid cleaners and keep them upright in a separate delivery bag.',
    ],
    dontPractices: [
      'Never stack detergent bars next to tea packs, atta, or biscuit packets.',
      'Never pack phenyl or mosquito liquid in the same bag as vegetables, bread, or pulses.',
    ],
    criticalControlPoint:
      'Dedicated non-food chemical shelving and mandatory separate bagging for cleaners during delivery.',
    villagePracticalTip:
      'Use a distinctly colored bag (or tie a clear knot tag) for soap/detergent items so runners and customers never mix them with kitchen food.',
  },
  {
    id: 'groc_mod_08',
    track: 'GROCERY',
    moduleNumber: 8,
    title: 'Proper Handling of Grains, Pulses, Spices & Oils',
    hindiTitle: 'अनाज, दाल, मसाले और तेल का सही रखरखाव',
    durationMinutes: 6,
    mandatory: true,
    summary:
      'Grains, pulses, spices, and mustard/refined oils form the backbone of village groceries and require dry, airtight, moisture-free care.',
    keyStandards: [
      'Keep wheat atta, rice, besan, and pulses in dry, airtight containers to prevent moisture clumping, weevils (ghun), and fungal aflatoxins.',
      'Store whole and ground spices (haldi, mirch, dhaniya, jeera) in opaque airtight jars away from sunlight and steam to preserve aroma and color.',
      'Inspect loose grains and pulses daily for stones, dust, webbing, or insects; sieve and clean before packing.',
      'Keep cooking oil pouches/tins upright in cool shaded areas so oil does not turn rancid.',
    ],
    doPractices: [
      'Dry-wipe steel scoops before dipping into spice or flour bins — never use a wet scoop.',
      'Place dried neem leaves in a clean muslin pouch outside/around sealed bulk storage racks (never loose inside customer packs) as natural protection.',
    ],
    dontPractices: [
      'Never leave atta or besan sacks open overnight in humid weather.',
      'Never sell rancid-smelling oil, clumped spices, or insect-infested pulses.',
    ],
    criticalControlPoint:
      'Airtight, dry, weevil-free storage for grains/pulses and opaque shaded storage for spices and oils.',
    villagePracticalTip:
      'During rainy season, keep smaller quantities of loose atta/besan in counter bins and keep backup sacks sealed inside thick liner bags.',
  },
  {
    id: 'groc_mod_09',
    track: 'GROCERY',
    moduleNumber: 9,
    title: 'Weighing Accuracy & Local Units (Pav / Kg)',
    hindiTitle: 'सही तौल और स्थानीय इकाइयाँ (पाव / किलो)',
    durationMinutes: 4,
    mandatory: true,
    summary:
      'Honest, calibrated digital weighing builds unmatched credibility in village commerce for both standard kg/g and local Pav/Adha-Kilo orders.',
    keyStandards: [
      'Use a verified, government-stamped digital weighing scale reset cleanly to 0.000 kg (tare weight excluded) before every weigh-in.',
      'Ensure accurate conversion for local rural units: 1 Pav = 250g, Adha Kilo = 500g, Teen Pav = 750g, 1 Kilo = 1000g.',
      'Keep the weighing pan clean and dry between weighing spices, sugar, and pulses.',
      'Clearly display the exact weight on loose grocery packets matching the customer’s invoice.',
    ],
    doPractices: [
      'Check scale zero-calibration every morning with a standard 1 kg test weight.',
      'Tare (zero out) thick bowls or trays before weighing loose food.',
    ],
    dontPractices: [
      'Never include heavy cardboard or wet packing weight as product weight.',
      'Never use rusted, unverified iron weights or tilted scales.',
    ],
    criticalControlPoint:
      'Calibrated zero-tared digital scale matching exact invoiced weight (g / Pav / kg).',
    villagePracticalTip:
      'Place a small laminated weight conversion chart (250g = 1 Pav) near the packing counter for helper staff.',
  },
  {
    id: 'groc_mod_10',
    track: 'GROCERY',
    moduleNumber: 10,
    title: 'Store Cleanliness, Moisture & Pest Prevention',
    hindiTitle: 'दुकान की सफाई, नमी और चूहा-कीट नियंत्रण',
    durationMinutes: 5,
    mandatory: true,
    summary:
      'A clean, bright, pest-free kirana store protects stock value, prevents disease, and delights walk-in and online shoppers.',
    keyStandards: [
      'Sweep and mop the store floor daily; dust shelves and wipe counter surfaces every morning.',
      'Keep spilled sugar, rice, or flour swept up immediately so ants, cockroaches, and rats are not attracted.',
      'Seal shutter base gaps, wall holes, and drain openings with wire mesh.',
      'Keep covered waste bins for torn cartons and plastic wrap; clear trash daily.',
    ],
    doPractices: [
      'Inspect dark bottom corners and pallet spaces twice a week for rodent droppings or chewed packets.',
      'Use safe mechanical traps along outer walls instead of open poison near food sacks.',
    ],
    dontPractices: [
      'Never scatter open rat poison near edible grains, biscuits, or floor pallets.',
      'Never leave cardboard boxes piled damp against outer walls.',
    ],
    criticalControlPoint:
      'Zero pest droppings, sealed shutter gaps, and daily swept/mopped aisles.',
    villagePracticalTip:
      'Clean swept floors and bright LED lighting immediately elevate customer perception of freshness and quality.',
  },
  {
    id: 'groc_mod_11',
    track: 'GROCERY',
    moduleNumber: 11,
    title: 'Fair MRP Pricing, Billing & Customer Resolution',
    hindiTitle: 'सही MRP, स्पष्ट बिल और ग्राहक समाधान',
    durationMinutes: 4,
    mandatory: true,
    summary:
      'Transparent pricing within MRP, honest weight billing, and quick replacement of damaged items sustain loyal village households.',
    keyStandards: [
      'Never charge above printed Maximum Retail Price (MRP) on any packaged product.',
      'Verify every item against the digital packing slip before handing the bag to the delivery runner.',
      'Offer prompt replacement or instant credit/Udhari adjustment if a customer reports a torn pack, short weight, or expired item.',
      'Confirm any out-of-stock brand substitution with the customer by phone before packing.',
    ],
    doPractices: [
      'Keep digital catalog prices updated weekly with market grain/oil rates.',
      'Check Udhari entries transparently and share clear totals with customers.',
    ],
    dontPractices: [
      'Never add hidden charges beyond MRP or listed delivery fee.',
      'Never send a different brand or smaller weight pack without asking the customer first.',
    ],
    criticalControlPoint:
      'Strict MRP compliance, verified packing slips, and no unapproved substitutions.',
    villagePracticalTip:
      'Tick off each item on the terminal packing queue before calling the runner to eliminate missing-item complaints.',
  },
];

/* ============================================================================
 * 3. CATEGORY-SPECIFIC DAILY SELF-AUDIT CHECKLISTS
 * ========================================================================== */
export const FOOD_DAILY_CHECKLIST: DailyChecklistItem[] = [
  {
    id: 'fchk_01',
    track: 'FOOD',
    section: 'Personal Hygiene',
    title: 'All kitchen staff washed hands with soap, trimmed nails & wore clean apron/cap',
    hindiTitle: 'सभी स्टाफ ने साबुन से हाथ धोए, नाखून कटे और साफ एप्रन/कैप पहना',
    weight: 12,
    critical: true,
  },
  {
    id: 'fchk_02',
    track: 'FOOD',
    section: 'Personal Hygiene',
    title: 'Handwash station stocked with soap, running water & clean towel',
    hindiTitle: 'हाथ धोने के स्थान पर साबुन, साफ पानी और स्वच्छ तौलिया उपलब्ध',
    weight: 8,
    critical: false,
  },
  {
    id: 'fchk_03',
    track: 'FOOD',
    section: 'Kitchen & Prep Area',
    title: 'Cooking slabs, stoves, chopping boards & mixer jars cleaned and sanitized',
    hindiTitle: 'रसोई स्लैब, गैस स्टोव, चॉपिंग बोर्ड और मिक्सर जार साफ व सैनिटाइज्ड',
    weight: 12,
    critical: true,
  },
  {
    id: 'fchk_04',
    track: 'FOOD',
    section: 'Raw & Cooked Separation',
    title: 'Raw vegetables/dairy separated from cooked dishes; separate knives & boards used',
    hindiTitle: 'कच्ची सामग्री और पका भोजन अलग-अलग बर्तन व चाकू से तैयार',
    weight: 12,
    critical: true,
  },
  {
    id: 'fchk_05',
    track: 'FOOD',
    section: 'Ingredients & Water',
    title: 'Morning check completed: milk, paneer, vegetables fresh; no expired spices/sauces',
    hindiTitle: 'सुबह दूध, पनीर, सब्ज़ियाँ ताज़ा जांची गईं; कोई एक्सपायर्ड मसाला/सॉस नहीं',
    weight: 12,
    critical: true,
  },
  {
    id: 'fchk_06',
    track: 'FOOD',
    section: 'Ingredients & Water',
    title: 'Potable filtered/boiled water used for cooking, tea & chutneys; drums covered with taps',
    hindiTitle: 'खाना व चटनी में शुद्ध ढका हुआ पीने का पानी (नल सहित ड्रम) उपयोग',
    weight: 10,
    critical: true,
  },
  {
    id: 'fchk_07',
    track: 'FOOD',
    section: 'Storage & Temperature',
    title: 'Hot foods kept steaming (>60°C), dairy/chutneys chilled (<5°C), frying oil fresh & clean',
    hindiTitle: 'गर्म भोजन >60°C, डेयरी/चटनी <5°C और तलने का तेल साफ-ताज़ा',
    weight: 10,
    critical: false,
  },
  {
    id: 'fchk_08',
    track: 'FOOD',
    section: 'Packaging & Delivery',
    title: 'Food-grade spill-proof containers ready; zero newspaper or metal staples near food',
    hindiTitle: 'फूड-ग्रेड लीक-प्रूफ पैकिंग तैयार; अखबार या स्टेपल पिन का उपयोग नहीं',
    weight: 10,
    critical: false,
  },
  {
    id: 'fchk_09',
    track: 'FOOD',
    section: 'Waste & Pest Control',
    title: 'Covered lined dustbins in place; kitchen free of flies, cockroaches & rodents',
    hindiTitle: 'ढके हुए कूड़ेदान उपलब्ध; रसोई मक्खी, कॉकरोच और चूहों से मुक्त',
    weight: 8,
    critical: true,
  },
  {
    id: 'fchk_10',
    track: 'FOOD',
    section: 'Cleaning & Chemicals',
    title: 'Detergents and floor cleaners stored strictly away from food ingredients & utensils',
    hindiTitle: 'डिटर्जेंट और फिनाइल खाद्य सामग्री व बर्तनों से पूरी तरह अलग रखे हैं',
    weight: 6,
    critical: false,
  },
];

export const GROCERY_DAILY_CHECKLIST: DailyChecklistItem[] = [
  {
    id: 'gchk_01',
    track: 'GROCERY',
    section: 'Expiry & Batch Audit',
    title: 'Daily expiry check done on dairy, bread, biscuits & snacks; zero expired stock on shelves',
    hindiTitle: 'डेयरी, ब्रेड, बिस्कुट व स्नैक्स की एक्सपायरी जांच पूरी; शेल्फ पर कोई एक्सपायर्ड सामान नहीं',
    weight: 14,
    critical: true,
  },
  {
    id: 'gchk_02',
    track: 'GROCERY',
    section: 'Stock Rotation (FIFO/FEFO)',
    title: 'Earlier-expiring (FEFO) and older batches rotated to front of shelves',
    hindiTitle: 'जल्दी एक्सपायर होने वाला (FEFO) और पुराना स्टॉक शेल्फ में आगे रखा गया',
    weight: 10,
    critical: false,
  },
  {
    id: 'gchk_03',
    track: 'GROCERY',
    section: 'Contamination Prevention',
    title: 'Detergents, soaps, phenyl & insecticides kept in separate rack away from all food items',
    hindiTitle: 'साबुन, डिटर्जेंट, फिनाइल और कीटनाशक खाद्य पदार्थों से अलग रैक में रखे हैं',
    weight: 14,
    critical: true,
  },
  {
    id: 'gchk_04',
    track: 'GROCERY',
    section: 'Storage & Preservation',
    title: 'Grain, atta & rice sacks stored on dry pallets at least 15 cm above floor & away from walls',
    hindiTitle: 'अनाज, आटा व चावल की बोरियाँ फर्श से 15 सेमी ऊपर सूखे पैलेट पर रखी हैं',
    weight: 10,
    critical: true,
  },
  {
    id: 'gchk_05',
    track: 'GROCERY',
    section: 'Grains, Pulses & Spices',
    title: 'Loose dal, rice, sugar & spices stored in airtight covered bins with clean dry scoops',
    hindiTitle: 'खुली दाल, चावल, चीनी और मसाले एयरटाइट डिब्बों में साफ सूखे स्कूप के साथ रखे हैं',
    weight: 12,
    critical: true,
  },
  {
    id: 'gchk_06',
    track: 'GROCERY',
    section: 'Cold Chain & Dairy',
    title: 'Refrigerator running properly (<5°C) for milk, curd, paneer & butter',
    hindiTitle: 'दूध, दही, पनीर और मक्खन के लिए फ्रिज सही तापमान (<5°C) पर चालू है',
    weight: 10,
    critical: true,
  },
  {
    id: 'gchk_07',
    track: 'GROCERY',
    section: 'Damaged Stock Check',
    title: 'Damaged, leaking, swollen or torn packets removed to separate return bin',
    hindiTitle: 'फटे, लीक, फूले या खराब पैकेट अलग रिटर्न कार्टन में हटाए गए',
    weight: 10,
    critical: false,
  },
  {
    id: 'gchk_08',
    track: 'GROCERY',
    section: 'Weighing & Packing',
    title: 'Digital weighing scale clean & zero-calibrated; clean food-grade packing bags stocked',
    hindiTitle: 'डिजिटल तौल कांटा साफ व ज़ीरो-कैलिब्रेटेड है; साफ फूड-ग्रेड पैकिंग बैग उपलब्ध',
    weight: 8,
    critical: false,
  },
  {
    id: 'gchk_09',
    track: 'GROCERY',
    section: 'Cleanliness & Pests',
    title: 'Shop floor swept/mopped, spills cleared, shutter gaps sealed & zero pest signs',
    hindiTitle: 'दुकान का फर्श साफ, गिरा अनाज हटाया गया और चूहे/कीट के कोई निशान नहीं',
    weight: 6,
    critical: false,
  },
  {
    id: 'gchk_10',
    track: 'GROCERY',
    section: 'Delivery Segregation',
    title: 'Separate bags prepared so soaps/cleaners are never packed with edible groceries',
    hindiTitle: 'साबुन/क्लीनर को खाने के सामान से अलग बैग में पैक करने की व्यवस्था तैयार',
    weight: 6,
    critical: false,
  },
];

/* ============================================================================
 * 4. CATEGORY-SPECIFIC CERTIFICATION EXAM QUESTIONS (10 MCQs Per Track)
 * ========================================================================== */
export const FOOD_EXAM_QUESTIONS: SafetyExamQuestion[] = [
  {
    id: 'fq_01',
    track: 'FOOD',
    topic: 'Personal Hygiene',
    question:
      'For how many seconds minimum should a food handler wash hands with soap and running water after handling cash or raw vegetables?',
    hindiHint: 'पैसे या कच्ची सब्ज़ी छूने के बाद कम से कम कितने सेकंड साबुन से हाथ धोने चाहिए?',
    options: ['5 seconds quick rinse', 'At least 20 seconds thoroughly', 'Only wipe with a dry towel', 'Water rinse without soap'],
    correctIndex: 1,
    explanation:
      'Washing thoroughly with soap and running water for at least 20 seconds removes germs transferred from cash, raw produce, and surfaces.',
  },
  {
    id: 'fq_02',
    track: 'FOOD',
    topic: 'Temperature Management',
    question:
      'Which temperature range is known as the "Temperature Danger Zone" where food-poisoning bacteria multiply fastest?',
    hindiHint: 'किस तापमान सीमा में बैक्टीरिया सबसे तेज़ी से बढ़ते हैं?',
    options: ['0°C to 4°C', '5°C to 60°C', '75°C to 100°C', '-18°C to 0°C'],
    correctIndex: 1,
    explanation:
      'Between 5°C and 60°C, harmful bacteria multiply rapidly. Keep chilled items below 5°C and hot cooked meals above 60°C.',
  },
  {
    id: 'fq_03',
    track: 'FOOD',
    topic: 'Raw & Cooked Separation',
    question:
      'When storing items inside a single kitchen refrigerator, where should cooked dal/chutney and raw unwashed vegetables be placed?',
    hindiHint: 'एक ही फ्रिज में पका भोजन और कच्ची सब्ज़ियाँ किस शेल्फ पर रखनी चाहिए?',
    options: [
      'Cooked food on top shelf (covered), raw items on lower shelf (sealed)',
      'Raw vegetables on top shelf, cooked food uncovered below',
      'Mixed together on the middle shelf',
      'Leave cooked food outside and refrigerate only dry spices',
    ],
    correctIndex: 0,
    explanation:
      'Keeping covered cooked food above sealed raw food stops soil or raw drips from contaminating ready-to-eat meals.',
  },
  {
    id: 'fq_04',
    track: 'FOOD',
    topic: 'Food Packaging & Delivery',
    question:
      'Which practice is SAFE when packing hot samosas, jalebis, or dal for village delivery?',
    hindiHint: 'गर्म समोसे, जलेबी या दाल पैक करने का सही सुरक्षित तरीका क्या है?',
    options: [
      'Wrap hot samosas directly in printed newspaper to soak oil',
      'Staple metal pins directly through open foil packets',
      'Use clean food-grade containers/butter paper sealed with tamper tape',
      'Pack cold raita and hot crispy samosas inside the same sealed pouch',
    ],
    correctIndex: 2,
    explanation:
      'Newspaper ink contains toxic chemicals and metal staples risk accidental ingestion. Always use food-grade packaging with tamper-evident tape.',
  },
  {
    id: 'fq_05',
    track: 'FOOD',
    topic: 'Safe Water Usage',
    question:
      'How should safe drinking and chutney-grinding water be dispensed from a kitchen storage drum?',
    hindiHint: 'रसोई के पानी के ड्रम से साफ पानी कैसे निकालना चाहिए?',
    options: [
      'Dip any steel tumbler by hand into the open drum',
      'Use a tightly covered drum fitted with a clean tap or dedicated long-handled ladle',
      'Leave the lid half open for ventilation',
      'Use untreated tap water for chutneys because spices kill germs',
    ],
    correctIndex: 1,
    explanation:
      'Hand-dipping contaminates the entire water drum. Always keep potable water covered and dispense via a tap or dedicated long-handled ladle.',
  },
  {
    id: 'fq_06',
    track: 'FOOD',
    topic: 'Ingredient Freshness',
    question:
      'During morning inspection, you notice fresh paneer smells slightly sour. What is the right action?',
    hindiHint: 'सुबह जांच में पनीर से हल्की खट्टी गंध आ रही है, तो सही कदम क्या है?',
    options: [
      'Wash it in hot water and add extra garam masala',
      'Deep fry it so the sour taste disappears',
      'Discard it immediately and source fresh paneer before accepting paneer orders',
      'Mix it half-and-half with fresh paneer',
    ],
    correctIndex: 2,
    explanation:
      'Spoiled dairy can cause severe food poisoning even after frying or spicing. Always discard spoiled ingredients immediately.',
  },
  {
    id: 'fq_07',
    track: 'FOOD',
    topic: 'Safe Food Handling',
    question:
      'What should you do when frying oil in your kadai becomes dark brown, sticky, and begins smoking heavily?',
    hindiHint: 'कड़ाही का तलने वाला तेल काला, गाढ़ा और धुआँ देने लगे तो क्या करें?',
    options: [
      'Top it up with a little fresh oil and keep frying all week',
      'Replace it with fresh oil and dispose of the degraded oil responsibly',
      'Add salt to clear the color',
      'Use it to make tadka for curries',
    ],
    correctIndex: 1,
    explanation:
      'Repeatedly overheated degraded oil forms toxic compounds (Total Polar Compounds) that harm heart and digestive health.',
  },
  {
    id: 'fq_08',
    track: 'FOOD',
    topic: 'Waste & Pest Prevention',
    question:
      'When is it acceptable to spray chemical insect spray inside the kitchen?',
    hindiHint: 'रसोई में कीटनाशक स्प्रे कब किया जा सकता है?',
    options: [
      'Anytime during lunch rush if flies appear',
      'Right next to covered spice jars while cooking',
      'Never during cooking — only after all food/utensils are removed or sealed and surfaces washed afterward',
      'Spray directly over dustbins next to the stove',
    ],
    correctIndex: 2,
    explanation:
      'Chemical pest control must only happen outside food-prep hours with all ingredients and utensils fully removed/covered, followed by thorough washing.',
  },
  {
    id: 'fq_09',
    track: 'FOOD',
    topic: 'Cleaning & Sanitization',
    question:
      'Where should dishwashing liquid, phenyl, and floor disinfectants be stored in a food shop?',
    hindiHint: 'बर्तन धोने का साबुन और फिनाइल कहाँ रखना चाहिए?',
    options: [
      'On the top rack above cooking oil tins',
      'In a clearly labeled, separate bottom cabinet completely away from food and utensils',
      'In empty mineral water bottles near the gas stove',
      'Next to salt and sugar containers for convenience',
    ],
    correctIndex: 1,
    explanation:
      'Cleaning chemicals must stay in original labeled bottles inside a separate lower storage area so leaks or mix-ups can never poison food.',
  },
  {
    id: 'fq_10',
    track: 'FOOD',
    topic: 'Customer Complaint Resolution',
    question:
      'A village customer calls saying their dal container spilled inside the delivery bag. What is the best response?',
    hindiHint: 'ग्राहक शिकायत करे कि डिलीवरी बैग में दाल गिर गई है, तो सबसे सही प्रतिक्रिया क्या होगी?',
    options: [
      'Blame the village road and refuse help',
      'Apologize politely, send a freshly packed spill-proof replacement or refund promptly, and fix container sealing',
      'Ignore the call and mark the order completed',
      'Ask the customer to pay extra delivery fee for replacement',
    ],
    correctIndex: 1,
    explanation:
      'Polite accountability, quick replacement/refund, and fixing the packaging root cause protect customer health and repeat village trust.',
  },
];

export const GROCERY_EXAM_QUESTIONS: SafetyExamQuestion[] = [
  {
    id: 'gq_01',
    track: 'GROCERY',
    topic: 'Stock Rotation (FIFO / FEFO)',
    question:
      'What does FEFO stand for in grocery store inventory management?',
    hindiHint: 'किराना स्टोर में FEFO नियम का पूरा अर्थ क्या है?',
    options: [
      'First-Earned, First-Ordered',
      'First-Expired, First-Out (sell items with earliest expiry date first)',
      'Fast-Entry, Fast-Outlet',
      'Final-Expiry, Free-Offer',
    ],
    correctIndex: 1,
    explanation:
      'FEFO (First-Expired, First-Out) ensures stock with the closest expiry date is placed at the front and sold before newer-expiring batches.',
  },
  {
    id: 'gq_02',
    track: 'GROCERY',
    topic: 'Contamination Prevention',
    question:
      'A customer orders 5 kg Chakki Atta, 1 kg Toor Dal, and 1 bottle of Toilet Cleaner / Phenyl. How must you pack this order?',
    hindiHint: 'आटा, दाल और फिनाइल एक ही ऑर्डर में हों तो पैकिंग कैसे करनी चाहिए?',
    options: [
      'Pack everything tightly in one big plastic bag to save bags',
      'Place phenyl on top of the atta pouch',
      'Pack phenyl/cleaners in a completely separate bag away from all food items',
      'Wrap phenyl in newspaper and put it next to the dal',
    ],
    correctIndex: 2,
    explanation:
      'Household cleaners and soaps must always be stored on separate racks and packed in a separate delivery bag to prevent chemical leakage or odor transfer into food.',
  },
  {
    id: 'gq_03',
    track: 'GROCERY',
    topic: 'Expiry Date & Batch Checking',
    question:
      'You discover 4 biscuit packets on your shelf expired 2 days ago. What must you do immediately?',
    hindiHint: 'शेल्फ पर 2 दिन पहले एक्सपायर हुए बिस्कुट पैकेट मिलें तो तुरंत क्या करें?',
    options: [
      'Sell them at 50% discount to clear stock',
      'Remove them immediately into a marked "DO NOT SELL / RETURN" bin away from shelves',
      'Include them as a free gift inside online orders',
      'Cover the expiry date with a price sticker',
    ],
    correctIndex: 1,
    explanation:
      'Selling or gifting expired food is illegal and unsafe. Always quarantine expired goods immediately away from active shelves.',
  },
  {
    id: 'gq_04',
    track: 'GROCERY',
    topic: 'Product Storage & Preservation',
    question:
      'How should bulk 25 kg or 50 kg sacks of wheat atta, rice, and sugar be stored in a kirana shop?',
    hindiHint: '25 या 50 किलो आटा, चावल और चीनी की बोरियाँ कैसे रखनी चाहिए?',
    options: [
      'Directly on bare cement floor against damp back walls',
      'Elevated on dry wooden/plastic pallets at least 15 cm off the floor with wall airflow gap',
      'Outside the shop shutter in direct sunlight',
      'Stacked under leaking detergent cartons',
    ],
    correctIndex: 1,
    explanation:
      'Pallet storage elevated 15 cm above the floor protects grains from floor dampness, fungus, and rodent nesting while allowing easy sweeping.',
  },
  {
    id: 'gq_05',
    track: 'GROCERY',
    topic: 'Handling Unpackaged Products',
    question:
      'What is the hygienic way to weigh and pack loose sugar, dal, or spices for a customer?',
    hindiHint: 'खुली चीनी, दाल या मसाले तौलने और पैक करने का स्वच्छ तरीका क्या है?',
    options: [
      'Scoop with bare hands and blow air into the polybag to open it',
      'Use a clean, dry dedicated scoop and seal into a fresh food-grade pouch with weight label',
      'Use the same wet spoon for sugar and chili powder',
      'Pack loose dal in old reused newspaper cones',
    ],
    correctIndex: 1,
    explanation:
      'Clean dry scoops prevent moisture clumping and hand contamination, while fresh food-grade pouches keep staples hygienic.',
  },
  {
    id: 'gq_06',
    track: 'GROCERY',
    topic: 'Damaged Product Identification',
    question:
      'A tetra-pack of milk or a tin of condensed milk looks puffed/swollen even though the expiry date is next month. What does this indicate?',
    hindiHint: 'एक्सपायरी से पहले ही दूध का पैकेट या टिन फूला हुआ दिखे तो इसका क्या मतलब है?',
    options: [
      'Extra quantity packed by the company',
      'Microbial gas spoilage or seal failure — must be rejected and NOT sold',
      'Normal summer air pressure — safe to sell',
      'Just refrigerate it until it shrinks back',
    ],
    correctIndex: 1,
    explanation:
      'Swollen or bloated food packs indicate bacterial gas buildup and spoilage. Never sell puffed cans, curd cups, or tetra-packs.',
  },
  {
    id: 'gq_07',
    track: 'GROCERY',
    topic: 'Grains, Pulses & Spices',
    question:
      'Why must ground spices (haldi, mirch, dhaniya) be stored in opaque airtight jars away from direct sunlight?',
    hindiHint: 'पिसे मसाले धूप से दूर एयरटाइट डिब्बों में क्यों रखने चाहिए?',
    options: [
      'Only to make the shelf look neat',
      'Sunlight and humidity destroy natural oils/aroma, fade color, and cause fungal clumping',
      'Spices become heavier in dark jars',
      'So customers cannot see the spice color',
    ],
    correctIndex: 1,
    explanation:
      'Heat, light, and moisture degrade spice essential oils and encourage mold growth. Airtight shaded containers keep spices potent and safe.',
  },
  {
    id: 'gq_08',
    track: 'GROCERY',
    topic: 'Weighing Accuracy & Local Units',
    question:
      'A customer orders "1 Pav" of jeera and "Adha Kilo" of toor dal. What exact net weights should your zero-tared digital scale show?',
    hindiHint: '"1 पाव" जीरा और "आधा किलो" तूर दाल का सही शुद्ध वजन कितना होता है?',
    options: [
      '200g jeera and 450g dal',
      '250g jeera and 500g dal (excluding scoop/tray tare weight)',
      '300g jeera and 500g dal including steel bowl weight',
      '250g total combined weight',
    ],
    correctIndex: 1,
    explanation:
      '1 Pav equals exactly 250 grams and Adha Kilo equals 500 grams of net product weight with container/tray tared to 0.000.',
  },
  {
    id: 'gq_09',
    track: 'GROCERY',
    topic: 'Pest Prevention',
    question:
      'Which rodent/pest control practice is SAFE inside a grocery store?',
    hindiHint: 'किराना दुकान में चूहा-कीट नियंत्रण का कौन-सा तरीका सुरक्षित है?',
    options: [
      'Sprinkle loose rat poison powder next to open rice sacks',
      'Seal shutter gaps, sweep spills immediately, keep bins airtight, and place enclosed mechanical traps away from food',
      'Spray mosquito killer over loose vegetable baskets',
      'Leave spilled flour overnight to see where rodents walk',
    ],
    correctIndex: 1,
    explanation:
      'Prevention through sealing entry gaps, airtight drums, zero food spills, and safe enclosed traps protects food from chemical poisoning.',
  },
  {
    id: 'gq_10',
    track: 'GROCERY',
    topic: 'Product Authenticity & Fair MRP',
    question:
      'An ordered cooking oil brand is temporarily out of stock, and a customer paid online. What is the right kirana practice?',
    hindiHint: 'ग्राहक द्वारा ऑर्डर किया गया तेल स्टॉक में न हो तो सही तरीका क्या है?',
    options: [
      'Send a cheaper unbranded pouch silently without telling the customer',
      'Charge Rs 15 above MRP for an alternative brand',
      'Call the customer to confirm an approved alternative brand/MRP or refund the item',
      'Send an older near-expired tin instead',
    ],
    correctIndex: 2,
    explanation:
      'Always seek explicit customer approval before substituting any brand or variant, and strictly honor MRP.',
  },
];

export const getTrainingModulesForTrack = (track: 'FOOD' | 'GROCERY'): SafetyTrainingModule[] =>
  track === 'FOOD' ? FOOD_TRAINING_MODULES : GROCERY_TRAINING_MODULES;

export const getChecklistItemsForTrack = (track: 'FOOD' | 'GROCERY'): DailyChecklistItem[] =>
  track === 'FOOD' ? FOOD_DAILY_CHECKLIST : GROCERY_DAILY_CHECKLIST;

export const getExamQuestionsForTrack = (track: 'FOOD' | 'GROCERY'): SafetyExamQuestion[] =>
  track === 'FOOD' ? FOOD_EXAM_QUESTIONS : GROCERY_EXAM_QUESTIONS;
