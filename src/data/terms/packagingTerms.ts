import type { ProductTerm } from '../productDictionary';

export const packagingTerms: ProductTerm[] = [
  // Boxes & Containers
  { term: "cardboard box", synonyms: ["carton", "paper box", "corrugated box", "shipping box", "kraft box"], relatedTerms: ["packaging", "shipping", "storage", "recyclable"], category: "packaging", subcategory: "boxes" },
  { term: "corrugated box", synonyms: ["rugated carton", "double wall", "single wall", "triple wall"], relatedTerms: ["packaging", "strong", "shipping", "industrial"], category: "packaging", subcategory: "boxes" },
  { term: "mailer box", synonyms: ["shipping box", "ecommerce box", "subscription box", "gift box"], relatedTerms: ["packaging", "retail", "direct to consumer", "branding"], category: "packaging", subcategory: "boxes" },
  { term: "rigid box", synonyms: ["setup box", "luxury box", "gift box", "premium packaging"], relatedTerms: ["packaging", "luxury", "high end", "presentation"], category: "packaging", subcategory: "boxes" },
  { term: "folding carton", synonyms: ["paperboard box", "folding box", "carton", "retail box"], relatedTerms: ["packaging", "retail", "lightweight", "cost effective"], category: "packaging", subcategory: "boxes" },
  { term: "plastic container", synonyms: ["plastic box", "tupperware", "storage container", "food container"], relatedTerms: ["packaging", "reusable", "food", "durable"], category: "packaging", subcategory: "containers" },
  { term: "glass jar", synonyms: ["mason jar", "preserving jar", "storage jar", "canning jar"], relatedTerms: ["packaging", "food", "preserving", "premium"], category: "packaging", subcategory: "containers" },
  { term: "tin can", synonyms: ["metal can", "aluminum can", "steel can", "aerosol can"], relatedTerms: ["packaging", "food", "beverage", "preservation"], category: "packaging", subcategory: "containers" },
  { term: "drum", synonyms: ["steel drum", "plastic drum", "fiber drum", "shipping drum", "55 gallon"], relatedTerms: ["packaging", "industrial", "bulk", "shipping"], category: "packaging", subcategory: "containers" },
  { term: "ibc tote", synonyms: ["intermediate bulk container", "bulk container", "liquid tote", "cage tote"], relatedTerms: ["packaging", "industrial", "bulk", "liquids"], category: "packaging", subcategory: "containers" },
  { term: "pallet box", synonyms: ["bulk bin", "gaylord", "large container", "octobin"], relatedTerms: ["packaging", "bulk", "shipping", "storage"], category: "packaging", subcategory: "containers" },
  { term: "crates", synonyms: ["wooden crate", "plastic crate", "shipping crate", "milk crate"], relatedTerms: ["packaging", "returnable", "durable", "agriculture"], category: "packaging", subcategory: "containers" },
  
  // Bags & Pouches
  { term: "plastic bag", synonyms: ["poly bag", "polyethylene bag", "clear bag", "ziplock bag"], relatedTerms: ["packaging", "flexible", "lightweight", "cost effective"], category: "packaging", subcategory: "bags" },
  { term: "paper bag", synonyms: ["kraft bag", "sos bag", "grocery bag", "lunch bag", "gift bag"], relatedTerms: ["packaging", "retail", "eco friendly", "biodegradable"], category: "packaging", subcategory: "bags" },
  { term: "stand up pouch", synonyms: ["doypack", "flexible pouch", "retort pouch", "spouted pouch"], relatedTerms: ["packaging", "food", "convenient", "modern"], category: "packaging", subcategory: "pouches" },
  { term: "flat pouch", synonyms: ["sachet", "three side seal", "pillow pouch", "stick pack"], relatedTerms: ["packaging", "single serve", "portion", "convenient"], category: "packaging", subcategory: "pouches" },
  { term: "zipper bag", synonyms: ["ziplock bag", "reclosable bag", "resealable pouch", "slider bag"], relatedTerms: ["packaging", "reusable", "convenient", "freshness"], category: "packaging", subcategory: "bags" },
  { term: "vacuum bag", synonyms: ["vacuum pouch", "barrier bag", "vacuum seal bag", "storage bag"], relatedTerms: ["packaging", "preservation", "long shelf life", "food"], category: "packaging", subcategory: "bags" },
  { term: "woven bag", synonyms: ["pp woven bag", "fibc", "big bag", "bulk bag", "jumbo bag"], relatedTerms: ["packaging", "industrial", "bulk", "agriculture"], category: "packaging", subcategory: "bags" },
  { term: "burlap bag", synonyms: ["hessian bag", "jute bag", "sack", "coffee bag", "rice bag"], relatedTerms: ["packaging", "natural", "agriculture", "breathable"], category: "packaging", subcategory: "bags" },
  { term: "foil bag", synonyms: ["mylar bag", "metallized bag", "foil pouch", "barrier bag"], relatedTerms: ["packaging", "high barrier", "protection", "premium"], category: "packaging", subcategory: "bags" },
  { term: "cellophane bag", synonyms: ["cello bag", "clear bag", "transparent bag", "opp bag"], relatedTerms: ["packaging", "retail", "gift", "transparent"], category: "packaging", subcategory: "bags" },
  { term: "drawstring bag", synonyms: ["pouch", "gift bag", "jewelry bag", "favor bag"], relatedTerms: ["packaging", "gift", "premium", "decorative"], category: "packaging", subcategory: "bags" },
  { term: "tote bag", synonyms: ["canvas bag", "reusable bag", "shopping bag", "promotional bag"], relatedTerms: ["packaging", "retail", "eco friendly", "branding"], category: "packaging", subcategory: "bags" },
  { term: "mailing bag", synonyms: ["poly mailer", "courier bag", "shipping bag", "express bag"], relatedTerms: ["packaging", "ecommerce", "shipping", "lightweight"], category: "packaging", subcategory: "bags" },
  { term: "gusseted bag", synonyms: ["side gusset bag", "bottom gusset", "stand up", "expandable"], relatedTerms: ["packaging", "volume", "capacity", "flexible"], category: "packaging", subcategory: "bags" },
  
  // Bottles & Jars
  { term: "plastic bottle", synonyms: ["pet bottle", "hdpe bottle", "water bottle", "soda bottle"], relatedTerms: ["packaging", "beverage", "lightweight", "recyclable"], category: "packaging", subcategory: "bottles" },
  { term: "glass bottle", synonyms: ["wine bottle", "beer bottle", "spirit bottle", "jar bottle"], relatedTerms: ["packaging", "premium", "recyclable", "premium"], category: "packaging", subcategory: "bottles" },
  { term: "dropper bottle", synonyms: ["serum bottle", "essential oil bottle", "tincture bottle", "pipette bottle"], relatedTerms: ["packaging", "pharma", "cosmetic", "precise"], category: "packaging", subcategory: "bottles" },
  { term: "pump bottle", synonyms: ["lotion bottle", "soap dispenser", "foam bottle", "serum pump"], relatedTerms: ["packaging", "cosmetic", "convenient", "hygienic"], category: "packaging", subcategory: "bottles" },
  { term: "spray bottle", synonyms: ["mist bottle", "trigger bottle", "atomizer", "spray can"], relatedTerms: ["packaging", "household", "cosmetic", "application"], category: "packaging", subcategory: "bottles" },
  { term: "squeeze bottle", synonyms: ["sauce bottle", "ketchup bottle", "dispensing bottle", "flip top"], relatedTerms: ["packaging", "food", "convenient", "controlled"], category: "packaging", subcategory: "bottles" },
  { term: "pharma bottle", synonyms: ["pill bottle", "medicine bottle", "pharmaceutical", "prescription"], relatedTerms: ["packaging", "medical", "safety", "regulatory"], category: "packaging", subcategory: "bottles" },
  { term: "cosmetic jar", synonyms: ["cream jar", "salve jar", "balm container", "compact"], relatedTerms: ["packaging", "beauty", "cream", "premium"], category: "packaging", subcategory: "jars" },
  { term: "amber bottle", synonyms: ["brown bottle", "uv protection", "pharma amber", "light sensitive"], relatedTerms: ["packaging", "protection", "pharma", "specialty"], category: "packaging", subcategory: "bottles" },
  { term: "ampoule", synonyms: ["vial", "single dose", "breakable ampoule", "pharma ampoule"], relatedTerms: ["packaging", "pharma", "sterile", "single use"], category: "packaging", subcategory: "pharma" },
  { term: "vial", synonyms: ["small bottle", "sample vial", "test tube", "lab vial"], relatedTerms: ["packaging", "pharma", "lab", "small"], category: "packaging", subcategory: "pharma" },
  { term: "syringe", synonyms: ["disposable syringe", "injector", "medical syringe", "prefilled"], relatedTerms: ["packaging", "medical", "injection", "sterile"], category: "packaging", subcategory: "pharma" },
  
  // Films & Wraps
  { term: "stretch wrap", synonyms: ["stretch film", "pallet wrap", "shrink wrap", "cling film"], relatedTerms: ["packaging", "shipping", "protection", "industrial"], category: "packaging", subcategory: "films" },
  { term: "shrink film", synonyms: ["shrink wrap", "shrink sleeve", "shrink label", "heat shrink"], relatedTerms: ["packaging", "tamper evident", "protection", "labeling"], category: "packaging", subcategory: "films" },
  { term: "bubble wrap", synonyms: ["air bubble", "protective wrap", "cushioning", "bubble pack"], relatedTerms: ["packaging", "protection", "fragile", "shipping"], category: "packaging", subcategory: "cushioning" },
  { term: "foam wrap", synonyms: ["foam sheet", "protective foam", "cushioning foam", "pe foam"], relatedTerms: ["packaging", "protection", "fragile", "lightweight"], category: "packaging", subcategory: "cushioning" },
  { term: "food wrap", synonyms: ["plastic wrap", "cling film", "saran wrap", "food film"], relatedTerms: ["packaging", "food", "freshness", "household"], category: "packaging", subcategory: "films" },
  { term: "aluminum foil", synonyms: ["foil wrap", "tin foil", "kitchen foil", "baking foil"], relatedTerms: ["packaging", "food", "cooking", "barrier"], category: "packaging", subcategory: "films" },
  { term: "wax paper", synonyms: ["greaseproof paper", "baking paper", "deli paper", "food paper"], relatedTerms: ["packaging", "food", "grease resistant", "biodegradable"], category: "packaging", subcategory: "papers" },
  { term: "parchment paper", synonyms: ["baking paper", "silicone paper", "non stick", "oven paper"], relatedTerms: ["packaging", "baking", "food", "heat resistant"], category: "packaging", subcategory: "papers" },
  { term: "butcher paper", synonyms: ["kraft paper", "wrapping paper", "meat paper", "food grade"], relatedTerms: ["packaging", "food", "meat", "breathable"], category: "packaging", subcategory: "papers" },
  { term: "tissue paper", synonyms: ["gift tissue", "wrapping tissue", "decorative", "acid free"], relatedTerms: ["packaging", "gift", "decorative", "protective"], category: "packaging", subcategory: "papers" },
  { term: "newsprint", synonyms: ["packing paper", "filler paper", "cheap paper", "recycled"], relatedTerms: ["packaging", "filler", "protection", "economy"], category: "packaging", subcategory: "papers" },
  { term: "kraft paper", synonyms: ["brown paper", "natural paper", "recycled paper", "strong paper"], relatedTerms: ["packaging", "eco friendly", "durable", "versatile"], category: "packaging", subcategory: "papers" },
  
  // Cushioning & Protection
  { term: "packing peanuts", synonyms: ["foam peanuts", "loose fill", "void fill", "biodegradable peanuts"], relatedTerms: ["packaging", "filler", "protection", "lightweight"], category: "packaging", subcategory: "filler" },
  { term: "air pillows", synonyms: ["air cushions", "void fill", "inflatable", "shipping pillows"], relatedTerms: ["packaging", "filler", "protection", "lightweight"], category: "packaging", subcategory: "filler" },
  { term: "foam inserts", synonyms: ["custom foam", "protective foam", "cushioning", "foam padding"], relatedTerms: ["packaging", "protection", "custom", "fragile"], category: "packaging", subcategory: "cushioning" },
  { term: "corrugated insert", synonyms: ["box divider", "separator", "partition", "corrugated pad"], relatedTerms: ["packaging", "organization", "protection", "custom"], category: "packaging", subcategory: "cushioning" },
  { term: "edge protector", synonyms: ["corner protector", "edge guard", "l profile", "cardboard edge"], relatedTerms: ["packaging", "protection", "shipping", "industrial"], category: "packaging", subcategory: "protection" },
  { term: "strapping", synonyms: ["plastic strap", "steel strap", "polyester strap", "banding"], relatedTerms: ["packaging", "securing", "shipping", "industrial"], category: "packaging", subcategory: "securing" },
  { term: "stretch band", synonyms: ["rubber band", "elastic band", "strap", "securing band"], relatedTerms: ["packaging", "securing", "bundling", "convenient"], category: "packaging", subcategory: "securing" },
  { term: "twist tie", synonyms: ["wire tie", "cable tie", "bag tie", "resealable tie"], relatedTerms: ["packaging", "closure", "convenient", "bread"], category: "packaging", subcategory: "closure" },
  
  // Labels & Tags
  { term: "adhesive label", synonyms: ["sticker", "pressure sensitive label", "self adhesive", "peel and stick"], relatedTerms: ["packaging", "branding", "information", "identification"], category: "packaging", subcategory: "labels" },
  { term: "shipping label", synonyms: ["address label", "waybill", "barcode label", "tracking label"], relatedTerms: ["packaging", "logistics", "shipping", "tracking"], category: "packaging", subcategory: "labels" },
  { term: "product label", synonyms: ["brand label", "information label", "ingredient label", "nutrition facts"], relatedTerms: ["packaging", "branding", "compliance", "information"], category: "packaging", subcategory: "labels" },
  { term: "hang tag", synonyms: ["swing tag", "price tag", "brand tag", "information tag"], relatedTerms: ["packaging", "retail", "branding", "apparel"], category: "packaging", subcategory: "labels" },
  { term: "rfid tag", synonyms: ["smart label", "electronic tag", "tracking tag", "inventory tag"], relatedTerms: ["packaging", "technology", "tracking", "retail"], category: "packaging", subcategory: "labels" },
  { term: "security seal", synonyms: ["tamper evident seal", "safety seal", "breakable seal", "warranty seal"], relatedTerms: ["packaging", "security", "authenticity", "protection"], category: "packaging", subcategory: "labels" },
  { term: "hologram", synonyms: ["security sticker", "authenticity label", "3d label", "anti counterfeit"], relatedTerms: ["packaging", "security", "premium", "verification"], category: "packaging", subcategory: "labels" },
  { term: "barcode", synonyms: ["upc", "qr code", "data matrix", "scan code", "tracking code"], relatedTerms: ["packaging", "tracking", "retail", "automation"], category: "packaging", subcategory: "labels" },
  { term: "thermal label", synonyms: ["direct thermal", "thermal transfer", "shipping label", "receipt"], relatedTerms: ["packaging", "printing", "logistics", "cost effective"], category: "packaging", subcategory: "labels" },
  
  // Tapes & Adhesives
  { term: "packaging tape", synonyms: ["box tape", "sealing tape", "carton tape", "bopp tape"], relatedTerms: ["packaging", "closure", "shipping", "essential"], category: "packaging", subcategory: "tape" },
  { term: "duct tape", synonyms: ["cloth tape", "gaffer tape", "reinforced tape", "heavy duty"], relatedTerms: ["packaging", "strong", "repair", "industrial"], category: "packaging", subcategory: "tape" },
  { term: "masking tape", synonyms: ["painters tape", "crepe tape", "easy tear", "temporary"], relatedTerms: ["packaging", "labeling", "temporary", "removable"], category: "packaging", subcategory: "tape" },
  { term: "double sided tape", synonyms: ["mounting tape", "carpet tape", "adhesive tape", "sticky tape"], relatedTerms: ["packaging", "mounting", "bonding", "assembly"], category: "packaging", subcategory: "tape" },
  { term: "fragile tape", synonyms: ["warning tape", "handle with care", "caution tape", "alert tape"], relatedTerms: ["packaging", "warning", "fragile", "protection"], category: "packaging", subcategory: "tape" },
  { term: " Kraft tape", synonyms: ["paper tape", "reinforced paper", "gummed tape", "water activated"], relatedTerms: ["packaging", "eco friendly", "strong", "recyclable"], category: "packaging", subcategory: "tape" },
  { term: "hot glue", synonyms: ["hot melt", "glue gun", "thermoplastic", "adhesive", "bonding"], relatedTerms: ["packaging", "assembly", "fast", "bonding"], category: "packaging", subcategory: "adhesives" },
  { term: "glue stick", synonyms: ["adhesive stick", "solid glue", "craft glue", "hot glue stick"], relatedTerms: ["packaging", "craft", "assembly", "convenient"], category: "packaging", subcategory: "adhesives" },
  
  // Specialized Packaging
  { term: "esd packaging", synonyms: ["anti static", "conductive", "static shielding", "dissipative"], relatedTerms: ["packaging", "electronics", "protection", "specialty"], category: "packaging", subcategory: "specialty" },
  { term: "moisture barrier", synonyms: ["vapor barrier", "humidity protection", "desiccant bag", "military spec"], relatedTerms: ["packaging", "protection", "sensitive", "industrial"], category: "packaging", subcategory: "specialty" },
  { term: "temperature controlled", synonyms: ["insulated", "cold chain", "thermal", "reefer", "cooler"], relatedTerms: ["packaging", "food", "pharma", "sensitive"], category: "packaging", subcategory: "specialty" },
  { term: "vacuum packaging", synonyms: ["vacuum sealed", "vacuum pack", "skin pack", "modified atmosphere"], relatedTerms: ["packaging", "food", "preservation", "long life"], category: "packaging", subcategory: "specialty" },
  { term: "blister pack", synonyms: ["clamshell", "thermoformed", "bubble pack", "carded blister"], relatedTerms: ["packaging", "retail", "display", "consumer"], category: "packaging", subcategory: "specialty" },
  { term: "skin pack", synonyms: ["skin packaging", "vacuum skin", "tight wrap", "fresh pack"], relatedTerms: ["packaging", "food", "fresh", "presentation"], category: "packaging", subcategory: "specialty" },
  { term: "flow wrap", synonyms: ["horizontal form fill seal", "hffs", "candy wrap", "biscuit wrap"], relatedTerms: ["packaging", "food", "high speed", "automated"], category: "packaging", subcategory: "specialty" },
  { term: "shrink sleeve", synonyms: ["shrink label", "full body sleeve", "360 label", "contour label"], relatedTerms: ["packaging", "labeling", "branding", "beverage"], category: "packaging", subcategory: "specialty" },
  { term: "gift packaging", synonyms: ["gift wrap", "presentation box", "luxury packaging", "gift set"], relatedTerms: ["packaging", "premium", "celebration", "premium"], category: "packaging", subcategory: "specialty" },
  { term: "display packaging", synonyms: ["retail ready", "shelf ready", "pdq", "point of purchase"], relatedTerms: ["packaging", "retail", "display", "marketing"], category: "packaging", subcategory: "specialty" },
  
  // Sustainable Packaging
  { term: "biodegradable", synonyms: ["compostable", "eco friendly", "green", "sustainable", "organic"], relatedTerms: ["packaging", "environment", "green", "future"], category: "packaging", subcategory: "sustainable" },
  { term: "recycled material", synonyms: ["post consumer", "pcr", "recycled content", "upcycled"], relatedTerms: ["packaging", "sustainable", "circular", "eco"], category: "packaging", subcategory: "sustainable" },
  { term: "mushroom packaging", synonyms: ["mycelium", "mushroom foam", "biological", "grown"], relatedTerms: ["packaging", "innovation", "sustainable", "biodegradable"], category: "packaging", subcategory: "sustainable" },
  { term: "seaweed packaging", synonyms: ["algae", "ocean plastic alternative", "edible packaging", "marine"], relatedTerms: ["packaging", "innovation", "sustainable", "edible"], category: "packaging", subcategory: "sustainable" },
  { term: "plantable packaging", synonyms: ["seed paper", "growing paper", "biodegradable seed", "sprouting"], relatedTerms: ["packaging", "innovation", "sustainable", "interactive"], category: "packaging", subcategory: "sustainable" },
  { term: "reusable packaging", synonyms: ["returnable", "loop", "circular", "deposit", "refillable"], relatedTerms: ["packaging", "sustainable", "economy", "multiple use"], category: "packaging", subcategory: "sustainable" },
  { term: "minimal packaging", synonyms: ["reduced", "lightweight", "efficient", "optimize", "less waste"], relatedTerms: ["packaging", "sustainable", "efficiency", "eco"], category: "packaging", subcategory: "sustainable" },
  { term: "plastic free", synonyms: ["zero plastic", "alternative", "natural", "non petroleum"], relatedTerms: ["packaging", "sustainable", "ocean safe", "clean"], category: "packaging", subcategory: "sustainable" },
  
  // Industrial Packaging
  { term: "steel strapping", synonyms: ["metal banding", "heavy duty strap", "secure", "industrial"], relatedTerms: ["packaging", "industrial", "heavy", "securing"], category: "packaging", subcategory: "industrial" },
  { term: "wooden pallet", synonyms: ["pallet", "skid", "euro pallet", "shipping platform"], relatedTerms: ["packaging", "shipping", "handling", "logistics"], category: "packaging", subcategory: "industrial" },
  { term: "plastic pallet", synonyms: ["hygienic pallet", "nestable", "rackable", "export pallet"], relatedTerms: ["packaging", "shipping", "hygienic", "reusable"], category: "packaging", subcategory: "industrial" },
  { term: "slip sheet", synonyms: ["push pull sheet", "thin pallet", "cardboard slip", "alternative"], relatedTerms: ["packaging", "shipping", "lightweight", "economy"], category: "packaging", subcategory: "industrial" },
  { term: "gaylord", synonyms: ["super sack", "bulk box", "large container", "octobin"], relatedTerms: ["packaging", "bulk", "shipping", "industrial"], category: "packaging", subcategory: "industrial" },
  { term: "dunnage", synonyms: ["void filler", "blocking", "bracing", "securing", "stabilizing"], relatedTerms: ["packaging", "shipping", "protection", "load"], category: "packaging", subcategory: "industrial" },
  { term: "load securing", synonyms: ["cargo securing", "lashing", "tie down", "ratchet strap"], relatedTerms: ["packaging", "shipping", "safety", "transport"], category: "packaging", subcategory: "industrial" },
  { term: "dangerous goods", synonyms: ["hazmat", "dg packaging", "adr packaging", "chemical"], relatedTerms: ["packaging", "regulated", "safety", "compliance"], category: "packaging", subcategory: "industrial" },
  { term: "export packaging", synonyms: ["ispm15", "phytosanitary", "wood treatment", "international"], relatedTerms: ["packaging", "export", "regulation", "global"], category: "packaging", subcategory: "industrial" },
  { term: "pharma packaging", synonyms: ["gmp", "cleanroom", "sterile", "validated", "regulated"], relatedTerms: ["packaging", "pharma", "medical", "strict"], category: "packaging", subcategory: "industrial" },
];

export default packagingTerms;
