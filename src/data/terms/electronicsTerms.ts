import type { ProductTerm } from '../productDictionary';

export const electronicsTerms: ProductTerm[] = [
  // Smartphones & Mobile
  { term: "smartphone", synonyms: ["mobile phone", "cell phone", "handset", "mobile", "iphone", "android"], relatedTerms: ["electronics", "communication", "mobile", "device"], category: "electronics", subcategory: "mobile" },
  { term: "tablet", synonyms: ["ipad", "android tablet", "slate", "pad", "phablet"], relatedTerms: ["electronics", "mobile", "screen", "portable"], category: "electronics", subcategory: "mobile" },
  { term: "smartwatch", synonyms: ["fitness watch", "wearable", "apple watch", "galaxy watch", "tracker"], relatedTerms: ["electronics", "wearable", "health", "smart"], category: "electronics", subcategory: "wearable" },
  { term: "earbuds", synonyms: ["wireless earbuds", "airpods", "headphones", "in ear", "bluetooth earbuds"], relatedTerms: ["electronics", "audio", "wireless", "music"], category: "electronics", subcategory: "audio" },
  { term: "power bank", synonyms: ["portable charger", "battery pack", "external battery", "power pack"], relatedTerms: ["electronics", "charging", "mobile", "battery"], category: "electronics", subcategory: "accessories" },
  { term: "charger", synonyms: ["adapter", "wall charger", "usb charger", "fast charger", "wireless charger"], relatedTerms: ["electronics", "charging", "power", "cable"], category: "electronics", subcategory: "accessories" },
  { term: "cable", synonyms: ["usb cable", "charging cable", "data cable", "lightning cable", "type c"], relatedTerms: ["electronics", "connection", "charging", "data"], category: "electronics", subcategory: "accessories" },
  { term: "screen protector", synonyms: ["tempered glass", "screen guard", "protective film", "anti glare"], relatedTerms: ["electronics", "protection", "screen", "mobile"], category: "electronics", subcategory: "accessories" },
  { term: "phone case", synonyms: ["cover", "bumper", "protective case", "silicone case", "leather case"], relatedTerms: ["electronics", "protection", "mobile", "accessory"], category: "electronics", subcategory: "accessories" },
  { term: "sim card", synonyms: ["micro sim", "nano sim", "esim", "subscriber identity module"], relatedTerms: ["electronics", "mobile", "network", "communication"], category: "electronics", subcategory: "mobile" },
  { term: "memory card", synonyms: ["sd card", "micro sd", "storage card", "flash memory", "tf card"], relatedTerms: ["electronics", "storage", "data", "memory"], category: "electronics", subcategory: "storage" },
  { term: "selfie stick", synonyms: ["monopod", "selfie pole", "extendable stick", "bluetooth stick"], relatedTerms: ["electronics", "photography", "mobile", "accessory"], category: "electronics", subcategory: "accessories" },
  { term: "tripod", synonyms: ["camera stand", "phone tripod", "flexible tripod", "gorillapod"], relatedTerms: ["electronics", "photography", "stability", "video"], category: "electronics", subcategory: "accessories" },
  { term: "ring light", synonyms: ["selfie light", "led ring", "beauty light", "fill light"], relatedTerms: ["electronics", "photography", "lighting", "video"], category: "electronics", subcategory: "accessories" },
  
  // Computers & Laptops
  { term: "laptop", synonyms: ["notebook", "computer", "portable pc", "macbook", "chromebook"], relatedTerms: ["electronics", "computing", "portable", "work"], category: "electronics", subcategory: "computers" },
  { term: "desktop computer", synonyms: ["pc", "tower", "workstation", "all in one", "computer"], relatedTerms: ["electronics", "computing", "stationary", "powerful"], category: "electronics", subcategory: "computers" },
  { term: "monitor", synonyms: ["screen", "display", "lcd", "led monitor", "gaming monitor"], relatedTerms: ["electronics", "display", "computer", "visual"], category: "electronics", subcategory: "computers" },
  { term: "keyboard", synonyms: ["mechanical keyboard", "wireless keyboard", "gaming keyboard", "ergonomic"], relatedTerms: ["electronics", "input", "typing", "computer"], category: "electronics", subcategory: "peripherals" },
  { term: "mouse", synonyms: ["computer mouse", "wireless mouse", "gaming mouse", "optical mouse", "trackpad"], relatedTerms: ["electronics", "input", "pointing", "computer"], category: "electronics", subcategory: "peripherals" },
  { term: "webcam", synonyms: ["camera", "video camera", "streaming cam", "hd webcam", "document camera"], relatedTerms: ["electronics", "video", "conference", "communication"], category: "electronics", subcategory: "peripherals" },
  { term: "microphone", synonyms: ["mic", "condenser mic", "usb mic", "wireless mic", "headset mic"], relatedTerms: ["electronics", "audio", "recording", "communication"], category: "electronics", subcategory: "peripherals" },
  { term: "headset", synonyms: ["headphones", "gaming headset", "wireless headset", "noise cancelling"], relatedTerms: ["electronics", "audio", "gaming", "communication"], category: "electronics", subcategory: "peripherals" },
  { term: "printer", synonyms: ["laser printer", "inkjet", "all in one", "scanner", "copier"], relatedTerms: ["electronics", "printing", "office", "document"], category: "electronics", subcategory: "office" },
  { term: "router", synonyms: ["wifi router", "modem", "wireless router", "mesh system", "access point"], relatedTerms: ["electronics", "network", "internet", "wifi"], category: "electronics", subcategory: "networking" },
  { term: "hard drive", synonyms: ["hdd", "ssd", "external drive", "storage drive", "nas", "backup drive"], relatedTerms: ["electronics", "storage", "data", "backup"], category: "electronics", subcategory: "storage" },
  { term: "usb hub", synonyms: ["usb splitter", "docking station", "port expander", "multi port"], relatedTerms: ["electronics", "connection", "usb", "expansion"], category: "electronics", subcategory: "accessories" },
  { term: "graphics card", synonyms: ["gpu", "video card", "gaming card", "nvidia", "amd", "rtx"], relatedTerms: ["electronics", "gaming", "computer", "graphics"], category: "electronics", subcategory: "components" },
  { term: "processor", synonyms: ["cpu", "chip", "intel", "amd", "core", "processor unit"], relatedTerms: ["electronics", "computing", "performance", "computer"], category: "electronics", subcategory: "components" },
  { term: "ram", synonyms: ["memory", "dram", "ddr4", "ddr5", "memory module", "system memory"], relatedTerms: ["electronics", "performance", "speed", "computer"], category: "electronics", subcategory: "components" },
  { term: "motherboard", synonyms: ["mainboard", "system board", "logic board", "mobo"], relatedTerms: ["electronics", "computer", "hardware", "base"], category: "electronics", subcategory: "components" },
  { term: "power supply", synonyms: ["psu", "power unit", "smps", "power adapter", "computer power"], relatedTerms: ["electronics", "power", "computer", "hardware"], category: "electronics", subcategory: "components" },
  { term: "cpu cooler", synonyms: ["heatsink", "fan", "liquid cooler", "aio cooler", "air cooler"], relatedTerms: ["electronics", "cooling", "computer", "temperature"], category: "electronics", subcategory: "components" },
  { term: "computer case", synonyms: ["chassis", "tower", "enclosure", "pc case", "gaming case"], relatedTerms: ["electronics", "computer", "housing", "hardware"], category: "electronics", subcategory: "components" },
  
  // Audio Equipment
  { term: "speaker", synonyms: ["loudspeaker", "audio speaker", "bluetooth speaker", "soundbar", "subwoofer"], relatedTerms: ["electronics", "audio", "sound", "music"], category: "electronics", subcategory: "audio" },
  { term: "sound system", synonyms: ["home theater", "hi fi", "stereo", "surround sound", "audio system"], relatedTerms: ["electronics", "audio", "entertainment", "home"], category: "electronics", subcategory: "audio" },
  { term: "amplifier", synonyms: ["amp", "audio amp", "power amp", "receiver", "preamp"], relatedTerms: ["electronics", "audio", "power", "sound"], category: "electronics", subcategory: "audio" },
  { term: "turntable", synonyms: ["record player", "vinyl player", "decks", "dj turntable", "hifi"], relatedTerms: ["electronics", "audio", "vinyl", "music"], category: "electronics", subcategory: "audio" },
  { term: "equalizer", synonyms: ["eq", "graphic equalizer", "parametric eq", "sound processor"], relatedTerms: ["electronics", "audio", "sound", "tuning"], category: "electronics", subcategory: "audio" },
  { term: "mixer", synonyms: ["audio mixer", "dj mixer", "soundboard", "mixing desk", "console"], relatedTerms: ["electronics", "audio", "mixing", "professional"], category: "electronics", subcategory: "audio" },
  { term: "karaoke machine", synonyms: ["karaoke system", "singing machine", "party box", "mic system"], relatedTerms: ["electronics", "entertainment", "music", "party"], category: "electronics", subcategory: "audio" },
  { term: "radio", synonyms: ["fm radio", "am radio", "digital radio", "dab", "internet radio"], relatedTerms: ["electronics", "audio", "broadcast", "music"], category: "electronics", subcategory: "audio" },
  { term: "walkie talkie", synonyms: ["two way radio", "transceiver", "handheld radio", "pmr"], relatedTerms: ["electronics", "communication", "radio", "outdoor"], category: "electronics", subcategory: "communication" },
  
  // TVs & Displays
  { term: "television", synonyms: ["tv", "smart tv", "led tv", "oled", "qled", "4k tv"], relatedTerms: ["electronics", "display", "entertainment", "home"], category: "electronics", subcategory: "tv" },
  { term: "projector", synonyms: ["beamer", "video projector", "home projector", "portable projector"], relatedTerms: ["electronics", "display", "presentation", "cinema"], category: "electronics", subcategory: "tv" },
  { term: "streaming device", synonyms: ["fire stick", "chromecast", "roku", "apple tv", "android tv"], relatedTerms: ["electronics", "streaming", "entertainment", "smart"], category: "electronics", subcategory: "tv" },
  { term: "tv mount", synonyms: ["wall bracket", "tv bracket", "wall mount", "ceiling mount"], relatedTerms: ["electronics", "installation", "tv", "mounting"], category: "electronics", subcategory: "accessories" },
  { term: "hdmi cable", synonyms: ["hdmi cord", "high speed hdmi", "hdmi 2.1", "4k cable"], relatedTerms: ["electronics", "connection", "video", "audio"], category: "electronics", subcategory: "accessories" },
  { term: "remote control", synonyms: ["remote", "controller", "universal remote", "smart remote", "ir remote"], relatedTerms: ["electronics", "control", "tv", "wireless"], category: "electronics", subcategory: "accessories" },
  { term: "antenna", synonyms: ["aerial", "tv antenna", "digital antenna", "outdoor antenna"], relatedTerms: ["electronics", "reception", "broadcast", "signal"], category: "electronics", subcategory: "accessories" },
  
  // Cameras & Photography
  { term: "camera", synonyms: ["digital camera", "dslr", "mirrorless", "compact", "point and shoot"], relatedTerms: ["electronics", "photography", "image", "capture"], category: "electronics", subcategory: "cameras" },
  { term: "action camera", synonyms: ["gopro", "sports cam", "helmet cam", "waterproof camera"], relatedTerms: ["electronics", "adventure", "sports", "video"], category: "electronics", subcategory: "cameras" },
  { term: "dash cam", synonyms: ["car camera", "dvr", "vehicle camera", "driving recorder"], relatedTerms: ["electronics", "car", "safety", "recording"], category: "electronics", subcategory: "cameras" },
  { term: "security camera", synonyms: ["cctv", "ip camera", "surveillance", "nvr", "wireless camera"], relatedTerms: ["electronics", "security", "monitoring", "safety"], category: "electronics", subcategory: "security" },
  { term: "doorbell camera", synonyms: ["video doorbell", "smart doorbell", "ring", "intercom camera"], relatedTerms: ["electronics", "security", "home", "access"], category: "electronics", subcategory: "security" },
  { term: "drone", synonyms: ["uav", "quadcopter", "flying camera", "aerial drone", "dji"], relatedTerms: ["electronics", "flying", "camera", "aerial"], category: "electronics", subcategory: "drones" },
  { term: "camera lens", synonyms: ["lens", "objective", "zoom lens", "prime lens", "wide angle"], relatedTerms: ["electronics", "photography", "optics", "camera"], category: "electronics", subcategory: "cameras" },
  { term: "flash", synonyms: ["speedlight", "strobe", "camera flash", "external flash"], relatedTerms: ["electronics", "photography", "lighting", "camera"], category: "electronics", subcategory: "cameras" },
  { term: "gimbal", synonyms: ["stabilizer", "camera stabilizer", "phone gimbal", "handheld stabilizer"], relatedTerms: ["electronics", "stability", "video", "smooth"], category: "electronics", subcategory: "cameras" },
  { term: "memory card reader", synonyms: ["card reader", "usb reader", "sd reader", "multi card reader"], relatedTerms: ["electronics", "transfer", "data", "storage"], category: "electronics", subcategory: "accessories" },
  { term: "camera bag", synonyms: ["photo bag", "dslr bag", "lens bag", "camera case", "backpack"], relatedTerms: ["electronics", "storage", "protection", "photography"], category: "electronics", subcategory: "accessories" },
  
  // Gaming
  { term: "game console", synonyms: ["playstation", "xbox", "nintendo", "switch", "gaming system"], relatedTerms: ["electronics", "gaming", "entertainment", "console"], category: "electronics", subcategory: "gaming" },
  { term: "gaming controller", synonyms: ["gamepad", "joystick", "controller", "wireless controller"], relatedTerms: ["electronics", "gaming", "control", "console"], category: "electronics", subcategory: "gaming" },
  { term: "vr headset", synonyms: ["virtual reality", "oculus", "meta quest", "vr goggles", "vr glasses"], relatedTerms: ["electronics", "gaming", "virtual", "immersive"], category: "electronics", subcategory: "gaming" },
  { term: "racing wheel", synonyms: ["steering wheel", "driving wheel", "force feedback", "racing controller"], relatedTerms: ["electronics", "gaming", "racing", "simulation"], category: "electronics", subcategory: "gaming" },
  { term: "gaming chair", synonyms: ["racing chair", "ergonomic chair", "gaming seat", "office chair"], relatedTerms: ["electronics", "gaming", "comfort", "furniture"], category: "electronics", subcategory: "gaming" },
  { term: "arcade machine", synonyms: ["arcade cabinet", "retro arcade", "pinball", "fighting game"], relatedTerms: ["electronics", "gaming", "retro", "entertainment"], category: "electronics", subcategory: "gaming" },
  { term: "capture card", synonyms: ["game capture", "streaming card", "hd capture", "recording device"], relatedTerms: ["electronics", "gaming", "streaming", "recording"], category: "electronics", subcategory: "gaming" },
  
  // Home Appliances - Smart Home
  { term: "smart speaker", synonyms: ["voice assistant", "alexa", "google home", "smart display", "echo"], relatedTerms: ["electronics", "smart home", "voice", "assistant"], category: "electronics", subcategory: "smart_home" },
  { term: "smart bulb", synonyms: ["wifi bulb", "color bulb", "led bulb", "philips hue", "smart light"], relatedTerms: ["electronics", "smart home", "lighting", "automation"], category: "electronics", subcategory: "smart_home" },
  { term: "smart plug", synonyms: ["wifi plug", "smart outlet", "connected plug", "power monitor"], relatedTerms: ["electronics", "smart home", "control", "automation"], category: "electronics", subcategory: "smart_home" },
  { term: "smart thermostat", synonyms: ["nest", "ecobee", "wifi thermostat", "programmable", "climate control"], relatedTerms: ["electronics", "smart home", "climate", "heating"], category: "electronics", subcategory: "smart_home" },
  { term: "robot vacuum", synonyms: ["roomba", "roborock", "robot cleaner", "automatic vacuum", "smart vacuum"], relatedTerms: ["electronics", "smart home", "cleaning", "automation"], category: "electronics", subcategory: "smart_home" },
  { term: "smart lock", synonyms: ["digital lock", "keyless entry", "wifi lock", "fingerprint lock"], relatedTerms: ["electronics", "smart home", "security", "access"], category: "electronics", subcategory: "smart_home" },
  { term: "video doorbell", synonyms: ["smart doorbell", "ring", "video intercom", "wireless doorbell"], relatedTerms: ["electronics", "smart home", "security", "door"], category: "electronics", subcategory: "smart_home" },
  { term: "smart sensor", synonyms: ["motion sensor", "door sensor", "window sensor", "water leak sensor"], relatedTerms: ["electronics", "smart home", "security", "detection"], category: "electronics", subcategory: "smart_home" },
  { term: "smart switch", synonyms: ["light switch", "wifi switch", "wall switch", "touch switch"], relatedTerms: ["electronics", "smart home", "control", "lighting"], category: "electronics", subcategory: "smart_home" },
  { term: "hub", synonyms: ["smart hub", "bridge", "controller", "gateway", "home center"], relatedTerms: ["electronics", "smart home", "control", "center"], category: "electronics", subcategory: "smart_home" },
  
  // Kitchen Electronics
  { term: "blender", synonyms: ["mixer", "juicer", "smoothie maker", "food processor", "nutribullet"], relatedTerms: ["electronics", "kitchen", "appliance", "food"], category: "electronics", subcategory: "kitchen" },
  { term: "coffee maker", synonyms: ["coffee machine", "espresso machine", "drip coffee", "french press", "keurig"], relatedTerms: ["electronics", "kitchen", "coffee", "beverage"], category: "electronics", subcategory: "kitchen" },
  { term: "microwave", synonyms: ["microwave oven", "countertop microwave", "convection microwave", "grill microwave"], relatedTerms: ["electronics", "kitchen", "heating", "cooking"], category: "electronics", subcategory: "kitchen" },
  { term: "toaster", synonyms: ["bread toaster", "pop up toaster", "toaster oven", "sandwich maker"], relatedTerms: ["electronics", "kitchen", "breakfast", "bread"], category: "electronics", subcategory: "kitchen" },
  { term: "kettle", synonyms: ["electric kettle", "water boiler", "tea kettle", "gooseneck", "variable temp"], relatedTerms: ["electronics", "kitchen", "water", "heating"], category: "electronics", subcategory: "kitchen" },
  { term: "rice cooker", synonyms: ["multicooker", "pressure cooker", "instant pot", "slow cooker", "crock pot"], relatedTerms: ["electronics", "kitchen", "cooking", "appliance"], category: "electronics", subcategory: "kitchen" },
  { term: "air fryer", synonyms: ["fryer", "oil free fryer", "convection oven", "healthy fryer"], relatedTerms: ["electronics", "kitchen", "cooking", "healthy"], category: "electronics", subcategory: "kitchen" },
  { term: "food processor", synonyms: ["chopper", "slicer", "grater", "kitchen machine", "blender"], relatedTerms: ["electronics", "kitchen", "preparation", "food"], category: "electronics", subcategory: "kitchen" },
  { term: "stand mixer", synonyms: ["kitchenaid", "mixer", "dough mixer", "planetary mixer", "bowl lift"], relatedTerms: ["electronics", "kitchen", "baking", "mixing"], category: "electronics", subcategory: "kitchen" },
  { term: "sous vide", synonyms: ["immersion circulator", "precision cooker", "water oven", "vacuum cooking"], relatedTerms: ["electronics", "kitchen", "cooking", "precision"], category: "electronics", subcategory: "kitchen" },
  { term: "bread maker", synonyms: ["bread machine", "dough maker", "baking machine", "loaf maker"], relatedTerms: ["electronics", "kitchen", "baking", "bread"], category: "electronics", subcategory: "kitchen" },
  { term: "ice maker", synonyms: ["ice machine", "portable ice", "nugget ice", "clear ice"], relatedTerms: ["electronics", "kitchen", "ice", "beverage"], category: "electronics", subcategory: "kitchen" },
  { term: "wine cooler", synonyms: ["wine fridge", "beverage cooler", "wine cellar", "chiller"], relatedTerms: ["electronics", "kitchen", "wine", "cooling"], category: "electronics", subcategory: "kitchen" },
  
  // Climate & Air Quality
  { term: "air purifier", synonyms: ["air cleaner", "hepa filter", "ionizer", "uv air purifier"], relatedTerms: ["electronics", "climate", "air", "health"], category: "electronics", subcategory: "climate" },
  { term: "humidifier", synonyms: ["mist maker", "vaporizer", "cool mist", "warm mist", "ultrasonic"], relatedTerms: ["electronics", "climate", "moisture", "comfort"], category: "electronics", subcategory: "climate" },
  { term: "dehumidifier", synonyms: ["moisture remover", "dryer", "basement dehumidifier", "portable"], relatedTerms: ["electronics", "climate", "dry", "comfort"], category: "electronics", subcategory: "climate" },
  { term: "fan", synonyms: ["cooling fan", "tower fan", "pedestal fan", "ceiling fan", "exhaust fan"], relatedTerms: ["electronics", "climate", "cooling", "air"], category: "electronics", subcategory: "climate" },
  { term: "air conditioner", synonyms: ["ac", "split ac", "portable ac", "window unit", "inverter"], relatedTerms: ["electronics", "climate", "cooling", "comfort"], category: "electronics", subcategory: "climate" },
  { term: "heater", synonyms: ["space heater", "ceramic heater", "oil heater", "radiator", "fan heater"], relatedTerms: ["electronics", "climate", "heating", "warmth"], category: "electronics", subcategory: "climate" },
  { term: "air quality monitor", synonyms: ["pollution sensor", "pm2.5 monitor", "co2 monitor", "voc detector"], relatedTerms: ["electronics", "climate", "monitoring", "health"], category: "electronics", subcategory: "climate" },
  
  // Power & Energy
  { term: "solar panel", synonyms: ["pv panel", "photovoltaic", "solar module", "solar cell"], relatedTerms: ["electronics", "energy", "solar", "renewable"], category: "electronics", subcategory: "energy" },
  { term: "inverter", synonyms: ["power inverter", "solar inverter", "pure sine", "modified sine"], relatedTerms: ["electronics", "energy", "power", "conversion"], category: "electronics", subcategory: "energy" },
  { term: "battery", synonyms: ["lithium battery", "lead acid", "power bank", "ups", "energy storage"], relatedTerms: ["electronics", "energy", "storage", "power"], category: "electronics", subcategory: "energy" },
  { term: "generator", synonyms: ["power generator", "portable generator", "inverter generator", "backup power"], relatedTerms: ["electronics", "energy", "power", "backup"], category: "electronics", subcategory: "energy" },
  { term: "ups", synonyms: ["uninterruptible power supply", "battery backup", "power protection", "surge protector"], relatedTerms: ["electronics", "energy", "protection", "backup"], category: "electronics", subcategory: "energy" },
  { term: "power strip", synonyms: ["surge protector", "extension cord", "multi plug", "adapter"], relatedTerms: ["electronics", "energy", "outlet", "protection"], category: "electronics", subcategory: "energy" },
  
  // Tools & Testing
  { term: "multimeter", synonyms: ["tester", "voltmeter", "ammeter", "digital multimeter", "dmm"], relatedTerms: ["electronics", "tools", "testing", "measurement"], category: "electronics", subcategory: "tools" },
  { term: "soldering iron", synonyms: ["solder station", "welding iron", "solder gun", "heat gun"], relatedTerms: ["electronics", "tools", "repair", "soldering"], category: "electronics", subcategory: "tools" },
  { term: "oscilloscope", synonyms: ["scope", "digital oscilloscope", "usb scope", "signal analyzer"], relatedTerms: ["electronics", "tools", "analysis", "signal"], category: "electronics", subcategory: "tools" },
  { term: "wire stripper", synonyms: ["cable stripper", "wire cutter", "crimping tool", "plier"], relatedTerms: ["electronics", "tools", "wiring", "repair"], category: "electronics", subcategory: "tools" },
  { term: "magnifying glass", synonyms: ["loupe", "magnifier", "inspection glass", "jewelers loupe"], relatedTerms: ["electronics", "tools", "inspection", "repair"], category: "electronics", subcategory: "tools" },
  { term: "anti static", synonyms: ["esd mat", "grounding strap", "anti static wrist", "esd protection"], relatedTerms: ["electronics", "tools", "protection", "safety"], category: "electronics", subcategory: "tools" },
];

export default electronicsTerms;
