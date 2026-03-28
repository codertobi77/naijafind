import type { ProductTerm } from './productDictionary';

export const beautyCosmeticsTerms: ProductTerm[] = [
  // Base cosmetics
  { term: "foundation", synonyms: ["base", "makeup base", "complexion", "skin tint", "bb cream", "cc cream"], relatedTerms: ["makeup", "cosmetics", "beauty", "face", "skin"], category: "beauty_cosmetics" },
  { term: "mascara", synonyms: ["eyelash", "lash", "eye makeup", "lash tint"], relatedTerms: ["eyes", "makeup", "cosmetics", "beauty"], category: "beauty_cosmetics" },
  { term: "lipstick", synonyms: ["lip color", "lip tint", "lip stain", "lip gloss", "lip balm", "lip liner"], relatedTerms: ["lips", "makeup", "cosmetics", "beauty"], category: "beauty_cosmetics" },
  { term: "eyeshadow", synonyms: ["eye shadow", "eye color", "eye palette", "eye makeup"], relatedTerms: ["eyes", "makeup", "cosmetics", "palette"], category: "beauty_cosmetics" },
  { term: "blush", synonyms: ["rouge", "cheek color", "cheek tint", "bronzer", "highlighter"], relatedTerms: ["cheeks", "face", "makeup", "cosmetics"], category: "beauty_cosmetics" },
  { term: "concealer", synonyms: ["cover up", "corrector", "camouflage", "spot cover"], relatedTerms: ["face", "makeup", "skin", "blemish"], category: "beauty_cosmetics" },
  { term: "powder", synonyms: ["face powder", "setting powder", "loose powder", "pressed powder", "compact"], relatedTerms: ["face", "makeup", "cosmetics", "finish"], category: "beauty_cosmetics" },
  { term: "primer", synonyms: ["base coat", "preparer", "foundation primer", "eye primer", "lip primer"], relatedTerms: ["makeup", "base", "cosmetics", "prep"], category: "beauty_cosmetics" },
  { term: "setting spray", synonyms: ["fixing spray", "makeup fixer", "finishing spray", "setting mist"], relatedTerms: ["makeup", "finish", "cosmetics", "long lasting"], category: "beauty_cosmetics" },
  { term: "makeup remover", synonyms: ["cleanser", "micellar water", "cleansing oil", "makeup wipe"], relatedTerms: ["skincare", "clean", "face", "remover"], category: "beauty_cosmetics" },
  
  // Skincare
  { term: "moisturizer", synonyms: ["cream", "lotion", "hydrating cream", "face cream", "day cream", "night cream"], relatedTerms: ["skincare", "hydration", "face", "skin"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "serum", synonyms: ["essence", "concentrate", "ampoule", "booster"], relatedTerms: ["skincare", "treatment", "active ingredients", "face"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "cleanser", synonyms: ["face wash", "facial cleanser", "cleansing gel", "cleansing foam", "cleansing milk"], relatedTerms: ["skincare", "clean", "face", "wash"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "toner", synonyms: ["astringent", "lotion", "tonic", "face mist", "essence toner"], relatedTerms: ["skincare", "prep", "face", "balance"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "sunscreen", synonyms: ["sun protection", "spf", "sunblock", "uv protection", "sun cream"], relatedTerms: ["skincare", "protection", "sun", "uv"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "face mask", synonyms: ["sheet mask", "clay mask", "peel off mask", "sleeping mask", "hydrating mask"], relatedTerms: ["skincare", "treatment", "face", "mask"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "eye cream", synonyms: ["eye serum", "eye gel", "eye treatment", "anti-aging eye"], relatedTerms: ["skincare", "eyes", "anti-aging", "face"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "anti-aging", synonyms: ["wrinkle cream", "age defying", "youth cream", "rejuvenating", "firming"], relatedTerms: ["skincare", "wrinkles", "face", "mature skin"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "acne treatment", synonyms: ["pimple cream", "blemish control", "spot treatment", "acne gel"], relatedTerms: ["skincare", "acne", "blemish", "treatment"], category: "beauty_cosmetics", subcategory: "skincare" },
  { term: "exfoliator", synonyms: ["scrub", "peel", "exfoliating gel", "face scrub", "chemical exfoliant"], relatedTerms: ["skincare", "clean", "renewal", "face"], category: "beauty_cosmetics", subcategory: "skincare" },
  
  // Hair care
  { term: "shampoo", synonyms: ["hair wash", "cleansing shampoo", "clarifying shampoo", "dry shampoo"], relatedTerms: ["hair", "wash", "clean", "scalp"], category: "beauty_cosmetics", subcategory: "hair" },
  { term: "conditioner", synonyms: ["hair conditioner", "softening conditioner", "moisturizing conditioner", "leave-in"], relatedTerms: ["hair", "soft", "moisture", "treatment"], category: "beauty_cosmetics", subcategory: "hair" },
  { term: "hair mask", synonyms: ["deep conditioner", "hair treatment", "nourishing mask", "repair mask"], relatedTerms: ["hair", "treatment", "repair", "moisture"], category: "beauty_cosmetics", subcategory: "hair" },
  { term: "hair oil", synonyms: ["argan oil", "coconut oil", "hair serum", "nourishing oil", "hair elixir"], relatedTerms: ["hair", "oil", "nourish", "shine"], category: "beauty_cosmetics", subcategory: "hair" },
  { term: "hair spray", synonyms: ["styling spray", "holding spray", "finishing spray", "texture spray"], relatedTerms: ["hair", "style", "hold", "finish"], category: "beauty_cosmetics", subcategory: "hair" },
  { term: "hair dye", synonyms: ["hair color", "colorant", "tint", "bleach", "highlights"], relatedTerms: ["hair", "color", "dye", "treatment"], category: "beauty_cosmetics", subcategory: "hair" },
  { term: "styling gel", synonyms: ["hair gel", "pomade", "wax", "mousse", "cream"], relatedTerms: ["hair", "style", "hold", "texture"], category: "beauty_cosmetics", subcategory: "hair" },
  { term: "heat protectant", synonyms: ["thermal spray", "heat shield", "protecting spray", "heat defense"], relatedTerms: ["hair", "protection", "heat", "styling"], category: "beauty_cosmetics", subcategory: "hair" },
  
  // Body care
  { term: "body lotion", synonyms: ["body cream", "body moisturizer", "skin lotion", "body milk"], relatedTerms: ["body", "skin", "moisture", "care"], category: "beauty_cosmetics", subcategory: "body" },
  { term: "body wash", synonyms: ["shower gel", "body cleanser", "shower cream", "body soap"], relatedTerms: ["body", "wash", "clean", "shower"], category: "beauty_cosmetics", subcategory: "body" },
  { term: "body scrub", synonyms: ["exfoliating scrub", "body polish", "salt scrub", "sugar scrub"], relatedTerms: ["body", "exfoliate", "scrub", "skin"], category: "beauty_cosmetics", subcategory: "body" },
  { term: "deodorant", synonyms: ["antiperspirant", "roll-on", "spray deodorant", "stick deodorant"], relatedTerms: ["body", "fresh", "protection", "underarm"], category: "beauty_cosmetics", subcategory: "body" },
  { term: "hand cream", synonyms: ["hand lotion", "hand moisturizer", "nail cream", "cuticle oil"], relatedTerms: ["hands", "nails", "moisture", "care"], category: "beauty_cosmetics", subcategory: "body" },
  { term: "foot cream", synonyms: ["foot lotion", "heel balm", "foot scrub", "foot mask"], relatedTerms: ["feet", "heels", "moisture", "care"], category: "beauty_cosmetics", subcategory: "body" },
  { term: "massage oil", synonyms: ["body oil", "aromatherapy oil", "massage lotion", "relaxing oil"], relatedTerms: ["body", "massage", "relax", "oil"], category: "beauty_cosmetics", subcategory: "body" },
  
  // Fragrances
  { term: "perfume", synonyms: ["fragrance", "eau de parfum", "eau de toilette", "cologne", "scent"], relatedTerms: ["fragrance", "scent", "beauty", "luxury"], category: "beauty_cosmetics", subcategory: "fragrance" },
  { term: "cologne", synonyms: ["eau de cologne", "aftershave", "fragrance water", "scent"], relatedTerms: ["fragrance", "men", "scent", "fresh"], category: "beauty_cosmetics", subcategory: "fragrance" },
  { term: "body mist", synonyms: ["body spray", "fragrance mist", "scented spray", "refreshing mist"], relatedTerms: ["fragrance", "body", "light", "fresh"], category: "beauty_cosmetics", subcategory: "fragrance" },
  { term: "essential oil", synonyms: ["aromatherapy oil", "natural oil", "pure oil", "therapeutic oil"], relatedTerms: ["fragrance", "natural", "aromatherapy", "wellness"], category: "beauty_cosmetics", subcategory: "fragrance" },
  { term: "reed diffuser", synonyms: ["home fragrance", "scent diffuser", "aroma sticks", "fragrance diffuser"], relatedTerms: ["home", "fragrance", "scent", "decor"], category: "beauty_cosmetics", subcategory: "fragrance" },
  { term: "candle", synonyms: ["scented candle", "aromatherapy candle", "soy candle", "beeswax candle"], relatedTerms: ["home", "fragrance", "scent", "decor"], category: "beauty_cosmetics", subcategory: "fragrance" },
  
  // Nail care
  { term: "nail polish", synonyms: ["nail varnish", "nail lacquer", "nail color", "top coat", "base coat"], relatedTerms: ["nails", "color", "beauty", "manicure"], category: "beauty_cosmetics", subcategory: "nails" },
  { term: "nail file", synonyms: ["emery board", "glass file", "crystal file", "nail buffer"], relatedTerms: ["nails", "tools", "manicure", "care"], category: "beauty_cosmetics", subcategory: "nails" },
  { term: "cuticle oil", synonyms: ["cuticle cream", "nail oil", "cuticle remover", "nail strengthener"], relatedTerms: ["nails", "cuticles", "care", "manicure"], category: "beauty_cosmetics", subcategory: "nails" },
  { term: "nail dryer", synonyms: ["nail lamp", "uv lamp", "led lamp", "nail dryer machine"], relatedTerms: ["nails", "tools", "gel", "manicure"], category: "beauty_cosmetics", subcategory: "nails" },
  { term: "nail art", synonyms: ["nail stickers", "nail decals", "nail gems", "nail rhinestones"], relatedTerms: ["nails", "decoration", "art", "beauty"], category: "beauty_cosmetics", subcategory: "nails" },
  
  // Tools & Accessories
  { term: "makeup brush", synonyms: ["foundation brush", "powder brush", "blush brush", "eyeshadow brush"], relatedTerms: ["tools", "makeup", "application", "brushes"], category: "beauty_cosmetics", subcategory: "tools" },
  { term: "beauty blender", synonyms: ["makeup sponge", "blending sponge", "powder puff", "sponge applicator"], relatedTerms: ["tools", "makeup", "application", "sponge"], category: "beauty_cosmetics", subcategory: "tools" },
  { term: "tweezers", synonyms: ["eyebrow tweezers", "slanted tweezers", "pointed tweezers", "precision tweezers"], relatedTerms: ["tools", "eyebrows", "hair removal", "grooming"], category: "beauty_cosmetics", subcategory: "tools" },
  { term: "eyelash curler", synonyms: ["lash curler", "heated curler", "mini curler", "precision curler"], relatedTerms: ["tools", "eyes", "lashes", "curl"], category: "beauty_cosmetics", subcategory: "tools" },
  { term: "mirror", synonyms: ["compact mirror", "vanity mirror", "magnifying mirror", "led mirror"], relatedTerms: ["tools", "makeup", "mirror", "beauty"], category: "beauty_cosmetics", subcategory: "tools" },
  { term: "makeup organizer", synonyms: ["cosmetic organizer", "brush holder", "palette organizer", "vanity tray"], relatedTerms: ["storage", "makeup", "organize", "beauty"], category: "beauty_cosmetics", subcategory: "accessories" },
  { term: "travel case", synonyms: ["makeup bag", "cosmetic case", "toiletry bag", "beauty case"], relatedTerms: ["storage", "travel", "makeup", "bag"], category: "beauty_cosmetics", subcategory: "accessories" },
  
  // Men's grooming
  { term: "shaving cream", synonyms: ["shave gel", "shaving foam", "shaving soap", "shaving oil"], relatedTerms: ["men", "shave", "beard", "grooming"], category: "beauty_cosmetics", subcategory: "mens" },
  { term: "aftershave", synonyms: ["aftershave balm", "post-shave", "soothing gel", "shaving lotion"], relatedTerms: ["men", "shave", "skin", "grooming"], category: "beauty_cosmetics", subcategory: "mens" },
  { term: "beard oil", synonyms: ["beard balm", "beard wax", "beard serum", "beard conditioner"], relatedTerms: ["men", "beard", "grooming", "hair"], category: "beauty_cosmetics", subcategory: "mens" },
  { term: "razor", synonyms: ["safety razor", "electric razor", "cartridge razor", "straight razor"], relatedTerms: ["men", "shave", "beard", "grooming"], category: "beauty_cosmetics", subcategory: "mens" },
  { term: "trimmer", synonyms: ["beard trimmer", "hair clipper", "precision trimmer", "body trimmer"], relatedTerms: ["men", "grooming", "hair", "trim"], category: "beauty_cosmetics", subcategory: "mens" },
  { term: "men moisturizer", synonyms: ["face cream", "men skincare", "hydrating gel", "anti-aging men"], relatedTerms: ["men", "skincare", "face", "moisture"], category: "beauty_cosmetics", subcategory: "mens" },
  
  // Natural & Organic
  { term: "organic skincare", synonyms: ["natural skincare", "clean beauty", "green beauty", "eco-friendly"], relatedTerms: ["natural", "organic", "clean", "eco"], category: "beauty_cosmetics", subcategory: "natural" },
  { term: "vegan makeup", synonyms: ["cruelty free", "vegan cosmetics", "clean makeup", "ethical beauty"], relatedTerms: ["vegan", "cruelty free", "ethical", "clean"], category: "beauty_cosmetics", subcategory: "natural" },
  { term: "natural soap", synonyms: ["handmade soap", "artisan soap", "herbal soap", "botanical soap"], relatedTerms: ["natural", "soap", "clean", "organic"], category: "beauty_cosmetics", subcategory: "natural" },
  { term: "botanical extract", synonyms: ["plant extract", "herbal extract", "flower extract", "natural ingredient"], relatedTerms: ["natural", "botanical", "extract", "ingredient"], category: "beauty_cosmetics", subcategory: "natural" },
  { term: "mineral makeup", synonyms: ["powder foundation", "mineral powder", "natural makeup", "loose mineral"], relatedTerms: ["natural", "mineral", "makeup", "powder"], category: "beauty_cosmetics", subcategory: "natural" },
  
  // Wellness
  { term: "bath bomb", synonyms: ["bath fizzer", "bath soak", "effervescent bath", "aromatherapy bath"], relatedTerms: ["bath", "relax", "wellness", "aromatherapy"], category: "beauty_cosmetics", subcategory: "wellness" },
  { term: "bath salt", synonyms: ["epsom salt", "sea salt", "mineral salt", "bath crystals"], relatedTerms: ["bath", "relax", "wellness", "minerals"], category: "beauty_cosmetics", subcategory: "wellness" },
  { term: "bubble bath", synonyms: ["foaming bath", "bubble soap", "bath foam", "luxury bath"], relatedTerms: ["bath", "relax", "foam", "wellness"], category: "beauty_cosmetics", subcategory: "wellness" },
  { term: "bath oil", synonyms: ["bathing oil", "moisturizing bath", "aromatherapy oil", "milky bath"], relatedTerms: ["bath", "oil", "moisture", "wellness"], category: "beauty_cosmetics", subcategory: "wellness" },
  { term: "face roller", synonyms: ["jade roller", "quartz roller", "massage roller", "cooling roller"], relatedTerms: ["tools", "face", "massage", "skincare"], category: "beauty_cosmetics", subcategory: "wellness" },
  { term: "gua sha", synonyms: ["scraping tool", "facial tool", "massage stone", "jade tool"], relatedTerms: ["tools", "face", "massage", "skincare"], category: "beauty_cosmetics", subcategory: "wellness" },
  { term: "sheet mask", synonyms: ["hydrogel mask", "bio cellulose", "fiber mask", "paper mask"], relatedTerms: ["skincare", "mask", "treatment", "k-beauty"], category: "beauty_cosmetics", subcategory: "wellness" },
];

export default beautyCosmeticsTerms;
