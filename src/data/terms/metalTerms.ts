import type { ProductTerm } from '../productDictionary';

export const metalTerms: ProductTerm[] = [
  // Steel Products
  { term: "steel coil", synonyms: ["hot rolled coil", "cold rolled coil", "hr coil", "cr coil", "sheet coil"], relatedTerms: ["metal", "steel", "coiled", "processing"], category: "metal", subcategory: "steel" },
  { term: "steel sheet", synonyms: ["flat steel", "plate", "strip", "hot rolled sheet", "cold rolled sheet"], relatedTerms: ["metal", "steel", "flat", "sheet"], category: "metal", subcategory: "steel" },
  { term: "steel plate", synonyms: ["thick plate", "heavy plate", "structural plate", "ship plate", "boiler plate"], relatedTerms: ["metal", "steel", "thick", "structural"], category: "metal", subcategory: "steel" },
  { term: "rebar", synonyms: ["reinforcing bar", "deformed bar", "ribbed bar", "steel bar", "tmt bar"], relatedTerms: ["metal", "steel", "construction", "reinforcement"], category: "metal", subcategory: "steel" },
  { term: "wire rod", synonyms: ["coil rod", "steel wire", "rod coil", "drawing quality", "mesh quality"], relatedTerms: ["metal", "steel", "wire", "drawing"], category: "metal", subcategory: "steel" },
  { term: "steel beam", synonyms: ["i beam", "h beam", "wide flange", "w beam", "universal beam"], relatedTerms: ["metal", "steel", "structural", "beam"], category: "metal", subcategory: "steel" },
  { term: "steel pipe", synonyms: ["seamless pipe", "welded pipe", "erw pipe", "lsaw", "ssaw", "tube"], relatedTerms: ["metal", "steel", "hollow", "pipe"], category: "metal", subcategory: "steel" },
  { term: "galvanized steel", synonyms: ["gi", "zinc coated", "hot dip galvanized", "electro galvanized", "zincalume"], relatedTerms: ["metal", "steel", "coated", "corrosion"], category: "metal", subcategory: "coated" },
  { term: "color coated steel", synonyms: ["ppgi", "ppgl", "pre painted", "coil coated", "organic coated"], relatedTerms: ["metal", "steel", "painted", "color"], category: "metal", subcategory: "coated" },
  { term: "tinplate", synonyms: ["electrolytic tinplate", "etp", "tin coated", "food grade", "can stock"], relatedTerms: ["metal", "steel", "coated", "packaging"], category: "metal", subcategory: "coated" },
  { term: "electrical steel", synonyms: ["silicon steel", "transformer steel", "motor lamination", "grain oriented"], relatedTerms: ["metal", "steel", "electrical", "magnetic"], category: "metal", subcategory: "specialty" },
  { term: "stainless steel", synonyms: ["inox", "ss", "austenitic", "ferritic", "martensitic", "duplex"], relatedTerms: ["metal", "steel", "corrosion resistant", "alloy"], category: "metal", subcategory: "stainless" },
  { term: "tool steel", synonyms: ["high speed steel", "hss", "die steel", "mold steel", "cold work"], relatedTerms: ["metal", "steel", "tools", "hardened"], category: "metal", subcategory: "specialty" },
  { term: "spring steel", synonyms: ["music wire", "spring wire", "hardened", "tempered", "high carbon"], relatedTerms: ["metal", "steel", "springs", "elastic"], category: "metal", subcategory: "specialty" },
  { term: "bearing steel", synonyms: ["ball bearing steel", "roller bearing", "chrome steel", "100cr6"], relatedTerms: ["metal", "steel", "bearings", "precision"], category: "metal", subcategory: "specialty" },
  { term: "rail steel", synonyms: ["railway steel", "train rail", "crane rail", "grooved rail"], relatedTerms: ["metal", "steel", "railway", "heavy"], category: "metal", subcategory: "specialty" },
  { term: "shipbuilding steel", synonyms: ["marine steel", "ah36", "dh36", "eh36", "grade a"], relatedTerms: ["metal", "steel", "marine", "ship"], category: "metal", subcategory: "specialty" },
  { term: "weathering steel", synonyms: ["corten", "cor ten", "atmospheric", "rustic", "patina"], relatedTerms: ["metal", "steel", "corrosion", "aesthetic"], category: "metal", subcategory: "specialty" },
  { term: "api steel", synonyms: ["line pipe", "oil pipe", "gas pipe", "x42", "x52", "x65", "x70"], relatedTerms: ["metal", "steel", "pipeline", "energy"], category: "metal", subcategory: "specialty" },
  
  // Aluminum
  { term: "aluminum coil", synonyms: ["aluminium coil", "alcoil", "rolled aluminum", "strip coil"], relatedTerms: ["metal", "aluminum", "coil", "lightweight"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum sheet", synonyms: ["aluminium plate", "aluminum panel", "flat aluminum", "foil stock"], relatedTerms: ["metal", "aluminum", "sheet", "lightweight"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum extrusion", synonyms: ["profile", "section", "shape", "aluminium extrusion", "extruded"], relatedTerms: ["metal", "aluminum", "profile", "structural"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum foil", synonyms: ["aluminium foil", "alufoil", "tin foil", "household foil", "converter"], relatedTerms: ["metal", "aluminum", "thin", "packaging"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum can stock", synonyms: ["body stock", "end stock", "tab stock", "beverage can", "food can"], relatedTerms: ["metal", "aluminum", "packaging", "recyclable"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum casting", synonyms: ["die casting", "gravity casting", "sand casting", "a356", "adc12"], relatedTerms: ["metal", "aluminum", "casting", "automotive"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum wire", synonyms: ["aluminium rod", "ec grade", "alloy wire", "electrical conductor"], relatedTerms: ["metal", "aluminum", "wire", "electrical"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum ingot", synonyms: ["primary aluminum", "remelt", "t bar", "sow", "pure aluminum"], relatedTerms: ["metal", "aluminum", "raw", "primary"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum billet", synonyms: ["aluminum log", "extrusion billet", "remelt billet", "casting stock"], relatedTerms: ["metal", "aluminum", "intermediate", "extrusion"], category: "metal", subcategory: "aluminum" },
  { term: "aluminum scrap", synonyms: ["taint tabor", "tense", "troma", "zorba", " Twitch", "scrap"], relatedTerms: ["metal", "aluminum", "recycling", "secondary"], category: "metal", subcategory: "aluminum" },
  
  // Copper
  { term: "copper cathode", synonyms: ["electrolytic copper", "lme grade a", "cathode copper", "pure copper"], relatedTerms: ["metal", "copper", "raw", "refined"], category: "metal", subcategory: "copper" },
  { term: "copper wire", synonyms: ["copper rod", "wire rod", "magnet wire", "bunched wire", "cable"], relatedTerms: ["metal", "copper", "electrical", "conductivity"], category: "metal", subcategory: "copper" },
  { term: "copper tube", synonyms: ["copper pipe", "air conditioning tube", "refrigeration", "plumbing"], relatedTerms: ["metal", "copper", "tube", "thermal"], category: "metal", subcategory: "copper" },
  { term: "copper sheet", synonyms: ["copper plate", "copper strip", "busbar", "electrical"], relatedTerms: ["metal", "copper", "sheet", "electrical"], category: "metal", subcategory: "copper" },
  { term: "brass", synonyms: ["copper zinc", "cartridge brass", "yellow brass", "naval brass", "free cutting"], relatedTerms: ["metal", "copper", "alloy", "machinable"], category: "metal", subcategory: "copper" },
  { term: "bronze", synonyms: ["copper tin", "phosphor bronze", "aluminum bronze", "bell metal"], relatedTerms: ["metal", "copper", "alloy", "casting"], category: "metal", subcategory: "copper" },
  { term: "copper concentrate", synonyms: ["ore", "concentrate", "copper ore", "sulfide", "oxide"], relatedTerms: ["metal", "copper", "raw", "mining"], category: "metal", subcategory: "copper" },
  { term: "copper blister", synonyms: ["blister copper", "black copper", "fire refined", "unrefined"], relatedTerms: ["metal", "copper", "intermediate", "refining"], category: "metal", subcategory: "copper" },
  { term: "copper anode", synonyms: ["anode copper", "cast anode", "raw material", "electrolysis"], relatedTerms: ["metal", "copper", "intermediate", "electrolytic"], category: "metal", subcategory: "copper" },
  
  // Zinc
  { term: "zinc ingot", synonyms: ["special high grade", "shg", "prime western", "pw", "zinc metal"], relatedTerms: ["metal", "zinc", "raw", "galvanizing"], category: "metal", subcategory: "zinc" },
  { term: "galvanized zinc", synonyms: ["zinc coating", "zinc metal", "zinc anode", "sacrificial"], relatedTerms: ["metal", "zinc", "coating", "protection"], category: "metal", subcategory: "zinc" },
  { term: "zinc alloy", synonyms: ["zamak", "za alloy", "zinc die cast", "zinc base", "zamac"], relatedTerms: ["metal", "zinc", "casting", "die cast"], category: "metal", subcategory: "zinc" },
  { term: "zinc oxide", synonyms: ["zno", "zinc white", "indirect process", "french process", "rubber grade"], relatedTerms: ["metal", "zinc", "chemical", "pigment"], category: "metal", subcategory: "zinc" },
  { term: "zinc dust", synonyms: ["zinc powder", "painting grade", "chemical grade", "还原 zinc"], relatedTerms: ["metal", "zinc", "powder", "coating"], category: "metal", subcategory: "zinc" },
  
  // Nickel
  { term: "nickel cathode", synonyms: ["electrolytic nickel", "nickel metal", "lme nickel", "cathodes"], relatedTerms: ["metal", "nickel", "raw", "stainless"], category: "metal", subcategory: "nickel" },
  { term: "nickel pig iron", synonyms: ["npi", "feni", "ferronickel", "nickel iron", "laterite"], relatedTerms: ["metal", "nickel", "intermediate", "stainless"], category: "metal", subcategory: "nickel" },
  { term: "nickel sulfate", synonyms: ["battery grade", "electroplating", "chemical", "sulfate"], relatedTerms: ["metal", "nickel", "battery", "chemical"], category: "metal", subcategory: "nickel" },
  { term: "nickel ore", synonyms: ["laterite", "limonite", "saprolite", "nickel concentrate"], relatedTerms: ["metal", "nickel", "raw", "mining"], category: "metal", subcategory: "nickel" },
  { term: "nickel alloy", synonyms: ["inconel", "monel", "hastelloy", "nimonic", "nickel superalloy"], relatedTerms: ["metal", "nickel", "high performance", "specialty"], category: "metal", subcategory: "nickel" },
  
  // Lead
  { term: "lead ingot", synonyms: ["pure lead", "refined lead", "lme lead", "pb", "pig lead"], relatedTerms: ["metal", "lead", "raw", "battery"], category: "metal", subcategory: "lead" },
  { term: "lead alloy", synonyms: ["antimonial lead", "calcium lead", "maintenance free", "battery grid"], relatedTerms: ["metal", "lead", "alloy", "battery"], category: "metal", subcategory: "lead" },
  { term: "lead oxide", synonyms: ["litharge", "red lead", "battery oxide", "pbo", "paste"], relatedTerms: ["metal", "lead", "battery", "chemical"], category: "metal", subcategory: "lead" },
  { term: "lead sheet", synonyms: ["roofing lead", "code", "x ray shielding", "flashing", "soundproof"], relatedTerms: ["metal", "lead", "sheet", "protection"], category: "metal", subcategory: "lead" },
  { term: "lead scrap", synonyms: ["drained lead", "battery scrap", "wheel weight", "cable scrap"], relatedTerms: ["metal", "lead", "recycling", "secondary"], category: "metal", subcategory: "lead" },
  
  // Tin
  { term: "tin ingot", synonyms: ["pure tin", "refined tin", "lme tin", "sn", "electrolytic tin"], relatedTerms: ["metal", "tin", "raw", "solder"], category: "metal", subcategory: "tin" },
  { term: "solder", synonyms: ["tin lead", "lead free", "sac305", "solder wire", "solder bar"], relatedTerms: ["metal", "tin", "electronics", "joining"], category: "metal", subcategory: "tin" },
  { term: "pewter", synonyms: ["tin alloy", "antimony tin", "decorative", "tableware"], relatedTerms: ["metal", "tin", "alloy", "decorative"], category: "metal", subcategory: "tin" },
  { term: "tin chemical", synonyms: ["tin sulfate", "tin chloride", "stannous", "stannic", "catalyst"], relatedTerms: ["metal", "tin", "chemical", "plating"], category: "metal", subcategory: "tin" },
  
  // Precious Metals
  { term: "gold bar", synonyms: ["gold bullion", "ingot", "good delivery", "kilobar", "tola bar"], relatedTerms: ["metal", "gold", "investment", "precious"], category: "metal", subcategory: "precious" },
  { term: "silver bar", synonyms: ["silver bullion", "ingot", "good delivery", "1000 oz", "granules"], relatedTerms: ["metal", "silver", "investment", "industrial"], category: "metal", subcategory: "precious" },
  { term: "gold coin", synonyms: ["krugerrand", "maple leaf", "eagle", "sovereign", "philharmonic"], relatedTerms: ["metal", "gold", "coin", "investment"], category: "metal", subcategory: "precious" },
  { term: "silver coin", synonyms: ["silver eagle", "maple", "panda", "kookaburra", "koala"], relatedTerms: ["metal", "silver", "coin", "collectible"], category: "metal", subcategory: "precious" },
  { term: "platinum", synonyms: ["pt", "platinum bar", "platinum sponge", "catalyst grade"], relatedTerms: ["metal", "platinum", "precious", "automotive"], category: "metal", subcategory: "precious" },
  { term: "palladium", synonyms: ["pd", "palladium bar", "sponge", "catalyst", "automotive"], relatedTerms: ["metal", "palladium", "precious", "catalytic"], category: "metal", subcategory: "precious" },
  { term: "rhodium", synonyms: ["rh", "rhodium sponge", "powder", "plating", "reflective"], relatedTerms: ["metal", "rhodium", "precious", "automotive"], category: "metal", subcategory: "precious" },
  { term: "iridium", synonyms: ["ir", "iridium sponge", "crucibles", "spark plugs", "high temp"], relatedTerms: ["metal", "iridium", "precious", "specialty"], category: "metal", subcategory: "precious" },
  
  // Rare Earth & Specialty
  { term: "neodymium", synonyms: ["ndfeb", "rare earth magnet", "permanent magnet", "nd metal"], relatedTerms: ["metal", "rare earth", "magnet", "high tech"], category: "metal", subcategory: "rare" },
  { term: "lithium", synonyms: ["lithium carbonate", "lithium hydroxide", "battery grade", "li metal"], relatedTerms: ["metal", "lithium", "battery", "ev"], category: "metal", subcategory: "battery" },
  { term: "cobalt", synonyms: ["co", "cobalt metal", "cathode", "battery grade", "alloy grade"], relatedTerms: ["metal", "cobalt", "battery", "superalloy"], category: "metal", subcategory: "battery" },
  { term: "manganese", synonyms: ["mn ore", "manganese metal", "silicomanganese", "ferromanganese"], relatedTerms: ["metal", "manganese", "steel", "battery"], category: "metal", subcategory: "ferroalloy" },
  { term: "silicon metal", synonyms: ["si metal", "metallurgical grade", "chemical grade", "solar grade"], relatedTerms: ["metal", "silicon", "aluminum", "solar"], category: "metal", subcategory: "metalloid" },
  { term: "ferrochrome", synonyms: ["fecr", "high carbon", "low carbon", "charge chrome", "lumpy"], relatedTerms: ["metal", "chrome", "stainless", "ferroalloy"], category: "metal", subcategory: "ferroalloy" },
  { term: "ferrosilicon", synonyms: ["fesi", "inoculant", "nodularizer", "deoxidizer", "75% 72%"], relatedTerms: ["metal", "silicon", "steel", "casting"], category: "metal", subcategory: "ferroalloy" },
  { term: "ferromolybdenum", synonyms: ["femo", "molybdenum", "steel additive", "alloy"], relatedTerms: ["metal", "moly", "steel", "hardenability"], category: "metal", subcategory: "ferroalloy" },
  { term: "ferrovanadium", synonyms: ["fev", "vanadium", "vanadium additive", "hss steel"], relatedTerms: ["metal", "vanadium", "steel", "tool steel"], category: "metal", subcategory: "ferroalloy" },
  { term: "ferrotungsten", synonyms: ["few", "tungsten", "wolfram", "high speed steel", "heavy alloy"], relatedTerms: ["metal", "tungsten", "steel", "specialty"], category: "metal", subcategory: "ferroalloy" },
  { term: "ferroniobium", synonyms: ["fenb", "niobium", "columbium", "microalloyed steel", "hsla"], relatedTerms: ["metal", "niobium", "steel", "strength"], category: "metal", subcategory: "ferroalloy" },
  { term: "ferrotitanium", synonyms: ["feti", "titanium", "deoxidizer", "stainless", "additive"], relatedTerms: ["metal", "titanium", "steel", "clean steel"], category: "metal", subcategory: "ferroalloy" },
  
  // Scrap & Recycling
  { term: "steel scrap", synonyms: ["hms", "shredded", "plate structural", "busheling", "turnings"], relatedTerms: ["metal", "steel", "recycling", "secondary"], category: "metal", subcategory: "scrap" },
  { term: "cast iron scrap", synonyms: ["foundry scrap", "iron scrap", "machining scrap", "returns"], relatedTerms: ["metal", "iron", "casting", "recycling"], category: "metal", subcategory: "scrap" },
  { term: "stainless scrap", synonyms: ["304 scrap", "316 scrap", "solid scrap", "turning", "trimmings"], relatedTerms: ["metal", "stainless", "recycling", "secondary"], category: "metal", subcategory: "scrap" },
  { term: "aluminum scrap", synonyms: ["taint tabor", "tense", "troma", "zorba", "twitch"], relatedTerms: ["metal", "aluminum", "recycling", "secondary"], category: "metal", subcategory: "scrap" },
  { term: "copper scrap", synonyms: ["bare bright", "number 1", "number 2", "candy", "birch cliff"], relatedTerms: ["metal", "copper", "recycling", "secondary"], category: "metal", subcategory: "scrap" },
  { term: "brass scrap", synonyms: ["yellow brass", "red brass", "cartridge brass", "honey", "ocean"], relatedTerms: ["metal", "brass", "recycling", "secondary"], category: "metal", subcategory: "scrap" },
  { term: "zinc scrap", synonyms: ["zinc die cast", "new scrap", "old scrap", "zinc ashes", "dross"], relatedTerms: ["metal", "zinc", "recycling", "secondary"], category: "metal", subcategory: "scrap" },
  { term: "lead scrap", synonyms: ["drained lead", "battery plates", "wheel weights", "cable scrap"], relatedTerms: ["metal", "lead", "recycling", "secondary"], category: "metal", subcategory: "scrap" },
  { term: "mixed scrap", synonyms: ["zurik", "zebra", "zincor", "shredded", "heavy melt"], relatedTerms: ["metal", "mixed", "recycling", "auto shredding"], category: "metal", subcategory: "scrap" },
  { term: "e waste", synonyms: ["weee", "electronic scrap", "pcb", "circuit board", "cables"], relatedTerms: ["metal", "electronics", "recycling", "urban mining"], category: "metal", subcategory: "scrap" },
  { term: "slag", synonyms: ["blast furnace slag", "bof slag", "ld slag", "eaf slag", "aggregate"], relatedTerms: ["metal", "byproduct", "cement", "construction"], category: "metal", subcategory: "byproduct" },
  { term: "mill scale", synonyms: ["scale", "iron oxide", "rolling mill", "steelmaking waste"], relatedTerms: ["metal", "iron", "byproduct", "recycling"], category: "metal", subcategory: "byproduct" },
  { term: "dross", synonyms: ["aluminum dross", "zinc dross", "skimming", "salt slag", "recycling"], relatedTerms: ["metal", "secondary", "byproduct", "recovery"], category: "metal", subcategory: "byproduct" },
  
  // Metal Processing
  { term: "forging", synonyms: ["hot forging", "cold forging", "drop forge", "press forge", "hammer"], relatedTerms: ["metal", "forming", "strong", "automotive"], category: "metal", subcategory: "processing" },
  { term: "casting", synonyms: ["sand casting", "die casting", "investment", "lost wax", "continuous"], relatedTerms: ["metal", "forming", "shape", "liquid"], category: "metal", subcategory: "processing" },
  { term: "rolling", synonyms: ["hot rolling", "cold rolling", "flat rolling", "shape rolling", "ring rolling"], relatedTerms: ["metal", "forming", "long products", "flat"], category: "metal", subcategory: "processing" },
  { term: "extrusion", synonyms: ["direct extrusion", "indirect", "impact", "hydrostatic", "aluminum"], relatedTerms: ["metal", "forming", "profile", "aluminum"], category: "metal", subcategory: "processing" },
  { term: "drawing", synonyms: ["wire drawing", "tube drawing", "deep drawing", "bar drawing", "cold"], relatedTerms: ["metal", "forming", "wire", "thin"], category: "metal", subcategory: "processing" },
  { term: "stamping", synonyms: ["pressing", "blanking", "punching", "bending", "progressive"], relatedTerms: ["metal", "forming", "sheet", "mass"], category: "metal", subcategory: "processing" },
  { term: "machining", synonyms: ["turning", "milling", "drilling", "grinding", "cnc", "lathe"], relatedTerms: ["metal", "processing", "precision", "finish"], category: "metal", subcategory: "processing" },
  { term: "heat treatment", synonyms: ["annealing", "hardening", "tempering", "normalizing", "quenching"], relatedTerms: ["metal", "processing", "properties", "microstructure"], category: "metal", subcategory: "processing" },
  { term: "surface treatment", synonyms: ["plating", "coating", "painting", "galvanizing", "anodizing"], relatedTerms: ["metal", "processing", "protection", "appearance"], category: "metal", subcategory: "processing" },
  { term: "welding", synonyms: ["arc welding", "mig", "tig", "resistance", "laser", "friction"], relatedTerms: ["metal", "joining", "fusion", "construction"], category: "metal", subcategory: "joining" },
  { term: "brazing", synonyms: ["silver brazing", "furnace brazing", "induction", "torch", "joining"], relatedTerms: ["metal", "joining", "lower temp", "strong"], category: "metal", subcategory: "joining" },
  { term: "soldering", synonyms: ["soft soldering", "hard soldering", "electronics", "plumbing", "tin"], relatedTerms: ["metal", "joining", "low temp", "electronics"], category: "metal", subcategory: "joining" },
  { term: "powder metallurgy", synonyms: ["sintering", "pm", "powder forging", "mim", "additive"], relatedTerms: ["metal", "forming", "powder", "near net"], category: "metal", subcategory: "processing" },
  { term: "additive manufacturing", synonyms: ["3d printing", "metal printing", "slm", "ebm", "dmls"], relatedTerms: ["metal", "forming", "layer", "complex"], category: "metal", subcategory: "processing" },
  
  // Semi-Finished Products
  { term: "slab", synonyms: ["steel slab", "aluminum slab", "continuous cast", "hot rolling feed"], relatedTerms: ["metal", "intermediate", "thick", "hot rolling"], category: "metal", subcategory: "semis" },
  { term: "bloom", synonyms: ["steel bloom", "square section", "rolling feed", "structural"], relatedTerms: ["metal", "intermediate", "square", "rolling"], category: "metal", subcategory: "semis" },
  { term: "billet", synonyms: ["steel billet", "round billet", "rolling billet", "bar feed"], relatedTerms: ["metal", "intermediate", "round", "long products"], category: "metal", subcategory: "semis" },
  { term: "ingot", synonyms: ["steel ingot", "metal ingot", "cast ingot", "remelt", "primary"], relatedTerms: ["metal", "raw", "cast", "basic"], category: "metal", subcategory: "semis" },
  { term: "pig iron", synonyms: ["hot metal", "iron pig", "blast furnace iron", "basic", "foundry"], relatedTerms: ["metal", "iron", "raw", "blast furnace"], category: "metal", subcategory: "semis" },
  { term: "sponge iron", synonyms: ["dri", "direct reduced iron", "hbi", "hot briquetted", "eaf feed"], relatedTerms: ["metal", "iron", "reduced", "alternative"], category: "metal", subcategory: "semis" },
  { term: "hot briquetted iron", synonyms: ["hbi", "briquette", "dri compacted", "export", "safe"], relatedTerms: ["metal", "iron", "compacted", "transport"], category: "metal", subcategory: "semis" },
  
  // Finished Steel Products
  { term: "wire", synonyms: ["steel wire", "wire rod drawn", "nail wire", "mesh wire", "rope wire"], relatedTerms: ["metal", "steel", "long", "thin"], category: "metal", subcategory: "long" },
  { term: "nail", synonyms: ["common nail", "roofing nail", "finish nail", "concrete nail", "staple"], relatedTerms: ["metal", "steel", "fastener", "wood"], category: "metal", subcategory: "fastener" },
  { term: "screw", synonyms: ["wood screw", "machine screw", "self tapping", "drywall", "deck"], relatedTerms: ["metal", "steel", "fastener", "threaded"], category: "metal", subcategory: "fastener" },
  { term: "bolt", synonyms: ["hex bolt", "carriage bolt", "anchor bolt", "stud", " threaded rod"], relatedTerms: ["metal", "steel", "fastener", "heavy"], category: "metal", subcategory: "fastener" },
  { term: "nut", synonyms: ["hex nut", "lock nut", "wing nut", "cap nut", "flange nut"], relatedTerms: ["metal", "steel", "fastener", "mating"], category: "metal", subcategory: "fastener" },
  { term: "washer", synonyms: ["flat washer", "lock washer", "spring washer", "fender washer"], relatedTerms: ["metal", "steel", "fastener", "distribution"], category: "metal", subcategory: "fastener" },
  { term: "rivet", synonyms: ["blind rivet", "pop rivet", "solid rivet", "tubular", "structural"], relatedTerms: ["metal", "steel", "aluminum", "permanent"], category: "metal", subcategory: "fastener" },
  { term: "chain", synonyms: ["link chain", "roller chain", "anchor chain", "welded chain", "proof coil"], relatedTerms: ["metal", "steel", "connection", "lifting"], category: "metal", subcategory: "long" },
  { term: "rope", synonyms: ["wire rope", "cable", "strand", "guy wire", "hoist rope"], relatedTerms: ["metal", "steel", "flexible", "tensile"], category: "metal", subcategory: "long" },
  { term: "mesh", synonyms: ["wire mesh", "welded mesh", "woven mesh", "chain link", "expanded"], relatedTerms: ["metal", "steel", "screen", "fence"], category: "metal", subcategory: "long" },
  { term: "grating", synonyms: ["steel grating", "bar grating", "press locked", "welded", "floor"], relatedTerms: ["metal", "steel", "floor", "industrial"], category: "metal", subcategory: "long" },
  { term: "rail", synonyms: ["train rail", "crane rail", "light rail", "heavy rail", "grooved"], relatedTerms: ["metal", "steel", "railway", "guide"], category: "metal", subcategory: "long" },
  { term: "wheel", synonyms: ["railway wheel", "crane wheel", "trolley wheel", "forged wheel"], relatedTerms: ["metal", "steel", "railway", "rolling"], category: "metal", subcategory: "long" },
  
  // Mining & Raw Materials
  { term: "iron ore", synonyms: ["hematite", "magnetite", "lump ore", "fines", "pellet feed"], relatedTerms: ["metal", "mining", "raw", "blast furnace"], category: "metal", subcategory: "raw" },
  { term: "iron ore pellet", synonyms: ["pellet", "bf pellet", "dr pellet", "fired", "green"], relatedTerms: ["metal", "mining", "agglomerated", "blast furnace"], category: "metal", subcategory: "raw" },
  { term: "sinter", synonyms: ["iron sinter", "sinter feed", "return fines", "agglomerated"], relatedTerms: ["metal", "mining", "agglomerated", "blast furnace"], category: "metal", subcategory: "raw" },
  { term: "coking coal", synonyms: ["metallurgical coal", "met coal", "hard coking", "semi soft"], relatedTerms: ["metal", "mining", "carbon", "blast furnace"], category: "metal", subcategory: "raw" },
  { term: "pci coal", synonyms: ["pulverized coal", "injection coal", "thermal", "auxiliary"], relatedTerms: ["metal", "mining", "injection", "blast furnace"], category: "metal", subcategory: "raw" },
  { term: "coke", synonyms: ["metallurgical coke", "foundry coke", "blast furnace coke", "nut coke"], relatedTerms: ["metal", "carbon", "reducing", "blast furnace"], category: "metal", subcategory: "raw" },
  { term: "coke breeze", synonyms: ["coke fines", "small coke", "sinter fuel", "recycled"], relatedTerms: ["metal", "carbon", "fuel", "sintering"], category: "metal", subcategory: "raw" },
  { term: "bauxite", synonyms: ["aluminum ore", "gibbsite", "boehmite", "diaspore", "red mud"], relatedTerms: ["metal", "mining", "alumina", "aluminum"], category: "metal", subcategory: "raw" },
  { term: "alumina", synonyms: ["aluminum oxide", "smelter grade", "chemical grade", "calcined"], relatedTerms: ["metal", "intermediate", "aluminum", "electrolysis"], category: "metal", subcategory: "raw" },
  { term: "chromite", synonyms: ["chrome ore", "chromium", "lumpy", "concentrate", "foundry"], relatedTerms: ["metal", "mining", "chrome", "ferrochrome"], category: "metal", subcategory: "raw" },
  { term: "manganese ore", synonyms: ["mn ore", "pyrolusite", "rhodochrosite", "concentrate", "sinter"], relatedTerms: ["metal", "mining", "manganese", "ferromanganese"], category: "metal", subcategory: "raw" },
];

export default metalTerms;
