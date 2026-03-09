import { query, mutation, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ==========================================
// INTELLIGENT SEARCH UTILITIES
// Inspired by Google and Alibaba search systems
// ==========================================

// Common stop words to filter out (English & French)
const STOP_WORDS = new Set([
  // English
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'will', 'with',
  'or', 'but', 'not', 'this', 'have', 'had', 'what', 'when', 'where', 'who',
  'which', 'their', 'said', 'each', 'which', 'she', 'do', 'how', 'if', 'up',
  'out', 'many', 'then', 'them', 'these', 'so', 'some', 'her', 'would', 'make',
  'like', 'into', 'has', 'him', 'time', 'two', 'more', 'go', 'no', 'way',
  'could', 'my', 'than', 'first', 'water', 'been', 'call', 'now', 'find',
  'long', 'down', 'day', 'did', 'get', 'come', 'made', 'may', 'part', 'over',
  'such', 'take', 'only', 'little', 'work', 'know', 'place', 'year', 'live',
  'back', 'give', 'most', 'very', 'after', 'thing', 'our', 'just', 'name',
  'good', 'sentence', 'man', 'think', 'say', 'great', 'where', 'help',
  'through', 'much', 'before', 'move', 'right', 'too', 'any', 'same',
  'tell', 'boy', 'follow', 'came', 'want', 'show', 'also', 'around',
  'farm', 'three', 'small', 'set', 'put', 'end', 'does', 'another', 'well',
  'large', 'must', 'big', 'even', 'land', 'here', 'did', 'why', 'went',
  'men', 'read', 'need', 'different', 'home', 'us', 'move', 'try', 'kind',
  'hand', 'picture', 'again', 'change', 'off', 'play', 'spell', 'air',
  'away', 'animal', 'house', 'point', 'page', 'letter', 'mother', 'answer',
  'found', 'study', 'still', 'learn', 'should', 'america', 'world', 'high',
  'every', 'near', 'add', 'food', 'between', 'own', 'below', 'country',
  'plant', 'last', 'school', 'father', 'keep', 'tree', 'never', 'start',
  'city', 'earth', 'eyes', 'light', 'thought', 'head', 'under', 'story',
  'saw', 'left', "don't", 'few', 'while', 'along', 'might', 'close',
  'something', 'seem', 'next', 'hard', 'open', 'example', 'begin', 'life',
  'always', 'those', 'both', 'paper', 'together', 'got', 'group', 'often',
  'run', 'important', 'until', 'children', 'side', 'feet', 'car', 'mile',
  'night', 'walk', 'white', 'sea', 'began', 'grow', 'took', 'river',
  'four', 'carry', 'state', 'once', 'book', 'hear', 'stop', 'without',
  'second', 'late', 'miss', 'idea', 'enough', 'eat', 'face', 'watch',
  'far', 'indian', 'real', 'almost', 'let', 'above', 'girl', 'sometimes',
  'mountain', 'cut', 'young', 'talk', 'soon', 'list', 'song', 'being',
  'leave', 'family', "it's", 'body', 'music', 'color', 'stand', 'sun',
  'questions', 'fish', 'area', 'mark', 'dog', 'horse', 'birds', 'problem',
  'complete', 'room', 'knew', 'since', 'ever', 'piece', 'told', 'usually',
  'didn', 'friends', 'easy', 'heard', 'order', 'red', 'door', 'sure',
  'become', 'top', 'ship', 'across', 'today', 'during', 'short', 'better',
  'best', 'however', 'low', 'hours', 'black', 'products', 'happened',
  'whole', 'measure', 'remember', 'early', 'waves', 'reached', 'listen',
  'wind', 'rock', 'space', 'covered', 'fast', 'several', 'hold', 'himself',
  'toward', 'five', 'step', 'morning', 'passed', 'vowel', 'true', 'hundred',
  'against', 'pattern', 'numeral', 'table', 'north', 'slowly', 'money',
  'map', 'farm', 'pull', 'voice', 'seen', 'cold', 'cried', 'plan', 'notice',
  'south', 'sing', 'war', 'ground', 'fall', 'king', 'town', 'i’ll', 'unit',
  'figure', 'certain', 'field', 'travel', 'wood', 'fire', 'upon', 'done',
  'english', 'road', 'half', 'ten', 'fly', 'gave', 'box', 'finally', 'wait',
  'correct', 'oh', 'quickly', 'person', 'became', 'shown', 'minutes',
  'strong', 'verb', 'stars', 'front', 'feel', 'fact', 'inches', 'street',
  'decided', 'contain', 'course', 'surface', 'produce', 'building', 'ocean',
  'class', 'note', 'nothing', 'rest', 'carefully', 'scientists', 'inside',
  'wheels', 'stay', 'green', 'known', 'island', 'week', 'less', 'machine',
  'base', 'ago', 'stood', 'plane', 'system', 'behind', 'ran', 'round',
  'boat', 'game', 'force', 'understand', 'warm', 'common', 'bring',
  'explain', 'dry', 'though', 'language', 'shape', 'deep', 'thousands',
  'yes', 'clear', 'equation', 'yet', 'government', ' filled', 'heat',
  'full', 'hot', 'check', 'object', 'am', 'rule', 'among', 'noun', 'power',
  'cannot', 'able', 'six', 'size', 'dark', 'ball', 'material', 'special',
  'heavy', 'fine', 'pair', 'circle', 'include', 'built', "can't", 'matter',
  'square', 'syllables', 'perhaps', 'bill', 'felt', 'suddenly', 'test',
  'direction', 'center', 'farmers', 'ready', 'anything', 'divided', 'general',
  'energy', 'subject', 'europe', 'moon', 'region', 'return', 'believe',
  'dance', 'members', 'picked', 'simple', 'cells', 'paint', 'mind', 'cause',
  'love', 'cause', 'rain', 'exercise', 'eggs', 'train', 'blue', 'wish',
  'drop', 'developed', 'window', 'difference', 'distance', 'heart', 'sit',
  'sum', 'summer', 'wall', 'forest', 'probably', 'legs', 'sat', 'main',
  'wide', 'written', 'length', 'returned', 'nature', 'arms', 'brother',
  'race', 'present', 'beautiful', 'store', 'job', 'edge', 'past', 'sign',
  'record', 'finished', 'discovered', 'wild', 'happy', 'beside', 'gone',
  'sky', 'grass', 'million', 'west', 'lay', 'weather', 'root', 'instruments',
  'meet', 'third', 'months', 'paragraph', 'raised', 'represent', 'soft',
  'whether', 'clothes', 'flowers', 'should', 'teacher', 'held', 'describe',
  'drive', 'cross', 'speak', 'solve', 'appear', 'metal', 'son', 'either',
  'ice', 'sleep', 'village', 'factors', 'result', 'jumped', 'snow', 'ride',
  'care', 'floor', 'hill', 'pushed', 'baby', 'buy', 'century', 'outside',
  'everything', 'tall', 'already', 'instead', 'phrase', 'soil', 'bed',
  ' reached', 'members', 'add', 'belong', 'safe', 'interest', 'gold',
  'continue', 'west', 'keep', 'real', 'pounds', 'latin', 'mass', 'solid',
  'sounds', 'bottom', 'wind', 'were', 'negative', 'positive', 'specific',
  'information', 'map', 'upon', 'space', 'heard', 'main', 'matter', 'center',
  'reached', 'table', 'value', 'town', 'located', 'certain', 'paper', 'east',
  'whose', 'shown', 'built', 'middle', 'stay', 'close', 'late', 'itself',
  'found', 'hard', 'display', 'surface', 'strong', 'sense', 'service',
  'given', 'lines', 'product', 'website', 'pressure', 'support', 'certain',
  'higher', 'simple', 'future', 'various', 'require', 'along', 'results',
  'action', 'physical', 'report', 'matter', 'inside', 'method', 'scale',
  'rate', 'base', 'therefore', 'post', 'east', 'according', 'range', 'events',
  'light', 'thing', 'told', 'major', 'close', 'terms', 'receive', 'simple',
  'process', 'share', 'makes', 'building', 'range', 'built', 'certain',
  'price', 'according', 'told', 'plus', 'post', 'sold', 'shown', 'standard',
  'industry', 'basis', 'outside', 'makes', 'based', 'taking', 'means',
  'cannot', 'provide', 'within', 'coming', 'using', 'effect', 'working',
  'further', 'help', 'business', 'issue', 'large', 'small', 'medium',
  'extra', 'size', 'sizes', 'new', 'old', 'brand', 'genuine', 'authentic',
  'original', 'quality', 'high', 'low', 'best', 'better', 'good', 'nice',
  // French
  'le', 'la', 'les', 'un', 'une', 'des', 'et', 'ou', 'mais', 'donc', 'or',
  'ni', 'car', 'de', 'du', 'des', 'à', 'au', 'aux', 'en', 'par', 'pour',
  'avec', 'sans', 'sur', 'sous', 'dans', 'chez', 'vers', 'entre', 'parmi',
  'contre', 'devant', 'derrière', 'après', 'avant', 'pendant', 'durant',
  'depuis', 'jusque', 'jusqu', 'voici', 'voilà', 'ce', 'cet', 'cette', 'ces',
  'mon', 'ton', 'son', 'notre', 'votre', 'leur', 'ma', 'ta', 'sa', 'mes',
  'tes', 'ses', 'nos', 'vos', 'leurs', 'qui', 'que', 'quoi', 'dont', 'où',
  'quand', 'comment', 'pourquoi', 'combien', 'quel', 'quelle', 'quels',
  'quelles', 'comme', 'tel', 'telle', 'tels', 'telles', 'tout', 'toute',
  'tous', 'toutes', 'autre', 'autres', 'même', 'mêmes', 'plusieurs', 'aucun',
  'aucune', 'nul', 'nulle', 'personne', 'rien', 'chacun', 'chacune', 'certains',
  'certaine', 'certains', 'certaines', 'tellement', 'trop', 'plus', 'moins',
  'assez', 'très', 'peu', 'beaucoup', 'tant', 'tel', 'telle', 'tels', 'telles',
  'alors', 'ainsi', 'aussi', 'donc', 'pourtant', 'cependant', 'néanmoins',
  'toutefois', 'quoique', 'bien', 'mal', 'oui', 'non', 'si', 'sûrement',
  'peut-être', 'probablement', 'vraiment', 'certainement', 'absolument',
  'totalement', 'complètement', 'entièrement', 'particulièrement', 'surtout',
  'notamment', 'souvent', 'toujours', 'jamais', 'parfois', 'rarement',
  'maintenant', 'aujourd', 'hui', 'hier', 'demain', 'déjà', 'encore',
  'bientôt', 'tôt', 'tard', 'autrefois', 'jadis', 'voici', 'voilà', 'ci',
  'là', 'y', 'en', 'lui', 'elle', 'eux', 'elles', 'soi', 'moi', 'toi', 'se',
  'me', 'te', 'se', 'nous', 'vous', 'se', 'je', 'tu', 'il', 'elle', 'on',
  'nous', 'vous', 'ils', 'elles', 'ne', 'pas', 'plus', 'point', 'jamais',
  'guère', 'aucunement', 'nullement', 'être', 'avoir', 'faire', 'aller',
  'venir', 'pouvoir', 'savoir', 'falloir', 'voir', 'vouloir', 'falloir',
  'sembler', 'paraître', 'devenir', 'rester', 'demeurer', 'paraître',
  'suffire', 'falloir', 'pleuvoir', 'neiger', 'falloir'
]);

// Product type keywords for category inference
// NOTE: Keywords should be specific to avoid overlap between categories
const PRODUCT_TYPE_PATTERNS: Record<string, string[]> = {
  // IT/Informatique - specific tech infrastructure and office equipment
  'it': ['printer', 'printers', 'imprimante', 'imprimantes', 'scanner', 'scanners', 'scanneur', 'photocopier', 'photocopieur', 'copier', 'copieur', 'toner', 'cartridge', 'cartouche', 'ink', 'encre', 'desktop', 'bureau', 'workstation', 'poste', 'serveur', 'server', 'nas', 'storage', 'stockage', 'backup', 'sauvegarde', 'firewall', 'routeur', 'router', 'switch', 'hub', 'cable', 'câble', 'ethernet', 'rj45', 'hdmi', 'vga', 'usb', 'peripheral', 'périphérique', 'keyboard', 'clavier', 'mouse', 'souris', 'monitor', 'écran', 'ecran', 'display', 'affichage', 'projector', 'projecteur', 'videoprojector', 'vidéoprojecteur', 'software', 'logiciel', 'license', 'licence', 'subscription', 'abonnement', 'cloud', 'saas', 'virtualization', 'virtualisation', 'hosting', 'hébergement', 'domain', 'nom de domaine', 'website', 'site web', 'web', 'application', 'erp', 'crm', 'database', 'base de données', 'sql', 'nosql', 'programming', 'programmation', 'development', 'développement', 'code', 'coding', 'api', 'integration', 'intégration', 'automation', 'automatisme', 'robotic', 'robotique', 'iot', 'internet des objets', 'smart', 'connecté', 'connected', 'network', 'réseau', 'infrastructure', 'sysadmin', 'administrateur', 'technician', 'technicien', 'support', 'helpdesk', 'assistance', 'maintenance', 'repair', 'réparation', 'informatique'],
  
  // Electronics/Électronique - consumer devices and electronic components  
  'electronics': ['fan', 'fans', 'ventilateur', 'ventilateurs', 'phone', 'phones', 'téléphone', 'telephone', 'mobile', 'portable', 'smartphone', 'laptop', 'laptops', 'notebook', 'ultrabook', 'tablet', 'tablette', 'ipad', 'android', 'tv', 'television', 'télévision', 'smart tv', 'oled', 'lcd', 'led', '4k', '8k', 'hd', 'radio', 'speaker', 'speakers', 'enceinte', 'enceintes', 'haut-parleur', 'audio', 'sound', 'son', 'camera', 'caméra', 'appareil photo', 'reflex', 'mirrorless', 'drone', 'drones', 'gopro', 'action camera', 'charger', 'chargeur', 'charging', 'battery', 'batteries', 'batterie', 'powerbank', 'batterie externe', 'solar', 'solaire', 'panel', 'panneau', 'panneau solaire', 'usb', 'hdmi', 'cable', 'câble', 'electronic', 'électronique', 'electronique', 'gadget', 'device', 'appareil', 'appliance', 'électroménager', 'electromenager', 'tech', 'technology', 'technologie', 'component', 'composant', 'circuit', 'pcb', 'motherboard', 'carte mère', 'processor', 'processeur', 'cpu', 'gpu', 'graphics', 'graphique', 'memory', 'mémoire', 'ram', 'storage', 'disque', 'hard drive', 'hdd', 'ssd', 'flash', 'sd card', 'micro sd', 'adapter', 'adaptateur', 'converter', 'convertisseur', 'remote', 'télécommande', 'telecommande', 'sensor', 'capteur', 'switch', 'bouton', 'led', 'diode', 'transistor', 'resistor', 'résistance', 'capacitor', 'condensateur', 'relay', 'relais', 'motor', 'moteur', 'engine', 'generator', 'générateur', 'inverter', 'onduleur', 'ups', 'regulator', 'régulateur', 'stabilizer', 'stabilisateur', 'plug', 'prise', 'socket', 'outlet', 'extension', 'multiprise', 'power strip', 'surge protector', 'parafoudre', 'home appliance', 'kitchen appliance', 'consumer electronics', 'domotique', 'smart home', 'maison connectée', 'wearable', 'montre connectée', 'smartwatch', 'fitness tracker', 'bracelet', 'ecran', 'screen', 'display'],
  
  // Keep other categories with expanded keywords...
  'electronique': ['fan', 'fans', 'ventilateur', 'ventilateurs', 'phone', 'phones', 'téléphone', 'telephone', 'mobile', 'portable', 'smartphone', 'laptop', 'laptops', 'notebook', 'ultrabook', 'tablet', 'tablette', 'ipad', 'android', 'tv', 'television', 'télévision', 'smart tv', 'oled', 'lcd', 'led', '4k', '8k', 'hd', 'radio', 'speaker', 'speakers', 'enceinte', 'enceintes', 'haut-parleur', 'audio', 'sound', 'son', 'camera', 'caméra', 'appareil photo', 'reflex', 'mirrorless', 'drone', 'drones', 'gopro', 'action camera', 'charger', 'chargeur', 'charging', 'battery', 'batteries', 'batterie', 'powerbank', 'batterie externe', 'solar', 'solaire', 'panel', 'panneau', 'panneau solaire', 'usb', 'hdmi', 'cable', 'câble', 'electronic', 'électronique', 'electronique', 'gadget', 'device', 'appareil', 'appliance', 'électroménager', 'electromenager', 'tech', 'technology', 'technologie', 'component', 'composant', 'circuit', 'pcb', 'motherboard', 'carte mère', 'processor', 'processeur', 'cpu', 'gpu', 'graphics', 'graphique', 'memory', 'mémoire', 'ram', 'storage', 'disque', 'hard drive', 'hdd', 'ssd', 'flash', 'sd card', 'micro sd', 'adapter', 'adaptateur', 'converter', 'convertisseur', 'remote', 'télécommande', 'telecommande', 'sensor', 'capteur', 'switch', 'bouton', 'led', 'diode', 'transistor', 'resistor', 'résistance', 'capacitor', 'condensateur', 'relay', 'relais', 'motor', 'moteur', 'engine', 'generator', 'générateur', 'inverter', 'onduleur', 'ups', 'regulator', 'régulateur', 'stabilizer', 'stabilisateur', 'plug', 'prise', 'socket', 'outlet', 'extension', 'multiprise', 'power strip', 'surge protector', 'parafoudre', 'home appliance', 'kitchen appliance', 'consumer electronics', 'domotique', 'smart home', 'maison connectée', 'wearable', 'montre connectée', 'smartwatch', 'fitness tracker', 'bracelet', 'ecran', 'screen', 'display'],

  // Home/Mobilier - furniture and home decor
  'home': ['furniture', 'meuble', 'meubles', 'chair', 'chaise', 'chaises', 'armchair', 'fauteuil', 'rocking chair', 'berçante', 'table', 'tables', 'dining table', 'table à manger', 'coffee table', 'table basse', 'desk', 'bureau', 'console', 'bed', 'lit', 'lits', 'bedroom', 'chambre', 'sofa', 'canapé', 'canape', 'couch', 'divan', ' Chesterfield', 'sectional', 'd angle', 'loveseat', 'cabinet', 'cabinet', 'armoire', 'wardrobe', 'dressing', 'shelf', 'étagère', 'etagere', 'shelves', 'bookshelf', 'bibliothèque', 'dresser', 'commode', 'chiffonnier', 'chest', 'coffre', 'mattress', 'matelas', 'pillow', 'oreiller', 'coussin', 'cushion', 'blanket', 'couverture', 'throw', 'plaid', 'bedding', 'linge de lit', 'curtain', 'rideau', 'rideaux', 'drapes', 'voilage', 'sheer', 'carpet', 'tapis', 'moquette', 'rug', 'carpette', 'lamp', 'lampe', 'lampshade', 'abat-jour', 'chandelier', 'lustre', 'pendant', 'suspension', 'wall lamp', 'applique', 'floor lamp', 'lampadaire', 'ceiling', 'plafonnier', 'light', 'lumière', 'luminaire', 'lighting', 'éclairage', 'mirror', 'miroir', 'glace', 'clock', 'horloge', 'pendule', 'réveil', 'alarm', 'decor', 'décoration', 'decoration', 'ornament', 'objet decoratif', 'vase', 'frame', 'cadre', 'painting', 'tableau', 'art', 'wall art', 'stickers', 'decal', 'tapisserie', 'wallpaper', 'papier peint', 'paint', 'peinture', 'color', 'couleur', 'home', 'maison', 'house', 'interior', 'intérieur', 'interieur', 'design', 'decoration', 'ameublement', 'furnishing', 'carpentry', 'menuiserie', 'woodwork', 'ebenisterie'],
  
  // Kitchen/Cuisine - cooking and kitchen equipment
  'kitchen': ['cooker', 'cuisinière', 'stove', 'fourneau', 'gas cooker', 'cuisinière gaz', 'electric cooker', 'cuisinière électrique', 'induction', 'induction', 'oven', 'four', 'micro-ondes', 'microwave', 'grill', 'rotisserie', 'pot', 'marmite', 'casserole', 'poêle', 'poele', 'pan', 'frying pan', 'poêle à frire', 'saute pan', 'wok', 'pressure cooker', 'autocuiseur', 'cocotte', 'dutch oven', 'plate', 'assiette', 'dish', 'plat', 'bowl', 'bol', 'cup', 'tasse', 'mug', 'glass', 'verre', 'goblet', 'chalice', 'utensil', 'ustensile', 'kitchenware', 'batterie de cuisine', 'knife', 'couteau', 'couteaux', 'cutlery', 'couverts', 'spoon', 'cuillère', 'cuillere', 'fork', 'fourchette', 'spatula', 'louche', 'ladle', 'whisk', 'fouet', 'tongs', 'pince', 'peeler', 'éplucheur', 'grater', 'râpe', 'rape', 'blender', 'mixeur', 'mixer', 'batteur', 'grinder', 'moulin', 'mill', 'food processor', 'robot', 'multifonction', 'juicer', 'presse-agrumes', 'extractor', 'extracteur', 'fridge', 'réfrigérateur', 'refrigerator', 'congelateur', 'freezer', 'cold room', 'chambre froide', 'ice maker', 'machine à glaçons', 'dishwasher', 'lave-vaisselle', 'sink', 'évier', 'evier', 'faucet', 'robinet', 'tap', 'countertop', 'plan de travail', 'kitchen island', 'îlot', 'cabinet', 'element', 'élément', 'cupboard', 'placard', 'pantry', 'garde-manger', 'spice rack', 'range-épices', 'trash', 'poubelle', 'bin', 'compost', 'apron', 'tablier', 'towel', 'torchon', 'napkin', 'serviette', 'tablecloth', 'nappe', 'placemat', 'set de table', 'coaster', 'dessous de verre', 'container', 'contenant', 'storage', 'conservation', 'jar', 'bocal', 'pot', 'canister', 'boîte', 'boite', 'lid', 'couvercle', 'cover', 'cling film', 'film alimentaire', 'aluminum foil', 'papier aluminium', 'wax paper', 'papier sulfurisé', 'parchment', 'baking', 'cuisson', 'pastry', 'pâtisserie', 'patisserie', 'bread', 'pain', 'cake', 'gâteau', 'gateau', 'recipe', 'recette', 'cookbook', 'livre de cuisine', 'chef', 'cooking', 'cuisine', 'culinary', 'culinaire', 'gastronomy', 'gastronomie', 'organic', 'bio', 'biologique', 'fresh', 'frais', 'frozen', 'surgelé', 'canned', 'conserve', 'conserve', 'packaged', 'emballé'],

  // Keep other categories concise but add key terms...
  'clothing': ['shirt', 'chemise', 't-shirt', 'polo', 'dress', 'robe', 'pants', 'pantalon', 'jeans', 'trousers', 'short', 'skirt', 'jupe', 'jacket', 'veste', 'blazer', 'coat', 'manteau', 'trench', 'overcoat', 'shoe', 'chaussure', 'boot', 'bottine', 'bottes', 'sandal', 'sandale', 'tongs', 'flip-flop', 'slipper', 'chausson', 'hat', 'chapeau', 'cap', 'casquette', 'bonnet', 'beanie', 'bag', 'sac', 'handbag', 'sac à main', 'backpack', 'sac à dos', 'wallet', 'portefeuille', 'purse', 'portemonnaie', 'belt', 'ceinture', 'scarf', 'foulard', 'écharpe', 'echarpe', 'tie', 'cravate', 'bow tie', 'nœud papillon', 'sock', 'chaussette', 'underwear', 'sous-vêtement', 'sous vetement', 'lingerie', 'bra', 'soutien-gorge', 'boxer', 'brief', 'slip', 'cloth', 'tissu', 'fabric', 'textile', 'material', 'matière', 'cotton', 'coton', 'silk', 'soie', 'linen', 'lin', 'wool', 'laine', 'leather', 'cuir', 'synthetic', 'synthétique', 'jean', 'denim', 'velvet', 'velours', 'lace', 'dentelle', 'embroidery', 'broderie', 'pattern', 'motif', 'print', 'imprimé', 'stripe', 'rayure', 'check', 'carreau', 'plaid', 'tartan', 'solid', 'uni', 'tailor', 'tailleur', 'seamstress', 'couturière', 'fashion', 'mode', 'style', 'trend', 'tendance', 'collection', 'haute couture', 'ready-to-wear', 'prêt-à-porter', 'sportswear', 'activewear', 'swimwear', 'maillot de bain', 'sleepwear', 'pyjama', 'nightgown', 'accessory', 'accessoire', 'jewelry', 'bijou', 'bijoux', 'watch', 'montre', 'sunglasses', 'lunettes de soleil'],
  
  // Food simplified with key additions
  'food': ['rice', 'riz', 'basmati', 'jasmine', 'long grain', 'broken', 'thai', 'bean', 'haricot', 'lentil', 'lentille', 'pea', 'pois', 'chickpea', 'pois chiche', 'yam', 'igname', 'cassava', 'manioc', 'plantain', 'banane plantain', 'banana', 'banane', 'mango', 'mangue', 'orange', 'apple', 'pomme', 'pineapple', 'ananas', 'papaya', 'papaye', 'guava', 'goyave', 'avocado', 'avocat', 'tomato', 'tomate', 'pepper', 'poivre', 'piment', 'chili', 'onion', 'oignon', 'garlic', 'ail', 'ginger', 'gingembre', 'oil', 'huile', 'palm oil', 'huile de palme', 'vegetable oil', 'huile végétale', 'olive oil', 'huile dolive', 'groundnut', 'arachide', 'peanut', 'cacahuète', 'vegetable', 'légume', 'legume', 'fruit', 'meat', 'viande', 'beef', 'bœuf', 'boeuf', 'steak', 'entrecôte', 'liver', 'foie', 'kidney', 'rognon', 'tripe', 'tripes', 'fish', 'poisson', 'tilapia', 'mackerel', 'maquereau', 'sardine', 'herring', 'hareng', 'smoked', 'fumé', 'dried', 'séché', 'stockfish', 'morue', 'chicken', 'poulet', 'hen', 'poule', 'turkey', 'dinde', 'duck', 'canard', 'goat', 'chèvre', 'chevre', 'mutton', 'mouton', 'lamb', 'agneau', 'pork', 'porc', 'sausage', 'saucisse', 'salami', 'ham', 'jambon', 'bacon', 'snack', 'biscuit', 'cookie', 'cracker', 'chip', 'chips', 'plantain chips', 'chips de plantain', 'drink', 'boisson', 'beverage', 'juice', 'jus', 'water', 'eau', 'mineral', 'minérale', 'soda', 'soft drink', 'nectar', 'wine', 'vin', 'beer', 'bière', 'liqueur', 'spirit', 'spiritueux', 'whiskey', 'whisky', 'vodka', 'gin', 'rum', 'rhum', 'food', 'nourriture', 'aliment', 'grocery', 'épicerie', 'provision', 'grain', 'cereal', 'céréale', 'flour', 'farine', 'semolina', 'semoule', 'cornmeal', 'fleur de maïs', 'gari', 'cassava flour', 'spice', 'épice', 'épices', 'seasoning', 'assaisonnement', 'condiment', 'sauce', 'broth', 'bouillon', 'cube', 'sugar', 'sucre', 'salt', 'sel', 'powdered', 'piment', 'curry', 'turmeric', 'curcuma', 'cinnamon', 'cannelle', 'nutmeg', 'muscade', 'ginger', 'clove', 'girofle', 'bay leaf', 'laurier', 'thyme', 'thym', 'basil', 'basilic', 'parsley', 'persil', 'rosemary', 'romarin', 'mint', 'menthe', 'oregano', 'origan', 'preserved', 'conserve', 'canned', 'en boîte', 'frozen', 'surgelé', 'dried', 'déshydraté', 'powdered', 'en poudre', 'organic', 'bio', 'fresh', 'frais', 'raw', 'brut', 'processed', 'transformé', 'agroalimentaire', 'agro-food', 'agribusiness', 'nutrition', 'nutriment', 'dietary', 'alimentaire'],
  
  'agroalimentaire': ['rice', 'riz', 'bean', 'haricot', 'lentil', 'lentille', 'yam', 'igname', 'cassava', 'manioc', 'plantain', 'banana', 'banane', 'mango', 'mangue', 'orange', 'apple', 'pomme', 'tomato', 'tomate', 'pepper', 'poivre', 'piment', 'onion', 'oignon', 'garlic', 'ail', 'ginger', 'gingembre', 'oil', 'huile', 'palm', 'palme', 'vegetable', 'légume', 'fruit', 'meat', 'viande', 'beef', 'bœuf', 'boeuf', 'fish', 'poisson', 'chicken', 'poulet', 'turkey', 'dinde', 'goat', 'chèvre', 'chevre', 'mutton', 'mouton', 'pork', 'porc', 'snack', 'biscuit', 'drink', 'boisson', 'juice', 'jus', 'water', 'eau', 'food', 'nourriture', 'grocery', 'épicerie', 'grain', 'cereal', 'céréale', 'flour', 'farine', 'spice', 'épice', 'seasoning', 'assaisonnement', 'sugar', 'sucre', 'salt', 'sel', 'organic', 'bio', 'fresh', 'frais', 'processed', 'transformé', 'conserve', 'canned', 'agroalimentaire'],
  
  'beauty': ['cream', 'crème', 'creme', 'lotion', 'lait', 'soap', 'savon', 'shampoo', 'shampooing', 'après-shampooing', 'conditioner', 'masque', 'mask', 'perfume', 'parfum', 'fragrance', 'eau de toilette', 'cologne', 'makeup', 'maquillage', 'cosmetic', 'cosmétique', 'cosmetique', 'lipstick', 'rouge à lèvres', 'lip gloss', 'gloss', 'foundation', 'fond de teint', 'powder', 'poudre', 'mascara', 'eye liner', 'eye shadow', 'ombre à paupières', 'blush', 'fard', 'concealer', 'correcteur', 'nail polish', 'vernis', 'manicure', 'pedicure', 'hair', 'cheveux', 'coiffure', 'wig', 'perruque', 'weave', 'tissage', 'braid', 'tresse', 'hair extension', 'extension', 'skin', 'peau', 'derma', 'facial', 'soin visage', 'beauty', 'beauté', 'beaute', 'care', 'soin', 'soins', 'oil', 'huile', 'essential oil', 'huile essentielle', 'gel', 'mousse', 'spray', 'deodorant', 'déodorant', 'deo', 'antiperspirant', 'hygiene', 'hygiène', 'sanitary', 'hygiénique', 'pad', 'serviette', 'tampon', 'cotton', 'coton', 'wool', 'laine', 'wax', 'cire', 'tweezer', 'pince', 'razor', 'rasoir', 'blade', 'lame', 'shaving', 'rasage', 'epilator', 'épilateur', 'hair removal', 'épilation', 'epilation', 'depilation', 'dépilation', 'sunscreen', 'écran solaire', 'protection solaire', 'anti-aging', 'anti-âge', 'anti-rides', 'wrinkle', 'ride', 'anti-acne', 'anti-imperfection', 'acne', 'acné', 'moisturizer', 'hydratant', 'serum', 'sérum', 'toner', 'tonique', 'cleanser', 'nettoyant', 'exfoliant', 'scrub', 'gommage', 'peeling', 'mask', 'masque', 'patch', 'herbal', 'herbal', 'naturel', 'organic', 'bio', 'vegan', 'cruelty-free', 'paraben-free', 'sulfate-free', 'silicone-free', 'dermatology', 'dermatologie', 'aesthetic', 'esthétique', 'esthetique', 'spa', 'salon', 'institut', 'barbershop', 'coiffeur', 'barbier', 'salon de coiffure'],
  
  'beauté': ['cream', 'crème', 'creme', 'lotion', 'lait', 'soap', 'savon', 'shampoo', 'shampooing', 'après-shampooing', 'conditioner', 'masque', 'mask', 'perfume', 'parfum', 'fragrance', 'eau de toilette', 'cologne', 'makeup', 'maquillage', 'cosmetic', 'cosmétique', 'cosmetique', 'lipstick', 'rouge à lèvres', 'lip gloss', 'gloss', 'foundation', 'fond de teint', 'powder', 'poudre', 'mascara', 'eye liner', 'eye shadow', 'ombre à paupières', 'blush', 'fard', 'concealer', 'correcteur', 'nail polish', 'vernis', 'manicure', 'pedicure', 'hair', 'cheveux', 'coiffure', 'wig', 'perruque', 'weave', 'tissage', 'braid', 'tresse', 'hair extension', 'extension', 'skin', 'peau', 'derma', 'facial', 'soin visage', 'beauty', 'beauté', 'beaute', 'care', 'soin', 'soins', 'oil', 'huile', 'essential oil', 'huile essentielle', 'gel', 'mousse', 'spray', 'deodorant', 'déodorant', 'deo', 'antiperspirant', 'hygiene', 'hygiène', 'sanitary', 'hygiénique', 'pad', 'serviette', 'tampon', 'cotton', 'coton', 'wool', 'laine', 'wax', 'cire', 'tweezer', 'pince', 'razor', 'rasoir', 'blade', 'lame', 'shaving', 'rasage', 'epilator', 'épilateur', 'hair removal', 'épilation', 'epilation', 'depilation', 'dépilation', 'sunscreen', 'écran solaire', 'protection solaire', 'anti-aging', 'anti-âge', 'anti-rides', 'wrinkle', 'ride', 'anti-acne', 'anti-imperfection', 'acne', 'acné', 'moisturizer', 'hydratant', 'serum', 'sérum', 'toner', 'tonique', 'cleanser', 'nettoyant', 'exfoliant', 'scrub', 'gommage', 'peeling', 'mask', 'masque', 'patch', 'herbal', 'herbal', 'naturel', 'organic', 'bio', 'vegan', 'cruelty-free', 'paraben-free', 'sulfate-free', 'silicone-free', 'dermatology', 'dermatologie', 'aesthetic', 'esthétique', 'esthetique', 'spa', 'salon', 'institut', 'barbershop', 'coiffeur', 'barbier', 'salon de coiffure'],

  'health': ['medicine', 'médicament', 'medicament', 'drug', 'pharmaceutical', 'pharmaceutique', 'pill', 'pilule', 'tablet', 'comprimé', 'comprime', 'capsule', 'syrup', 'sirop', 'suspension', 'solution', 'injection', 'ampoule', 'vitamin', 'vitamine', 'supplement', 'complément', 'complement', 'dietary', 'alimentaire', 'nutraceutical', 'probiotic', 'probiotique', 'antibiotic', 'antibiotique', 'antiseptic', 'antiseptique', 'painkiller', 'analgesic', 'analgesique', 'anti-inflammatory', 'anti-inflammatoire', 'fever', 'fièvre', 'fievre', 'malaria', 'paludisme', 'typhoid', 'typhoïde', 'typhoide', 'hypertension', 'tension', 'diabetes', 'diabète', 'diabete', 'asthma', 'asthme', 'allergy', 'allergie', 'medical', 'médical', 'medical', 'health', 'santé', 'sante', 'clinic', 'clinique', 'dispensary', 'dispensaire', 'pharmacy', 'pharmacie', 'chemist', 'drugstore', 'hospital', 'hôpital', 'hopital', 'medical center', 'centre médical', 'centre medical', 'health center', 'centre de santé', 'doctor', 'docteur', 'médecin', 'medecin', 'physician', 'general practitioner', 'médecin généraliste', 'specialist', 'spécialiste', 'nurse', 'infirmier', 'infirmière', 'infirmiere', 'midwife', 'sage-femme', 'laboratory', 'laboratoire', 'lab', 'radiology', 'radiologie', 'x-ray', 'rayon x', 'ultrasound', 'échographie', 'echographie', 'scanner', 'mri', 'irm', 'diagnostic', 'diagnostic', 'test', 'analyse', 'blood test', 'analyse sanguine', 'treatment', 'traitement', 'therapy', 'thérapie', 'therapie', 'surgery', 'chirurgie', 'operation', 'opération', 'operation', 'consultation', 'consultation', 'checkup', 'bilan', 'vaccine', 'vaccin', 'immunization', 'vaccination', 'first aid', 'premiers secours', 'emergency', 'urgence', 'ambulance', 'paramedic', 'patient', 'malade', 'care', 'soins', 'hygiene', 'hygiène', 'sanitation', 'assainissement', 'nutrition', 'nutrition', 'diet', 'régime', 'regime', 'fitness', 'forme', 'wellness', 'bien-être', 'bien etre', 'rehabilitation', 'rééducation', 'reeducation', 'physiotherapy', 'physiothérapie', 'physiotherapie', 'orthopedic', 'orthopédique', 'orthopedique', 'prosthetic', 'prothèse', 'prothese', 'wheelchair', 'fauteuil roulant', 'crutches', 'béquilles', 'bequilles', 'bandage', 'pansement', 'plaster', 'spica', 'gips', 'medical supply', 'fourniture médicale', 'fourniture medicale', 'equipment', 'équipement', 'equipement', 'instrument', 'disposable', 'jetable', 'sterile', 'stérile', 'generic', 'générique', 'generique', 'branded', 'marque'],
  
  'santé': ['medicine', 'médicament', 'medicament', 'drug', 'pill', 'pilule', 'tablet', 'comprimé', 'comprime', 'syrup', 'sirop', 'vitamin', 'vitamine', 'supplement', 'complément', 'complement', 'medical', 'médical', 'medical', 'health', 'santé', 'sante', 'clinic', 'clinique', 'pharmacy', 'pharmacie', 'hospital', 'hôpital', 'hopital', 'doctor', 'docteur', 'médecin', 'medecin', 'nurse', 'infirmier', 'infirmière', 'infirmiere', 'treatment', 'traitement', 'therapy', 'thérapie', 'therapie', 'patient', 'malade', 'care', 'soins', 'emergency', 'urgence'],

  // Construction/BTP
  'construction': ['cement', 'ciment', 'concrete', 'béton', 'beton', 'aggregate', 'granulat', 'gravel', 'gravier', 'sand', 'sable', 'stone', 'pierre', 'rock', 'roc', 'granite', 'grès', 'gres', 'marble', 'marbre', 'brick', 'brique', 'block', 'bloc', 'parpaing', 'aggregate block', 'brique', 'tile', 'carreau', 'carrelage', 'roof tile', 'tuile', 'roofing', 'toiture', 'couverture', 'slate', 'ardoise', 'metal sheet', 'tôle', 'tole', 'iron', 'fer', 'steel', 'acier', 'metal', 'métal', 'metal', 'stainless', 'inox', 'inoxydable', 'aluminum', 'aluminium', 'copper', 'cuivre', 'zinc', 'lead', 'plomb', 'wood', 'bois', 'timber', 'grume', 'lumber', 'bois ouvré', 'bois ouvre', 'plank', 'planche', 'board', 'panneau', 'panel', 'plywood', 'contreplaqué', 'mdf', 'osb', 'beam', 'poutre', 'poutrelle', 'column', 'colonne', 'pillar', 'pilier', 'truss', 'ferme', 'frame', 'charpente', 'ossature', 'nail', 'clou', 'screw', 'vis', 'bolt', 'boulon', 'nut', 'écrou', 'ecrou', 'washer', 'rondelle', 'anchor', 'ancrage', 'staple', 'agrafe', 'rivet', 'brad', 'wire', 'fil', 'cable', 'câble', 'rope', 'corde', 'chain', 'chaîne', 'chaine', 'pipe', 'tuyau', 'tube', 'tubing', 'fitting', 'raccord', 'valve', 'vanne', 'tap', 'robinet', 'elbow', 'coude', 'tee', 'manchon', 'reducer', 'réduction', 'reduction', 'flange', 'bride', 'paint', 'peinture', 'varnish', 'vernis', 'lacquer', 'laque', 'stain', 'teinture', 'solvent', 'solvant', 'thinner', 'diluant', 'primer', 'sous-couche', 'sous couche', 'sealer', 'enduit', 'plaster', 'plâtre', 'platre', 'mortar', 'mortier', 'stucco', 'crépi', 'crepi', 'render', 'enduit', 'gypsum', 'placoplâtre', 'placoplatre', 'drywall', 'gypse', 'insulation', 'isolation', 'laine de verre', 'glass wool', 'laine de roche', 'rock wool', 'polystyrene', 'polystyrène', 'polyurethane', 'polyuréthane', 'foam', 'mousse', 'sealant', 'mastic', 'silicone', 'acrylic', 'acrylique', 'waterproofing', 'étanchéité', 'etancheite', 'damp proof', 'hygro', 'membrane', 'tarpaulin', 'bâche', 'bache', 'tarp', 'construction', 'construction', 'building', 'bâtiment', 'batiment', 'worksite', 'chantier', 'material', 'matériau', 'materiau', 'supply', 'fourniture', 'hardware', 'quincaillerie', 'tool', 'outil', 'equipment', 'équipement', 'equipement', 'machine', 'machinery', 'engin', 'scaffold', 'échafaudage', 'echafaudage', 'formwork', 'coffrage', 'shoring', 'étaiement', 'etaiement', 'crane', 'grue', 'elevator', 'monte-charge', 'monte charge', 'mixer', 'bétonnière', 'betonniere', 'vibrator', 'vibreur', 'compactor', 'compacteur', 'dumpster', 'benne', 'skip', 'excavation', 'terrassement', 'earthwork', 'foundation', 'fondation', 'structure', 'structural', 'structurel', 'engineering', 'génie civil', 'genie civil', 'architecture', 'architectural', 'architecturale', 'plan', 'drawing', 'dessin', 'blueprint', 'permis', 'permit', 'license', 'licence', 'inspection', 'inspection', 'btp', 'bâtiment et travaux publics', 'batiment et travaux publics', 'public works', 'travaux publics', 'road', 'route', 'pavement', 'revêtement', 'revetement', 'asphalt', 'asphalte', 'bitumen', 'bitume', 'tarmac', 'concrete road', 'civil engineering', 'infrastructure', 'développement', 'development'],
  
  'btp': ['cement', 'ciment', 'concrete', 'béton', 'beton', 'aggregate', 'granulat', 'gravel', 'gravier', 'sand', 'sable', 'stone', 'pierre', 'brick', 'brique', 'block', 'bloc', 'parpaing', 'tile', 'carreau', 'roof', 'toiture', 'iron', 'fer', 'steel', 'acier', 'metal', 'métal', 'wood', 'bois', 'timber', 'plank', 'planche', 'nail', 'clou', 'screw', 'vis', 'bolt', 'boulon', 'wire', 'fil', 'cable', 'câble', 'pipe', 'tuyau', 'paint', 'peinture', 'plaster', 'plâtre', 'platre', 'mortar', 'mortier', 'insulation', 'isolation', 'sealant', 'mastic', 'waterproofing', 'étanchéité', 'etancheite', 'tarpaulin', 'bâche', 'bache', 'construction', 'construction', 'building', 'bâtiment', 'batiment', 'material', 'matériau', 'materiau', 'hardware', 'quincaillerie', 'tool', 'outil', 'equipment', 'équipement', 'equipement', 'scaffold', 'échafaudage', 'echafaudage', 'crane', 'grue', 'mixer', 'bétonnière', 'betonniere', 'excavation', 'terrassement', 'foundation', 'fondation', 'structure', 'engineering', 'génie civil', 'genie civil', 'architecture', 'btp', 'bâtiment et travaux publics', 'batiment et travaux publics', 'travaux publics', 'road', 'route', 'asphalt', 'asphalte', 'bitumen', 'bitume', 'infrastructure', 'développement'],

  // Automotive/Auto
  'automotive': ['car', 'voiture', 'automobile', 'auto', 'vehicle', 'véhicule', 'truck', 'camion', 'lorry', 'poids lourd', 'van', 'fourgon', 'minibus', 'bus', 'coach', 'autocar', 'suv', '4x4', '4wd', 'pickup', 'pick-up', 'sedan', 'berline', 'hatchback', 'compact', 'coupe', 'cabriolet', 'convertible', 'roadster', 'station wagon', 'break', 'estate', 'mpv', 'minivan', 'monospace', 'crossover', 'tire', 'pneu', 'pneus', 'tyre', 'tyres', 'wheel', 'roue', 'roues', 'rim', 'jante', 'jantes', 'alloy wheel', 'alloy', 'hubcap', 'enjoliveur', 'battery', 'batterie', 'batteries', 'car battery', 'accumulator', 'accumulateur', 'oil', 'huile', 'lubricant', 'lubrifiant', 'engine oil', 'huile moteur', 'gear oil', 'huile de boîte', 'huile de boite', 'brake fluid', 'liquide de frein', 'coolant', 'liquide de refroidissement', 'antifreeze', 'antigel', 'grease', 'graisse', 'part', 'pièce', 'piece', 'spare part', 'pièce de rechange', 'piece de rechange', 'spare', 'rechange', 'accessory', 'accessoire', 'accessoires', 'engine', 'moteur', 'motor', 'engine part', 'piston', 'cylinder', 'cylindre', 'valve', 'soupape', 'gasket', 'joint', 'joint torique', 'oring', 'seal', 'bague', 'bearing', 'roulement', 'belt', 'courroie', 'chain', 'chaîne', 'chaine', 'transmission', 'boîte', 'boite', 'gearbox', 'boîte de vitesses', 'boite de vitesses', 'transmission', 'differential', 'différentiel', 'differentiel', 'clutch', 'embrayage', 'brake', 'frein', 'freins', 'brake pad', 'plaquette', 'brake disc', 'disque', 'brake drum', 'tambour', 'suspension', 'suspension', 'shock absorber', 'amortisseur', 'damper', 'spring', 'ressort', 'strut', 'pneumatique', 'hydraulic', 'steering', 'direction', 'power steering', 'direction assistée', 'direction assistee', 'rack', 'crémaillère', 'cremailiere', 'axle', 'essieu', 'driveshaft', 'arbre de transmission', 'cardan', 'universal joint', 'joint de cardan', 'propeller shaft', 'exhaust', 'échappement', 'echappement', 'muffler', 'silencieux', 'catalytic converter', 'catalyseur', 'catalyst', 'pot catalytique', 'manifold', 'collecteur', 'injection', 'injecteur', 'injection pump', 'pompe injection', 'carburetor', 'carburateur', 'filter', 'filtre', 'air filter', 'filtre à air', 'oil filter', 'filtre à huile', 'fuel filter', 'filtre à carburant', 'cabin filter', 'filtre d habitacle', 'filtre pollen', 'car body', 'carrosserie', 'body', 'bodywork', 'body part', 'panel', 'panneau', 'door', 'porte', 'hood', 'capot', 'trunk', 'coffre', 'bumper', 'pare-chocs', 'pare chocs', 'fender', 'aile', 'wing', 'quarter panel', 'montant', 'pillar', 'windshield', 'pare-brise', 'pare brise', 'window', 'vitre', 'lunette', 'rear window', 'lunette arrière', 'lunette arriere', 'side mirror', 'rétroviseur', 'retroviseur', 'wing mirror', 'headlight', 'phare', 'phares', 'taillight', 'feu arrière', 'feu arriere', 'feux arrière', 'turn signal', 'clignotant', 'indicator', 'fog light', 'antibrouillard', 'license plate', 'plaque dimmatriculation', 'immatriculation', 'number plate', 'grille', 'calandre', 'emblem', 'logo', 'insignia', 'monogramme', 'strip', 'liseré', 'interior', 'intérieur', 'interieur', 'upholstery', 'sellerie', 'seat', 'siège', 'siege', 'dashboard', 'tableau de bord', 'console', 'steering wheel', 'volant', 'gear lever', 'levier de vitesse', 'pommeau', 'handbrake', 'frein à main', 'pedal', 'pédale', 'pedale', 'accelerator', 'accélérateur', 'accelerateur', 'clutch pedal', 'pédale dembrayage', 'brake pedal', 'pédale de frein', 'carpet', 'moquette', 'floor mat', 'tapis de sol', 'seat cover', 'housse de siège', 'sun visor', 'pare-soleil', 'glove box', 'boîte à gants', 'boite a gants', 'airbag', 'air bag', 'entertainment', 'autoradio', 'car radio', 'radio', 'stereo', 'hi-fi', 'gps', 'navigation', 'navigator', 'alarm', 'alarme', 'immobilizer', 'antidémarrage', 'antidemarrage', 'central locking', 'fermeture centralisée', 'key', 'clé', 'cle', 'keyless', 'sans clé', 'sans cle', 'remote key', 'télécommande', 'transponder', 'chip key', 'diagnostic', 'diagnostic', 'obd', 'scanner', 'garage', 'atelier', 'mechanic', 'mécanicien', 'mecanicien', 'technician', 'technicien', 'repair', 'réparation', 'reparation', 'maintenance', 'entretien', 'service', 'revision', 'révision', 'revision', 'tune-up', 'reglage', 'réglage', 'reglage', 'wheel alignment', 'parallélisme', 'parallelisme', 'balancing', 'équilibrage', 'equilibrage', 'tire pressure', 'pression', 'pneus', 'fitting', 'montage', 'puncture', 'crevaison', 'tire repair', 'réparation pneu', 'car wash', 'lavage', 'auto wash', 'cleaning', 'nettoyage', 'polish', 'polissage', 'wax', 'cirage', 'interior cleaning', 'lavage intérieur', 'detailing', 'detailing', 'rental', 'location', 'lease', 'leasing', 'rent', 'louer', 'occasion', 'used car', 'voiture doccasion', 'voiture d occasion', 'second hand', 'dealer', 'concessionnaire', 'dealership', 'showroom', 'agent', 'agence', 'importer', 'importateur', 'parts dealer', 'pièces auto', 'pieces auto', 'recycler', 'recycleur', 'casse', 'scrap yard', 'dismantler', 'démolisseur', 'demolisseur', 'breaker', 'breaker yard'],
  
  'auto': ['car', 'voiture', 'automobile', 'vehicle', 'véhicule', 'truck', 'camion', 'van', 'fourgon', 'bus', 'tire', 'pneu', 'pneus', 'tyre', 'wheel', 'roue', 'rim', 'jante', 'battery', 'batterie', 'oil', 'huile', 'lubricant', 'lubrifiant', 'part', 'pièce', 'piece', 'spare', 'rechange', 'accessory', 'accessoire', 'engine', 'moteur', 'motor', 'brake', 'frein', 'suspension', 'steering', 'direction', 'exhaust', 'échappement', 'echappement', 'filter', 'filtre', 'body', 'carrosserie', 'interior', 'intérieur', 'interieur', 'seat', 'siège', 'siege', 'dashboard', 'tableau de bord', 'garage', 'atelier', 'mechanic', 'mécanicien', 'mecanicien', 'repair', 'réparation', 'reparation', 'maintenance', 'entretien', 'service', 'car wash', 'lavage', 'rental', 'location', 'used car', 'voiture doccasion', 'dealer', 'concessionnaire', 'parts dealer', 'pièces auto', 'pieces auto'],

  // Sports
  'sports': ['ball', 'balle', 'balls', 'football', 'soccer', 'basketball', 'volleyball', 'handball', 'rugby', 'tennis ball', 'balle de tennis', 'golf ball', 'balle de golf', 'cricket ball', 'baseball', 'softball', 'bat', 'batte', 'racket', 'raquette', 'net', 'filet', 'goal', 'but', 'cage', 'post', 'poteau', 'jersey', 'maillot', 'shorts', 'short', 'socks', 'chaussettes', 'chaussures', 'shoes', 'boots', 'bottes', 'cleats', 'crampons', 'shin guard', 'protège-tibia', 'protecteur', 'equipment', 'équipement', 'equipement', 'gear', 'accessoire de sport', 'accessoires sport', 'sport', 'sport', 'sports', 'loisir', 'loisirs', 'leisure', 'activity', 'activité', 'activite', 'exercise', 'exercice', 'fitness', 'forme', 'musculation', 'bodybuilding', 'gym', 'gymnase', 'salle de sport', 'fitness center', 'health club', 'club de sport', 'sports club', 'training', 'entraînement', 'entrainement', 'coaching', 'coach', 'personal trainer', 'entraîneur', 'entraineur', 'instructor', 'moniteur', 'teacher', 'professeur', 'match', 'match', 'game', 'jeu', 'competition', 'compétition', 'competition', 'tournament', 'tournoi', 'championship', 'championnat', 'league', 'ligue', 'team', 'équipe', 'equipe', 'club', 'player', 'joueur', 'athlete', 'athlète', 'athlete', 'champion', 'winner', 'vainqueur', 'referee', 'arbitre', 'field', 'terrain', 'court', 'piste', 'track', 'stadium', 'stade', 'arena', 'gymnasium', 'gymnase', 'pool', 'piscine', 'swimming', 'natation', 'track and field', 'athlétisme', 'athletisme', 'running', 'course', 'courir', 'jogging', 'marathon', 'race', 'compétition', 'cycling', 'cyclisme', 'vélo', 'velo', 'bicycle', 'bike', 'mountain bike', 'vtt', 'bmx', 'road bike', 'fitness bike', 'gym equipment', 'appareil de fitness', 'treadmill', 'tapis de course', 'elliptical', 'vélo elliptique', 'velo elliptique', 'rowing machine', 'rameur', 'stationary bike', 'vélo dappartement', 'velo dappartement', 'weight', 'poids', 'dumbbell', 'haltère', 'haltere', 'barbell', 'barre', 'kettlebell', 'machine', 'appareil', 'bench', 'banc', 'rack', 'support', 'mat', 'tapis', 'yoga', 'pilates', 'aerobics', 'aérobic', 'aerobic', 'zumba', 'dance', 'danse', 'martial art', 'art martial', 'karate', 'judo', 'taekwondo', 'boxing', 'boxe', 'wrestling', 'lutte', 'fitness', 'crossfit', 'hiit', 'bodybuilding', 'musculation', 'calisthenics', 'street workout', 'outdoor', 'outdoor', 'adventure', 'aventure', 'hiking', 'randonnée', 'randonnee', 'trekking', 'camping', 'outdoor equipment', 'matériel outdoor', 'materiel outdoor', 'tent', 'tente', 'sleeping bag', 'sac de couchage', 'backpack', 'sac à dos', 'compass', 'boussole', 'binoculars', 'jumelles', 'fishing', 'pêche', 'peche', 'hunting', 'chasse', 'shooting', 'tir', 'archery', 'tir à larc', 'golf', 'hockey', 'ice hockey', 'hockey sur glace', 'inline hockey', 'hockey sur roulettes', 'skating', 'patinage', 'roller', 'rollerblade', 'rollers', 'skateboard', 'surf', 'surfing', 'planche', 'planche à voile', 'windsurf', 'kitesurf', 'paddle', 'stand up paddle', 'rowing', 'aviron', 'canoe', 'canoë', 'canoe', 'kayak', 'rafting', 'sailing', 'voile', 'navigation', 'diving', 'plongée', 'plongee', 'scuba', 'snorkeling', 'palmes', 'masque', 'tuba', 'ski', 'skiing', 'snowboard', 'snowboarding', 'winter sport', 'sport dhiver', 'alpinisme', 'mountaineering', 'escalade', 'climbing', 'bouldering', 'block', 'gymnastic', 'gymnastique', 'rhythmic', 'rhythmique', 'trampoline', 'cheerleading', 'équitation', 'equitation', 'horse riding', 'poney', 'polo', 'equestrian', 'équestre', 'fencing', 'escrime', 'badminton', 'table tennis', 'tennis de table', 'ping-pong', 'squash', 'padel', 'fronton', 'pelote', 'basque', 'billiard', 'billard', 'pool', 'snooker', 'bowling', 'pétanque', 'petanque', 'boules', 'lawn bowls', 'croquet', 'horseshoe', 'frisbee', 'ultimate', 'disc golf', 'darts', 'fléchettes', 'flechette', 'electronic sport', 'esport', 'e-sport', 'gaming', 'jeu vidéo', 'sport électronique'],

  // Packaging/Emballage
  'packaging': ['box', 'boîte', 'boite', 'boxes', 'boîtes', 'boites', 'carton', 'cardboard', 'carton box', 'boîte en carton', 'boite en carton', 'corrugated', 'carton ondulé', 'carton ondule', 'kraft', 'kraft paper', 'papier kraft', 'wrapper', 'emballage', 'wrapping', 'enveloppe', 'envelope', 'sleeve', 'manchette', 'pochette', 'pouch', 'sachet', 'bag', 'sac', 'sachet', 'sacs', 'plastic bag', 'sac plastique', 'paper bag', 'sac papier', 'canvas bag', 'sac en toile', 'jute bag', 'sac en jute', 'biodegradable bag', 'sac biodégradable', 'compostable', 'compostable', 'tote bag', 'sac cabas', 'container', 'conteneur', 'contenant', 'recipient', 'réipient', 'reipient', 'pot', 'jar', 'bocal', 'can', 'canette', 'bottle', 'bouteille', 'flask', 'flacon', 'vial', 'fiole', 'ampoule', 'ampoule', 'drum', 'fût', 'fut', 'barrel', 'baril', 'tank', 'citerne', 'reservoir', 'réservoir', 'ibc', 'intermediate bulk container', 'pallet', 'palette', 'pallet box', 'caisse palette', 'crate', 'cagette', 'casier', 'basket', 'panier', 'tray', 'plateau', 'tub', 'seau', 'bucket', 'pail', 'pot', 'jar', 'label', 'étiquette', 'etiquette', 'tag', 'étiquette prix', 'sticker', 'autocollant', 'decal', 'décalque', 'decalque', 'tape', 'ruban', 'adhesive', 'adhésif', 'adhesif', 'scotch', 'masking tape', 'ruban de masquage', 'duct tape', 'ruban adhésif', 'ruban adhesif', 'film', 'film', 'shrink wrap', 'film rétractable', 'film retractable', 'stretch film', 'film étirable', 'film etirable', 'cling film', 'film alimentaire', 'bubble wrap', 'film à bulles', 'bulle', 'foam', 'mousse', 'protective', 'protection', 'cushioning', 'amortissement', 'padding', 'rembourrage', 'filler', 'remplissage', 'packing peanut', 'chip', 'copeau', 'corrugated insert', 'calage carton', 'divider', 'séparateur', 'separateur', 'separator', 'insert', 'insert', 'blister', 'blister pack', 'clamshell', 'coque', 'thermoformed', 'thermoformé', 'thermoforme', 'vacuum formed', 'skin pack', 'skin packaging', 'flow pack', 'sachet flow', 'sachet stick', 'stick pack', 'doypack', 'doy pack', 'stand-up pouch', 'pochette debout', 'flexible', 'souple', 'rigid', 'rigide', 'folding', 'pliant', 'collapsible', 'repliable', 'reusable', 'réutilisable', 'reutilisable', 'returnable', 'consigné', 'consigne', 'single-use', 'usage unique', 'jetable', 'disposable', 'recyclable', 'recyclable', 'recycled', 'recyclé', 'recycle', 'recyclage', 'recycling', 'waste', 'déchet', 'dechet', 'green', 'vert', 'eco', 'éco', 'eco-friendly', 'écologique', 'ecologique', 'environmental', 'environnemental', 'sustainable', 'durable', 'biodegradable', 'biodégradable', 'biodégradable', 'compostable', 'organic', 'bio', 'food grade', 'contact alimentaire', 'food safe', 'alimentaire', 'pharma', 'pharmaceutique', 'medical grade', 'medical', 'cosmetic', 'cosmétique', 'cosmetique', 'dangerous goods', 'matières dangereuses', 'hazmat', 'adr', 'imdg', 'iata', 'un', 'ce', 'iso', 'haccp', 'brc', 'ifs', 'fsc', 'pefc', 'design', 'conception', 'prototyping', 'prototypage', 'printing', 'impression', 'print', 'imprimerie', 'litho', 'offset', 'flexo', 'gravure', 'screen printing', 'sérigraphie', 'serigraphie', 'digital print', 'impression numérique', '3d print', 'impression 3d', 'personalization', 'personnalisation', 'custom', 'sur mesure', 'standard', 'norme', 'stock', 'stock', 'inventory', 'inventaire', 'just-in-time', 'flux tendu', 'kanban', 'supply chain', 'chaîne logistique', 'chaine logistique', 'logistics', 'logistique', 'warehousing', 'entreposage', 'storage', 'stockage', 'handling', 'manutention', 'transport', 'shipping', 'expédition', 'expedition', 'export', 'exportation', 'import', 'importation', 'customs', 'douane', 'packaging supplier', 'fournisseur demballage', 'packaging manufacturer', 'fabricant demballage', 'converter', 'transformateur', 'printer', 'imprimeur', 'packaging company', 'société demballage', 'emballage industriel', 'industrial packaging', 'primary', 'primaire', 'secondary', 'secondaire', 'tertiary', 'tertiaire', 'retail', 'grande distribution', 'gms', 'gss', 'ecommerce', 'e-commerce', 'commerce en ligne', 'fulfillment', 'préparation', 'preparation', 'commande', 'picking', 'pick', 'pack', 'kitting', 'assembly', 'assemblage', 'co-packing', 'conditionnement', 'packaging service', 'service demballage'],
  
  'emballage': ['box', 'boîte', 'boite', 'carton', 'cardboard', 'wrapper', 'emballage', 'enveloppe', 'envelope', 'pouch', 'sachet', 'bag', 'sac', 'plastic bag', 'sac plastique', 'paper bag', 'sac papier', 'container', 'conteneur', 'contenant', 'pot', 'jar', 'bocal', 'can', 'canette', 'bottle', 'bouteille', 'flask', 'flacon', 'drum', 'fût', 'fut', 'barrel', 'baril', 'pallet', 'palette', 'crate', 'cagette', 'casier', 'basket', 'panier', 'tray', 'plateau', 'tub', 'seau', 'bucket', 'label', 'étiquette', 'etiquette', 'tag', 'sticker', 'autocollant', 'tape', 'ruban', 'adhesive', 'adhésif', 'adhesif', 'film', 'shrink wrap', 'film rétractable', 'film retractable', 'stretch film', 'film étirable', 'film etirable', 'bubble wrap', 'film à bulles', 'foam', 'mousse', 'protection', 'cushioning', 'padding', 'rembourrage', 'filler', 'remplissage', 'blister', 'blister pack', 'doypack', 'pochette', 'flexible', 'souple', 'rigid', 'rigide', 'recyclable', 'recyclable', 'recycled', 'recyclé', 'recycle', 'recyclage', 'recycling', 'green', 'vert', 'eco', 'éco', 'eco-friendly', 'écologique', 'ecologique', 'sustainable', 'durable', 'biodegradable', 'biodégradable', 'biodégradable', 'compostable', 'food grade', 'contact alimentaire', 'food safe', 'alimentaire', 'printing', 'impression', 'print', 'imprimerie', 'digital print', 'impression numérique', 'custom', 'sur mesure', 'stock', 'stock', 'inventory', 'inventaire', 'logistics', 'logistique', 'warehousing', 'entreposage', 'stockage', 'handling', 'manutention', 'transport', 'shipping', 'expédition', 'expedition', 'export', 'exportation', 'import', 'importation', 'packaging supplier', 'fournisseur demballage', 'packaging manufacturer', 'fabricant demballage', 'printer', 'imprimeur', 'emballage industriel', 'industrial packaging', 'retail', 'grande distribution', 'ecommerce', 'e-commerce', 'commerce en ligne', 'fulfillment', 'préparation', 'preparation', 'commande', 'conditionnement', 'packaging service', 'service demballage'],

  // Agriculture/Agriculture
  'agriculture': ['seed', 'semence', 'graine', 'seeds', 'semences', 'graines', 'certified seed', 'semence certifiée', 'hybrid', 'hybride', 'gm', 'ogm', 'gmo', 'transgenic', 'transgénique', 'transgenique', 'heirloom', 'traditionnelle', 'open pollinated', 'variété', 'variety', 'cultivar', 'species', 'espèce', 'espece', 'fertilizer', 'engrais', 'fertilizers', 'engrais', 'organic fertilizer', 'engrais organique', 'chemical fertilizer', 'engrais chimique', 'npk', 'nitrogen', 'azote', 'phosphorus', 'phosphore', 'potassium', 'potassium', 'urea', 'urée', 'uree', 'ammonium', 'sulfate', 'sulfate', 'nitrate', 'nitrate', 'phosphate', 'phosphate', 'compost', 'compost', 'manure', 'fumier', 'guano', 'bokashi', 'vermicompost', 'lombricompost', 'biochar', 'biocarbon', 'micronutrient', 'oligo-élément', 'oligo element', 'trace element', 'fertigation', 'fertigation', 'foliar', 'foliaire', 'pesticide', 'pesticide', 'insecticide', 'insecticide', 'fungicide', 'fongicide', 'herbicide', 'herbicide', 'weedkiller', 'désherbant', 'desherbant', 'nematicide', 'molluscicide', 'rodenticide', 'raticide', 'acaricide', 'avicide', 'bactericide', 'bactéricide', 'bactericide', 'virucide', 'algicide', 'repellent', 'répulsif', 'repulsif', 'attractant', 'attractif', 'pheromone', 'phéromone', 'pheromone', 'trap', 'piège', 'piege', 'biological control', 'lutte biologique', 'biocontrol', 'biopesticide', 'organic farming', 'agriculture biologique', 'conventional', 'agriculture conventionnelle', 'integrated', 'lutte intégrée', 'tool', 'outil', 'equipment', 'équipement', 'equipement', 'machinery', 'machine', 'engin', 'tractor', 'tracteur', 'harvester', 'moissonneuse', 'combine', 'combine harvester', 'moissonneuse-batteuse', 'moissonneuse batteuse', 'thresher', 'batteuse', 'planter', 'semoir', 'sowing', 'seeding', 'transplanter', 'repiqueuse', 'repique', 'transplanting', 'sprayer', 'pulvérisateur', 'pulverisateur', 'atomizer', 'atomiseur', 'fogger', 'boom', 'lance', 'nozzle', 'buse', 'plow', 'charrue', 'plough', 'plow', 'disc harrow', 'déchaumeur', 'dechaumeur', 'cultivator', 'cultivateur', 'rotary tiller', 'fraise', 'rotavator', 'hoe', 'houe', 'mattock', 'binette', 'shovel', 'pelle', 'spade', 'bêche', 'beche', 'fork', 'fourche', 'pitchfork', 'fourche à foin', 'rake', 'râteau', 'rateau', 'machete', 'machette', 'cutlass', 'couteau de coupe', 'pruner', 'sécateur', 'secateur', 'shear', 'cisaille', 'hedge trimmer', 'taille-haie', 'taille haie', 'chainsaw', 'tronçonneuse', 'tronconneuse', 'brush cutter', 'débroussailleuse', 'debroussailleuse', 'strimmer', 'lawn mower', 'tondeuse', 'irrigation', 'irrigation', 'watering', 'arrosage', 'sprinkler', 'arroseur', 'pivot', 'center pivot', 'pivot central', 'drip', 'goutte à goutte', 'goutte a goutte', 'micro-sprinkler', 'microjet', 'hydroponic', 'hydroponie', 'aquaponic', 'aquaponie', 'aeroponic', 'aéroponie', 'aeroponie', 'pump', 'pompe', 'water pump', 'pompe à eau', 'solar pump', 'pompe solaire', 'well', 'puits', 'borehole', 'forage', 'dam', 'barrage', 'reservoir', 'réservoir', 'tank', 'citerne', 'canal', 'channel', 'ditch', 'fossé', 'fosse', 'pipe', 'tuyau', 'tubing', 'tape', 'manguera', 'valve', 'vanne', 'fitting', 'raccord', 'filter', 'filtre', 'screen', 'tamis', 'mesh', 'maille', 'greenhouse', 'serre', 'tunnel', 'high tunnel', 'low tunnel', 'plasticulture', 'mulch', 'paillage', 'film', 'net', 'filet', 'shade net', 'filet dombrage', 'insect net', 'filet anti-insectes', 'anti insecte', 'anti-afide', 'climate control', 'climatisation', 'heating', 'chauffage', 'ventilation', 'fertilization', 'fertigation', 'automation', 'automatisation', 'sensor', 'capteur', 'weather station', 'station météo', 'station meteo', 'farm management', 'gestion dexploitation', 'farm', 'ferme', 'exploitation', 'agriculture', 'agriculture', 'agricultural', 'agricole', 'crop', 'culture', 'cultivated', 'cultivé', 'cultive', 'planting', 'plantation', 'semis', 'sowing', 'harvest', 'récolte', 'recolte', 'harvesting', 'moisson', 'production', 'rendement', 'yield', 'productivity', 'productivité', 'input', 'intrant', 'output', 'extrant', 'livestock', 'bétail', 'betail', 'animal', 'élevage', 'elevage', 'breeding', 'reproduction', 'veterinary', 'vétérinaire', 'veterinaire', 'feed', 'aliment', 'feeding', 'alimentation', 'fodder', 'fourrage', 'pasture', 'pâturage', 'patu rage', 'grazing', 'herbage', 'herbe', 'hay', 'foin', 'silage', 'ensilage', 'concentrate', 'aliment concentré', 'supplement', 'complément', 'complement', 'nutrition', 'nutrition', 'mineral', 'minéral', 'mineral', 'block', 'bloc', 'salt', 'sel', 'housing', 'logement', 'barn', 'grange', 'stable', 'étable', 'etable', 'shed', 'hangar', 'coop', 'poulailler', 'sty', 'porcherie', 'kennel', 'chenil', 'fence', 'clôture', 'cloture', 'grillage', 'barbed wire', 'fil barbelé', 'electric fence', 'clôture électrique', 'cloture electrique', 'gate', 'portail', 'gate', 'trough', 'auge', 'drinker', 'abreuvoir', 'feeder', 'mangeoire', 'milking', 'traite', 'machine milking', 'machine à traire', 'cooling', 'refroidissement', 'storage', 'stockage', 'preservation', 'conservation', 'refrigeration', 'réfrigération', 'drying', 'séchage', 'sechage', 'processing', 'transformation', 'milling', 'mouture', 'grinding', 'broyage', 'pressing', 'pressage', 'extraction', 'extracteur', 'juicing', 'market', 'marché', 'marche', 'sale', 'vente', 'commercialisation', 'marketing', 'cooperative', 'coopérative', 'cooperative', 'association', 'union', 'syndicat', 'export', 'exportation', 'import', 'importation', 'subsidy', 'subvention', 'credit', 'crédit', 'credit', 'loan', 'prêt', 'pret', 'insurance', 'assurance', 'risk', 'risque', 'climate', 'climat', 'weather', 'météo', 'meteo', 'rain', 'pluie', 'drought', 'sécheresse', 'secheresse', 'flood', 'inondation', 'erosion', 'érosion', 'erosion', 'fertility', 'fertilité', 'soil', 'sol', 'terre', 'earth', 'composting', 'compostage', 'manure management', 'échelle', 'scale', 'weighing', 'pesage', 'control', 'contrôle', 'controle', 'sanitary', 'sanitaire', 'phytosanitary', 'phytosanitaire', 'certification', 'certification', 'label', 'label', 'organic label', 'label bio', 'fairtrade', 'commerce équitable', 'commerce equitable', 'sustainable', 'durable', 'agroecology', 'agroécologie', 'agroecologie', 'permaculture', 'agroforestry', 'agroforesterie', 'conservation agriculture', 'agriculture de conservation'],

  // Hôtellerie
  'hotellerie': ['hotel', 'hôtel', 'hopital', 'hotel', 'motel', 'auberge', 'hostel', 'resort', 'complexe', 'lodge', 'guesthouse', 'maison dhôtes', 'maison dhotes', 'pension', 'bed and breakfast', 'chambre d hôte', 'chambre dhote', 'bb', 'bnb', 'inn', 'relais', 'tavern', 'taverne', 'room', 'chambre', 'chambres', 'suite', 'junior suite', 'executive suite', 'presidential suite', 'penthouse', 'standard room', 'deluxe room', 'superior room', 'single room', 'chambre simple', 'double room', 'chambre double', 'twin room', 'chambre twin', 'triple room', 'chambre triple', 'family room', 'chambre familiale', 'connecting room', 'chambres communicantes', 'accessible room', 'chambre accessible', 'pmr', 'handicap', 'smoking room', 'chambre fumeur', 'non-smoking', 'non fumeur', 'room with view', 'chambre avec vue', 'seaview', 'vue mer', 'mountain view', 'vue montagne', 'garden view', 'vue jardin', 'pool view', 'vue piscine', 'bed', 'lit', 'beds', 'lits', 'single bed', 'lit simple', 'double bed', 'lit double', 'queen bed', 'lit queen', 'king bed', 'lit king', 'twin beds', 'lits jumeaux', 'bunk bed', 'lit superposé', 'sofa bed', 'canapé-lit', 'canape-lit', 'canape lit', 'folding bed', 'lit pliant', 'rollaway bed', 'lit dappoint', 'baby bed', 'lit bébé', 'lit bebe', 'crib', 'berceau', 'bathroom', 'salle de bain', 'salle deau', 'shower', 'douche', 'bathtub', 'baignoire', 'jacuzzi', 'jacuzzi', 'whirlpool', 'balnéo', 'balneo', 'hammam', 'hammam', 'sauna', 'sauna', 'spa', 'spa', 'toilet', 'toilettes', 'wc', 'bidet', 'sink', 'lavabo', 'towel', 'serviette', 'bath towel', 'serviette de bain', 'hand towel', 'serviette de toilette', 'face towel', 'drap de bain', 'robe', 'peignoir', 'bathrobe', 'slippers', 'chaussons', 'toiletries', 'articles de toilette', 'amenities', 'agréments', 'agrements', 'shampoo', 'shampooing', 'soap', 'savon', 'shower gel', 'gel douche', 'body lotion', 'lait corporel', 'conditioner', 'après-shampooing', 'après shampooing', 'dental kit', 'kit dentaire', 'shaving kit', 'kit de rasage', 'sewing kit', 'kit de couture', 'vanity', 'nécessaire', 'necessaire', 'tissue', 'mouchoir', 'paper tissue', 'kleenex', 'toilet paper', 'papier toilette', 'breakfast', 'petit-déjeuner', 'petit dejeuner', 'petit déjeuner', 'continental breakfast', 'breakfast buffet', 'continental', 'english breakfast', 'american breakfast', 'brunch', 'half board', 'demi-pension', 'demi pension', 'full board', 'pension complète', 'pension complete', 'all inclusive', 'tout inclus', 'restaurant', 'restaurant', 'dining', 'restauration', 'room service', 'service en chambre', 'bar', 'bar', 'lounge', 'salon', 'minibar', 'mini-bar', 'minibar', 'refrigerator', 'réfrigérateur', 'fridge', 'safe', 'coffre-fort', 'coffre fort', 'security box', 'tv', 'télévision', 'television', 'télé', 'tele', 'flat screen', 'écran plat', 'ecran plat', 'cable tv', 'satellite', 'wifi', 'wi-fi', 'internet', 'air conditioning', 'climatisation', 'air conditionné', 'conditionne', 'heating', 'chauffage', 'fan', 'ventilateur', 'balcony', 'balcon', 'terrace', 'terrasse', 'patio', 'veranda', 'véranda', 'veranda', 'garden', 'jardin', 'pool', 'piscine', 'swimming pool', 'indoor pool', 'piscine intérieure', 'piscine interieure', 'outdoor pool', 'piscine extérieure', 'piscine exterieure', 'heated pool', 'piscine chauffée', 'piscine chauffee', 'infinity pool', 'à débordement', 'a debordement', 'pool bar', 'bar de piscine', 'beach', 'plage', 'sunbed', 'transat', 'chaise longue', 'chaise lounge', 'umbrella', 'parasol', 'fitness center', 'salle de fitness', 'gym', 'salle de sport', 'business center', 'centre daffaires', 'conference room', 'salle de réunion', 'salle de reunion', 'meeting room', 'banquet', 'réception', 'reception', 'event', 'événement', 'evenement', 'wedding', 'mariage', 'party', 'fête', 'fete', 'seminar', 'séminaire', 'seminaire', 'congress', 'congrès', 'congres', 'exhibition', 'exposition', 'lobby', 'hall', 'reception desk', 'réception', 'concierge', 'conciergerie', 'concierge', 'bellboy', 'voiturier', 'valet', 'porter', 'portier', 'doorman', 'gardien', 'night watch', 'veilleur de nuit', 'housekeeping', 'ménage', 'menage', 'room maid', 'femme de chambre', 'room attendant', 'maintenance', 'entretien', 'laundry', 'blanchisserie', 'pressing', 'dry cleaning', 'pressing', 'nettoyage à sec', 'nettoyage a sec', 'ironing', 'repassage', 'shoe shine', 'cirage', 'luggage', 'bagage', 'baggage', 'porter', 'voiturier', 'valet parking', 'parking', 'garage', 'car park', 'place de parking', 'elevator', 'ascenseur', 'lift', 'stairs', 'escalier', 'wheelchair access', 'accès handicapé', 'acces handicape', 'accessible', 'accessibilité', 'fire exit', 'issue de secours', 'emergency exit', 'evacuation', 'security', 'sécurité', 'securite', 'surveillance', 'camera', 'badge', 'key card', 'carte magnétique', 'key', 'clé', 'cle', 'lock', 'serrure', 'check-in', 'arrivée', 'arrivee', 'enregistrement', 'check-out', 'départ', 'depart', 'départ', 'depart', 'reservation', 'réservation', 'reservation', 'booking', 'réservation', 'cancel', 'annulation', 'no show', 'policy', 'politique', 'rate', 'tarif', 'price', 'prix', 'tariff', 'rate', 'rack rate', 'tarif public', 'corporate rate', 'tarif négocié', 'group rate', 'tarif groupe', 'seasonal rate', 'tarif saisonnier', 'early bird', 'early booking', 'last minute', 'promotion', 'promo', 'package', 'forfait', 'special offer', 'offre spéciale', 'offre speciale', 'discount', 'remise', 'upgrade', 'surclassement', 'upgrade', 'gift certificate', 'chèque cadeau', 'cheque cadeau', 'voucher', 'bon', 'coupon', 'loyalty', 'fidélité', 'fidelite', 'membership', 'adhésion', 'adhesion', 'points', 'reward', 'récompense', 'recompense', 'frequent guest', 'guest', 'client', 'visitor', 'tourist', 'touriste', 'business traveler', 'voyageur daffaires', 'vacation', 'vacances', 'holiday', 'séjour', 'sejour', 'trip', 'voyage', 'tourism', 'tourisme', 'hospitality', 'hôtellerie', 'hotellerie', 'hébergement', 'hebergement', 'accommodation', 'lodging', 'logement', 'service', 'service', 'quality', 'qualité', 'qualite', 'comfort', 'confort', 'cleanliness', 'propreté', 'proprete', 'satisfaction', 'review', 'avis', 'rating', 'note', 'star', 'étoile', 'etoile', 'five star', '5 étoiles', '4 star', 'luxury', 'luxe', 'deluxe', 'superior', 'standard', 'economy', 'budget', 'cheap', 'pas cher', 'affordable', 'abordable', 'boutique hotel', 'design hotel', 'business hotel', 'airport hotel', 'resort hotel', 'spa hotel', 'casino hotel', 'eco hotel', 'eco-lodge', 'heritage hotel', 'historic', 'historique', 'palace', 'palace', 'grand hotel', 'boutique', 'charm', 'charme', 'intimacy', 'intimité', 'intimite', 'personalized', 'personnalisé', 'personnalise', 'bespoke', 'sur mesure'],
  
  'hôtellerie': ['hotel', 'hôtel', 'hopital', 'auberge', 'hostel', 'resort', 'lodge', 'guesthouse', 'pension', 'bed and breakfast', 'chambre d hôte', 'bb', 'inn', 'room', 'chambre', 'suite', 'bed', 'lit', 'breakfast', 'petit-déjeuner', 'petit dejeuner', 'restaurant', 'dining', 'bar', 'lounge', 'spa', 'pool', 'piscine', 'fitness', 'gym', 'business center', 'conference', 'réunion', 'reunion', 'event', 'événement', 'evenement', 'wedding', 'mariage', 'reception', 'réception', 'concierge', 'housekeeping', 'ménage', 'menage', 'laundry', 'blanchisserie', 'parking', 'wifi', 'internet', 'air conditioning', 'climatisation', 'tourism', 'tourisme', 'hospitality', 'hôtellerie', 'hotellerie', 'hébergement', 'hebergement', 'accommodation', 'service', 'qualité', 'qualite', 'luxe', 'luxury', 'comfort', 'confort'],
};

// Mapping from inferred category keys to actual database category names
// This ensures "fan" → "electronics" pattern maps to "Électronique" in DB
const CATEGORY_NAME_MAPPING: Record<string, string[]> = {
  // IT category mapping - points to IT (informatique) category
  'it': ['IT', 'informatique', 'Informatique', 'INFO', 'info'],
  
  // Electronics category mapping
  'electronics': ['Électronique', 'Electronique', 'electronique', 'électronique', 'electronics', 'ELECTRO', 'electro', 'Electroménager', 'électroménager', 'electromenager'],
  'electronique': ['Électronique', 'Electronique', 'electronique', 'électronique', 'electronics', 'ELECTRO', 'electro', 'Electroménager', 'électroménager', 'electromenager'],
  'acier': ['Acier & Métal', 'Acier & Metal', 'acier & métal', 'acier & metal'],
  'métal': ['Acier & Métal', 'Acier & Metal', 'acier & métal', 'acier & metal'],
  'btp': ['BTP', 'btp'],
  'construction': ['BTP', 'btp', 'Construction', 'construction'],
  'auto': ['Auto', 'auto', 'Automotive', 'automotive'],
  'automotive': ['Auto', 'auto', 'Automotive', 'automotive'],
  'packaging': ['Packaging', 'packaging', 'Emballage', 'emballage'],
  'emballage': ['Packaging', 'packaging', 'Emballage', 'emballage'],
  'agroalimentaire': ['Agroalimentaire', 'agroalimentaire', 'Food', 'food'],
  'food': ['Agroalimentaire', 'agroalimentaire', 'Food', 'food'],
  'beauté': ['Beauté & Cosmétique', 'Beaute & Cosmetique', 'beauté & cosmétique', 'beauty'],
  'beauty': ['Beauté & Cosmétique', 'Beaute & Cosmetique', 'beauté & cosmétique', 'beauty'],
  'santé': ['Santé', 'Sante', 'santé', 'sante', 'Health', 'health'],
  'health': ['Santé', 'Sante', 'santé', 'sante', 'Health', 'health'],
  'hotellerie': ['Hôtellerie', 'Hotellerie', 'hôtellerie', 'hotellerie', 'Hotel', 'hotel'],
  'hôtellerie': ['Hôtellerie', 'Hotellerie', 'hôtellerie', 'hotellerie', 'Hotel', 'hotel'],
  'mode': ['Mode', 'mode', 'Clothing', 'clothing', 'Fashion', 'fashion'],
  'clothing': ['Mode', 'mode', 'Clothing', 'clothing', 'Fashion', 'fashion'],
  'agriculture': ['Agriculture', 'agriculture'],
  'sports': ['Sports', 'sports', 'Sport', 'sport'],
  'office': ['Fourniture de bureau', 'fourniture de bureau', 'Office', 'office'],
  'home': ['Maison', 'maison', 'Home', 'home', 'Mobilier', 'mobilier'],
  'kitchen': ['Cuisine', 'cuisine', 'Kitchen', 'kitchen'],
};

/**
 * Get actual database category names from inferred category
 */
function getDatabaseCategoryNames(inferredCategory: string): string[] {
  const normalized = inferredCategory.toLowerCase();
  
  // Direct lookup
  if (CATEGORY_NAME_MAPPING[normalized]) {
    return CATEGORY_NAME_MAPPING[normalized];
  }
  
  // Try to find partial matches
  for (const [key, names] of Object.entries(CATEGORY_NAME_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return names;
    }
  }
  
  // Return the inferred category as fallback
  return [inferredCategory];
}

/**
 * Extract meaningful keywords from a search query
 * Handles long product names like "Fan 16 Inch Solar powered Rechargeable..."
 */
function extractKeywords(query: string): string[] {
  if (!query) return [];
  
  // Normalize: lowercase, remove extra spaces
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  
  // Split by common delimiters
  const tokens = normalized.split(/[\s,;:\-|\/\(\)\[\]\{\}_\*\.]+/);
  
  // Filter out stop words, empty strings, and single characters
  const keywords = tokens.filter(token => 
    token.length > 1 && 
    !STOP_WORDS.has(token) &&
    !/^\d+$/.test(token) // Remove pure numbers
  );
  
  return [...new Set(keywords)]; // Remove duplicates
}

/**
 * Extract n-grams (word combinations) for better matching
 * e.g., "solar fan" from "Solar powered Rechargeable Fan"
 */
function extractNGrams(keywords: string[], n: number = 2): string[] {
  if (keywords.length < n) return [];
  
  const ngrams: string[] = [];
  for (let i = 0; i <= keywords.length - n; i++) {
    ngrams.push(keywords.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Infer category from search keywords based on product patterns
 */
function inferCategoryFromKeywords(keywords: string[]): string | null {
  const keywordSet = new Set(keywords);
  
  for (const [category, patterns] of Object.entries(PRODUCT_TYPE_PATTERNS)) {
    const matchCount = patterns.filter(p => keywordSet.has(p)).length;
    if (matchCount > 0) {
      return category;
    }
  }
  return null;
}

/**
 * Calculate relevance score for a supplier based on search keywords
 * Returns score and match details
 */
function calculateRelevanceScore(
  supplier: any,
  keywords: string[],
  targetCategories: Set<string>,
  matchingProducts: any[]
): { score: number; matchDetails: string[] } {
  let score = 0;
  const matchDetails: string[] = [];
  const supplierCategory = (supplier.category || '').toLowerCase();
  const supplierName = (supplier.business_name || '').toLowerCase();
  const supplierDesc = (supplier.description || '').toLowerCase();
  
  // 1. CATEGORY MATCH (Highest priority - 50 points)
  if (targetCategories.size > 0) {
    const categoryMatch = Array.from(targetCategories).some(targetCat => 
      supplierCategory === targetCat || 
      supplierCategory.includes(targetCat) ||
      targetCat.includes(supplierCategory)
    );
    if (categoryMatch) {
      score += 50;
      matchDetails.push('category');
    }
  }
  
  // 2. PRODUCT NAME/DESCRIPTION KEYWORD MATCH (30 points each keyword)
  const bigrams = extractNGrams(keywords, 2);
  const trigrams = extractNGrams(keywords, 3);
  
  for (const product of matchingProducts) {
    const productName = (product.name || '').toLowerCase();
    const productDesc = (product.description || '').toLowerCase();
    
    // Bigram matching in product name (high value)
    for (const bigram of bigrams) {
      if (productName.includes(bigram)) {
        score += 30;
        matchDetails.push(`product_bigram:${bigram}`);
      }
    }
    
    // Single keyword matching
    for (const keyword of keywords) {
      if (keyword.length < 3) continue; // Skip short keywords
      
      if (productName.includes(keyword)) {
        score += 20;
        matchDetails.push(`product_keyword:${keyword}`);
      }
      if (productDesc.includes(keyword)) {
        score += 10;
        matchDetails.push(`product_desc:${keyword}`);
      }
    }
  }
  
  // 3. SUPPLIER NAME MATCH (20 points each keyword)
  for (const keyword of keywords) {
    if (keyword.length < 3) continue;
    
    if (supplierName.includes(keyword)) {
      score += 20;
      matchDetails.push(`supplier_name:${keyword}`);
    }
  }
  
  // 4. SUPPLIER DESCRIPTION MATCH (10 points each keyword)
  for (const keyword of keywords) {
    if (keyword.length < 3) continue;
    
    if (supplierDesc.includes(keyword)) {
      score += 10;
      matchDetails.push(`supplier_desc:${keyword}`);
    }
  }
  
  // 5. BOOST for exact phrase match in supplier name
  const searchPhrase = keywords.join(' ');
  if (supplierName.includes(searchPhrase)) {
    score += 40;
    matchDetails.push('exact_name_match');
  }
  
  return { score, matchDetails };
}

/**
 * Fuzzy matching: check if word is similar (for typos)
 * Simple implementation using Levenshtein distance concept
 */
function isSimilar(word1: string, word2: string, threshold: number = 2): boolean {
  if (Math.abs(word1.length - word2.length) > threshold) return false;
  
  let differences = 0;
  const maxLen = Math.max(word1.length, word2.length);
  
  for (let i = 0; i < maxLen; i++) {
    if (word1[i] !== word2[i]) {
      differences++;
      if (differences > threshold) return false;
    }
  }
  
  return differences <= threshold;
}

export const getAllSuppliers = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .take(limit);
    
    return suppliers;
  }
});

// Query admin : lister toutes les galeries (imageGallery de chaque fournisseur)
export const listAllGalleriesAdmin = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    const user = await ctx.db
      .query("users")
      .filter(q => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    // Limit to prevent bandwidth issues (default 100, max 500)
    const limit = Math.min(args.limit ?? 100, 500);
    const suppliers = await ctx.db
      .query("suppliers")
      .take(limit);
    // Map to only return needed fields
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      imageGallery: s.imageGallery || [],
    }));
  }
});

export const getSupplierDetails = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    const supplier = await ctx.db.get(id as any).catch(async () => {
      // fallback: try find by field id stored elsewhere
      const byFilter = await ctx.db.query("suppliers").filter(q => q.eq(q.field("_id"), id as any)).first();
      return byFilter ?? null;
    });

    const s = supplier ?? await ctx.db.get(id as any);
    if (!s) {
      return { supplier: null, reviews: [] };
    }

    const reviews = await ctx.db.query("reviews").withIndex("supplierId", (q) => q.eq("supplierId", s._id as unknown as string)).collect();
    return { supplier: s, reviews };
  }
});

export const updateSupplierProfile = mutation({
  args: {
    business_name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.string(),
    address: v.optional(v.string()),
    city: v.string(),
    state: v.string(),
    country: v.optional(v.string()),
    latitude: v.optional(v.float64()),
    longitude: v.optional(v.float64()),
    website: v.optional(v.string()),
    image: v.optional(v.string()),
    imageGallery: v.optional(v.array(v.string())),
    business_hours: v.optional(v.record(v.string(), v.string())),
    social_links: v.optional(v.record(v.string(), v.string())),
    business_type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");

    const userId = identity.subject;
    // Application-level enforcement: Check for existing supplier profile for this user
    const supplier = await ctx.db.query("suppliers").withIndex("userId", (q) => q.eq("userId", userId)).first();
    if (!supplier) throw new Error("Profil fournisseur non trouvé");

    // Ensure we're not trying to change the userId (which should be immutable)
    if (supplier.userId !== userId) {
      throw new Error("Tentative de modification non autorisée du profil fournisseur");
    }

    // Default business hours if none provided
    const defaultBusinessHours = {
      monday: "08:00-18:00",
      tuesday: "08:00-18:00",
      wednesday: "08:00-18:00",
      thursday: "08:00-18:00",
      friday: "08:00-18:00",
      saturday: "09:00-17:00",
      sunday: "closed"
    };

    const businessHoursToSave = args.business_hours || supplier.business_hours || defaultBusinessHours;

    await ctx.db.patch(supplier._id, {
      business_name: args.business_name,
      email: args.email,
      phone: args.phone,
      description: args.description,
      category: args.category,
      address: args.address,
      city: args.city,
      state: args.state,
      country: args.country,
      latitude: args.latitude,
      longitude: args.longitude,
      location: `${args.city}, ${args.state}`,
      website: args.website,
      image: args.image,
      imageGallery: args.imageGallery,
      business_hours: businessHoursToSave,
      social_links: args.social_links,
      business_type: args.business_type,
      updated_at: new Date().toISOString(),
    });

    return { success: true };
  }
});

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(v: number) { return v * Math.PI / 180; }

/**
 * Internal query: Search suppliers with minimal fields for action processing
 * Returns only necessary fields to minimize bandwidth
 */
export const _searchSuppliersInternal = internalQuery({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 5000;
    const offset = args.offset ?? 0;
    
    // Get approved suppliers with minimal fields
    const suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .take(limit);
    
    // Return only necessary fields
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      description: s.description,
      category: s.category,
      city: s.city,
      state: s.state,
      location: s.location,
      rating: s.rating,
      reviews_count: s.reviews_count,
      verified: s.verified,
      featured: s.featured,
      approved: s.approved,
      image: s.image,
      logo_url: s.logo_url,
      latitude: s.latitude,
      longitude: s.longitude,
      phone: s.phone,
      email: s.email,
    }));
  },
});

/**
 * Internal query: Get products with minimal fields for search
 * MEMORY OPTIMIZED: Limited to 200 products max to prevent OOM
 */
export const _getProductsForSearchOptimized = internalQuery({
  args: {
    keywords: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 200, 200); // Hard limit to prevent OOM
    const keywords = args.keywords.map(k => k.toLowerCase());
    
    // Get all products and filter in memory (since we need keyword matching)
    // But limit strictly to prevent memory issues
    const allProducts = await ctx.db.query("products").take(limit * 2); // Get more to filter
    
    // Filter products that match keywords
    const matchingProducts = allProducts.filter(p => {
      const name = (p.name || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return keywords.some(kw => name.includes(kw) || desc.includes(kw));
    }).slice(0, limit);
    
    return matchingProducts.map(p => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      supplierId: p.supplierId,
      category: p.category,
    }));
  },
});

/**
 * Internal query: Get suppliers by category using index
 * MEMORY OPTIMIZED: Uses category index for efficient filtering
 */
export const _getSuppliersByCategory = internalQuery({
  args: {
    category: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 500, 500);
    
    // First try: exact match with the category index
    let suppliers = await ctx.db
      .query("suppliers")
      .withIndex("approved_category", (q) => 
        q.eq("approved", true).eq("category", args.category)
      )
      .take(limit);
    
    // Second try: case-insensitive fallback if no results
    if (suppliers.length === 0) {
      const categoryLower = args.category.toLowerCase();
      const allSuppliers = await ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", true))
        .take(limit * 2);
      
      suppliers = allSuppliers.filter(s => 
        s.category?.toLowerCase() === categoryLower ||
        s.category?.toLowerCase().includes(categoryLower) ||
        categoryLower.includes(s.category?.toLowerCase() || '')
      ).slice(0, limit);
    }
    
    return suppliers.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      description: s.description,
      category: s.category,
      city: s.city,
      state: s.state,
      location: s.location,
      rating: s.rating,
      reviews_count: s.reviews_count,
      verified: s.verified,
      featured: s.featured,
      approved: s.approved,
      image: s.image,
      logo_url: s.logo_url,
      latitude: s.latitude,
      longitude: s.longitude,
      phone: s.phone,
      email: s.email,
    }));
  },
});

/**
 * Internal query: Get approved suppliers paginated
 * MEMORY OPTIMIZED: Uses pagination to limit memory usage
 */
export const _getSuppliersPaginated = internalQuery({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 500, 500);
    const cursor = args.cursor;
    
    const result = await ctx.db
      .query("suppliers")
      .withIndex("approved", (q) => q.eq("approved", true))
      .paginate({ cursor, numItems: limit });
    
    // Map to minimal fields
    const page = result.page.map(s => ({
      _id: s._id,
      business_name: s.business_name,
      description: s.description,
      category: s.category,
      city: s.city,
      state: s.state,
      location: s.location,
      rating: s.rating,
      reviews_count: s.reviews_count,
      verified: s.verified,
      featured: s.featured,
      approved: s.approved,
      image: s.image,
      logo_url: s.logo_url,
      latitude: s.latitude,
      longitude: s.longitude,
      phone: s.phone,
      email: s.email,
    }));
    
    return {
      page,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

/**
 * Internal query: Get categories (lightweight - max 100)
 */
export const _getCategoriesLight = internalQuery({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").take(100);
    return categories.map(c => ({
      _id: c._id,
      name: c.name,
      description: c.description,
    }));
  },
});

/**
 * Search suppliers by PRODUCT - MEMORY-OPTIMIZED INTELLIGENT SEARCH
 * 
 * ARCHITECTURE:
 * 1. Phase 1: Category Detection (lightweight)
 *    - Load max 100 categories
 *    - Load max 200 matching products with keyword filter
 *    - Infer categories from keywords
 * 
 * 2. Phase 2: Supplier Fetching by Category (using indexes)
 *    - For each target category, query suppliers using approved_category index
 *    - Process in batches to limit memory
 *    - Calculate relevance scores on the fly
 * 
 * 3. Phase 3: Fallback (if needed)
 *    - If no results from category search, use paginated text search
 * 
 * MEMORY SAFE: Never loads more than ~1000 records at once
 */
export const searchSuppliers = action({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    lat: v.optional(v.float64()),
    lng: v.optional(v.float64()),
    radiusKm: v.optional(v.float64()),
    minRating: v.optional(v.float64()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.int64()),
    offset: v.optional(v.int64()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || 'relevance';

    let scoredSuppliers: Array<any & { _score: number; _matchDetails: string[] }> = [];
    
    // Initialize target categories set (used for ranking)
    let targetCategories: Set<string> = new Set();

    // ==========================================
    // PHASE 1: CATEGORY DETECTION (Lightweight)
    // ==========================================
    
    if (args.q && args.q.trim()) {
      const rawQuery = args.q.trim();
      
      // Extract keywords from query
      const keywords = extractKeywords(rawQuery);
      
      // Load lightweight categories (max 100)
      const categories = await ctx.runQuery(internal.suppliers._getCategoriesLight);
      
      // Load matching products with keyword filter (max 200)
      const matchingProducts = keywords.length > 0 
        ? await ctx.runQuery(internal.suppliers._getProductsForSearchOptimized, { 
            keywords,
            limit: 200 
          })
        : [];
      
      // Determine target categories
      
      // From matching products (use actual category names from products)
      matchingProducts.forEach((product: any) => {
        if (product.category) {
          // Add the actual category name from the product (preserve case as stored)
          targetCategories.add(product.category);
          // Also add lowercase version for flexible matching
          targetCategories.add(product.category.toLowerCase());
        }
      });
      
      // From direct category name matching
      const queryLower = rawQuery.toLowerCase();
      categories.forEach((cat: any) => {
        const catName = (cat.name || '').toLowerCase();
        const catDesc = (cat.description || '').toLowerCase();
        
        if (queryLower.includes(catName) || catName.includes(queryLower) ||
            (catDesc && (queryLower.includes(catDesc) || catDesc.includes(queryLower)))) {
          targetCategories.add(cat.name); // Add original case
          targetCategories.add(catName); // Add lowercase
        }
        
        for (const keyword of keywords) {
          if (keyword.length >= 3 && (catName.includes(keyword) || (catDesc && catDesc.includes(keyword)))) {
            targetCategories.add(cat.name);
            targetCategories.add(catName);
          }
        }
      });
      
      // Infer category from keywords and add both original and mapped variations
      const inferredCategory = inferCategoryFromKeywords(keywords);
      if (inferredCategory) {
        // Add the inferred category key
        targetCategories.add(inferredCategory);
        targetCategories.add(inferredCategory.toLowerCase());
        
        // Add the mapped database category names (e.g., "electronics" → "Électronique")
        const mappedNames = getDatabaseCategoryNames(inferredCategory);
        mappedNames.forEach(name => {
          targetCategories.add(name);
          targetCategories.add(name.toLowerCase());
        });
        
        // Also try to find matching category names from the database
        const inferredLower = inferredCategory.toLowerCase();
        categories.forEach((cat: any) => {
          const catNameLower = (cat.name || '').toLowerCase();
          if (catNameLower.includes(inferredLower) || inferredLower.includes(catNameLower)) {
            targetCategories.add(cat.name);
            targetCategories.add(catNameLower);
          }
        });
      }
      
      // ==========================================
      // PHASE 2: SUPPLIER FETCHING BY CATEGORY
      // ==========================================
      
      if (targetCategories.size > 0) {
        // Fetch suppliers for each target category using index
        const categoryResults: any[] = [];
        
        for (const targetCat of targetCategories) {
          // Use index-based query for each category (max 500 per category)
          const catSuppliers = await ctx.runQuery(internal.suppliers._getSuppliersByCategory, {
            category: targetCat,
            limit: 500
          });
          categoryResults.push(...catSuppliers);
        }
        
        // Remove duplicates (supplier might be in multiple category queries)
        const uniqueSuppliers = new Map();
        categoryResults.forEach((s: any) => {
          if (!uniqueSuppliers.has(s._id)) {
            uniqueSuppliers.set(s._id, s);
          }
        });
        
        // Calculate relevance scores
        scoredSuppliers = Array.from(uniqueSuppliers.values()).map((supplier: any) => {
          const { score, matchDetails } = calculateRelevanceScore(
            supplier,
            keywords,
            targetCategories,
            matchingProducts
          );
          return {
            ...supplier,
            _score: score,
            _matchDetails: matchDetails,
          };
        });
        
        // Filter out zero scores
        scoredSuppliers = scoredSuppliers.filter(s => s._score > 0);
      }
      
      // ==========================================
      // PHASE 3: FALLBACK (if no category matches)
      // ==========================================
      
      if (scoredSuppliers.length === 0) {
        // Use paginated approach for text search
        let cursor: string | undefined = undefined;
        const fallbackResults: any[] = [];
        const fallbackQuery = rawQuery.toLowerCase();
        const maxFallbackIterations = 5; // Prevent infinite loops
        
        for (let i = 0; i < maxFallbackIterations && fallbackResults.length < 500; i++) {
          const result = await ctx.runQuery(internal.suppliers._getSuppliersPaginated, {
            cursor,
            limit: 200
          });
          
          // Filter by text match
          const matching = result.page.filter((s: any) =>
            (s.business_name?.toLowerCase().includes(fallbackQuery)) ||
            (s.description?.toLowerCase().includes(fallbackQuery)) ||
            (s.category?.toLowerCase().includes(fallbackQuery))
          ).map((s: any) => ({
            ...s,
            _score: 1,
            _matchDetails: ['fallback_match']
          }));
          
          fallbackResults.push(...matching);
          
          if (result.isDone || !result.continueCursor) break;
          cursor = result.continueCursor;
        }
        
        scoredSuppliers = fallbackResults.slice(0, 500);
      }
      
    } else {
      // ==========================================
      // NO SEARCH QUERY - Use pagination
      // ==========================================
      
      let cursor: string | undefined = undefined;
      const allSuppliers: any[] = [];
      const maxIterations = 10;
      
      for (let i = 0; i < maxIterations && allSuppliers.length < 1000; i++) {
        const result = await ctx.runQuery(internal.suppliers._getSuppliersPaginated, {
          cursor,
          limit: 200
        });
        
        allSuppliers.push(...result.page);
        
        if (result.isDone || !result.continueCursor) break;
        cursor = result.continueCursor;
      }
      
      scoredSuppliers = allSuppliers.map((s: any) => ({ ...s, _score: 0, _matchDetails: [] }));
    }

    // Store target categories for ranking
    const targetCategoriesArray = Array.from(targetCategories);
    const targetCategoriesLower = targetCategoriesArray.map(c => c.toLowerCase());

    // ==========================================
    // APPLY FILTERS
    // ==========================================
    
    // STRICT FILTER: If we detected target categories from search query,
    // ONLY show suppliers from those categories (don't show unrelated premium suppliers)
    if (targetCategories.size > 0 && args.q && args.q.trim()) {
      scoredSuppliers = scoredSuppliers.filter(s => {
        if (!s.category) return false;
        const catLower = s.category.toLowerCase();
        return targetCategoriesLower.some(targetCat => 
          catLower === targetCat || 
          catLower.includes(targetCat) || 
          targetCat.includes(catLower)
        );
      });
    }
    
    // Apply explicit category filter
    if (args.category) {
      scoredSuppliers = scoredSuppliers.filter(s => s.category === args.category);
    }

    // Apply location filter
    if (args.location) {
      const loc = args.location.toLowerCase();
      scoredSuppliers = scoredSuppliers.filter(s => 
        (s.location || '').toLowerCase().includes(loc) ||
        (s.city || '').toLowerCase().includes(loc) ||
        (s.state || '').toLowerCase().includes(loc)
      );
    }

    // Apply rating filter
    if (args.minRating && args.minRating > 0) {
      scoredSuppliers = scoredSuppliers.filter(s => (s.rating ?? 0) >= (args.minRating as number));
    }

    // Apply verified filter
    if (args.verified) {
      scoredSuppliers = scoredSuppliers.filter(s => s.approved === true);
    }

    // Apply distance filter
    if (args.lat !== undefined && args.lng !== undefined) {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const radius = args.radiusKm ?? 50;

      scoredSuppliers = scoredSuppliers
        .map(s => {
          if (s.latitude != null && s.longitude != null) {
            const d = haversineKm(lat, lng, s.latitude, s.longitude);
            return { ...s, distance: d };
          }
          return { ...s, distance: Number.POSITIVE_INFINITY };
        })
        .filter(s => s.distance <= radius);
    }

    // ==========================================
    // SORT RESULTS
    // ==========================================
    
    scoredSuppliers.sort((a, b) => {
      // Helper function to check if supplier category matches target categories
      const isTargetCategory = (supplier: any) => {
        if (!supplier.category) return false;
        const catLower = supplier.category.toLowerCase();
        return targetCategoriesLower.includes(catLower);
      };
      
      const aIsTarget = isTargetCategory(a);
      const bIsTarget = isTargetCategory(b);
      // const aIsFeatured = a.featured ? 1 : 0;
      // const bIsFeatured = b.featured ? 1 : 0;
      
      /* 
      // PREMIUM RANKING DISABLED - All suppliers treated equally
      // Priority 1: Featured suppliers in target category
      if (aIsFeatured && aIsTarget && !(bIsFeatured && bIsTarget)) {
        return -1;
      }
      if (bIsFeatured && bIsTarget && !(aIsFeatured && aIsTarget)) {
        return 1;
      }
      
      // Priority 2: Non-featured suppliers in target category
      if (aIsTarget && !aIsFeatured && (!bIsTarget || bIsFeatured)) {
        return -1;
      }
      if (bIsTarget && !bIsFeatured && (!aIsTarget || aIsFeatured)) {
        return 1;
      }
      
      // Priority 3: Featured suppliers not in target category
      if (aIsFeatured !== bIsFeatured) {
        return bIsFeatured - aIsFeatured;
      }
      */
      
      // NEW: Only prioritize by category match, then relevance
      // Priority 1: Suppliers in target category
      if (aIsTarget && !bIsTarget) {
        return -1;
      }
      if (bIsTarget && !aIsTarget) {
        return 1;
      }
      
      // Priority 2: Relevance score (for intelligent search)
      if (sortBy === 'relevance') {
        const scoreDiff = (b._score ?? 0) - (a._score ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        
        // Within same score, sort by rating then reviews
        const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
        if (ratingDiff !== 0) return ratingDiff;
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      }
      
      // Other sort options
      if (sortBy === 'distance') {
        const distA = (a as any).distance ?? Number.POSITIVE_INFINITY;
        const distB = (b as any).distance ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      } else if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      } else if (sortBy === 'reviews') {
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      } else if (sortBy === 'alpha_asc') {
        return (a.business_name || '').localeCompare(b.business_name || '');
      } else if (sortBy === 'alpha_desc') {
        return (b.business_name || '').localeCompare(a.business_name || '');
      }
      
      // Default fallback: rating then reviews
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
    });

    // ==========================================
    // PREPARE RESULTS
    // ==========================================
    
    const total = scoredSuppliers.length;
    const sliced = scoredSuppliers.slice(offset, offset + limit).map(s => {
      const { _score, _matchDetails, ...supplierData } = s;
      return {
        ...supplierData,
        relevanceScore: _score,
        matchDetails: _matchDetails,
      };
    });
    
    return { suppliers: sliced, total };
  },
});

// Legacy query version - MEMORY-OPTIMIZED using pagination and indexes
export const searchSuppliersQuery = query({
  args: {
    q: v.optional(v.string()),
    category: v.optional(v.string()),
    location: v.optional(v.string()),
    lat: v.optional(v.float64()),
    lng: v.optional(v.float64()),
    radiusKm: v.optional(v.float64()),
    minRating: v.optional(v.float64()),
    verified: v.optional(v.boolean()),
    limit: v.optional(v.int64()),
    offset: v.optional(v.int64()),
    sortBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = Number(args.limit ?? 20);
    const offset = Number(args.offset ?? 0);
    const sortBy = args.sortBy || 'relevance';

    let all: any[] = [];
    let targetCategories: Set<string> = new Set();
    let searchQueryUsed = false;

    if (args.q && args.q.trim()) {
      const q = args.q.toLowerCase().trim();
      searchQueryUsed = true;
      
      // PHASE 1: Load categories (max 100) and determine target categories
      const categories = await ctx.db.query("categories").take(100);
      
      // Direct category matching
      categories.forEach(cat => {
        const catName = (cat.name || '').toLowerCase();
        const catDesc = (cat.description || '').toLowerCase();
        if (catName.includes(q) || (catDesc && catDesc.includes(q)) || q.includes(catName)) {
          targetCategories.add(catName);
        }
      });
      
      // PHASE 2: Load suppliers by category using index OR use pagination for text search
      if (targetCategories.size > 0) {
        // Use category index for efficient fetching
        for (const targetCat of targetCategories) {
          const catSuppliers = await ctx.db
            .query("suppliers")
            .withIndex("approved_category", (q) => 
              q.eq("approved", true).eq("category", targetCat)
            )
            .take(500);
          all.push(...catSuppliers);
        }
        
        // Remove duplicates
        const unique = new Map();
        all.forEach(s => unique.set(s._id, s));
        all = Array.from(unique.values());
      } else {
        // Fallback: Use pagination for text search (memory-safe)
        let cursor: string | undefined = undefined;
        const maxIterations = 5;
        
        for (let i = 0; i < maxIterations && all.length < 500; i++) {
          const result = await ctx.db
            .query("suppliers")
            .withIndex("approved", (q) => q.eq("approved", true))
            .paginate({ cursor, numItems: 200 });
          
          const matching = result.page.filter(s =>
            s.business_name?.toLowerCase().includes(q) ||
            s.description?.toLowerCase().includes(q)
          );
          
          all.push(...matching);
          
          if (result.isDone || !result.continueCursor) break;
          cursor = result.continueCursor;
        }
      }
    } else {
      // No search query - use pagination for all suppliers
      let cursor: string | undefined = undefined;
      const maxIterations = 5;
      
      for (let i = 0; i < maxIterations && all.length < 1000; i++) {
        const result = await ctx.db
          .query("suppliers")
          .withIndex("approved", (q) => q.eq("approved", true))
          .paginate({ cursor, numItems: 200 });
        
        all.push(...result.page);
        
        if (result.isDone || !result.continueCursor) break;
        cursor = result.continueCursor;
      }
    }

    // Apply explicit category filter if provided (and no search query used)
    if (args.category && !searchQueryUsed) {
      all = all.filter(s => s.category === args.category);
    }

    if (args.location) {
      const loc = args.location.toLowerCase();
      all = all.filter(s => (s.location || "").toLowerCase().includes(loc));
    }

    if (args.minRating && args.minRating > 0) {
      all = all.filter(s => (s.rating ?? 0) >= (args.minRating as number));
    }

    if (args.verified) {
      all = all.filter(s => s.approved === true);
    }

    if (args.lat !== undefined && args.lng !== undefined) {
      const lat = args.lat as number;
      const lng = args.lng as number;
      const radius = args.radiusKm ?? 50;

      all = all
        .map(s => {
          if (s.latitude != null && s.longitude != null) {
            const d = haversineKm(lat, lng, s.latitude, s.longitude);
            return { ...s, distance: d } as typeof s & { distance: number };
          }
          return { ...s, distance: Number.POSITIVE_INFINITY } as typeof s & { distance: number };
        })
        .filter(s => s.distance <= radius);
    }

    // Apply sorting
    all = all.sort((a, b) => {
      const featuredA = a.featured ? 1 : 0;
      const featuredB = b.featured ? 1 : 0;
      
      if (featuredB !== featuredA) {
        return featuredB - featuredA;
      }
      
      if (sortBy === 'distance') {
        const distA = (a as any).distance ?? Number.POSITIVE_INFINITY;
        const distB = (b as any).distance ?? Number.POSITIVE_INFINITY;
        return distA - distB;
      } else if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      } else if (sortBy === 'reviews') {
        return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
      } else if (sortBy === 'alpha_asc') {
        return (a.business_name || '').localeCompare(b.business_name || '');
      } else if (sortBy === 'alpha_desc') {
        return (b.business_name || '').localeCompare(a.business_name || '');
      }
      
      const ratingDiff = (b.rating ?? 0) - (a.rating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return Number(b.reviews_count ?? 0) - Number(a.reviews_count ?? 0);
    });

    const total = all.length;
    const sliced = all.slice(offset, offset + limit);
    return { suppliers: sliced, total };
  },
});

// Mutation for claiming a supplier/business
export const claimSupplier = mutation({
  args: {
    supplierId: v.id("suppliers"),
    userEmail: v.string(),
    claimedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    // Find the user in our database
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
    
    if (!user) {
      throw new Error("Utilisateur non trouvé");
    }
    
    // Get the supplier
    const supplier = await ctx.db.get(args.supplierId);
    
    if (!supplier) {
      throw new Error("Fournisseur non trouvé");
    }
    
    // Check if supplier is already claimed
    if (supplier.userId && supplier.userId !== user._id) {
      throw new Error("Cette entreprise a déjà été réclamée");
    }
    
    // Verify email matches (basic validation)
    const supplierEmail = (supplier.email || "").toLowerCase();
    const claimerEmail = args.userEmail.toLowerCase();
    // Email validation can be extended here
    void supplierEmail;
    void claimerEmail;
    
    // Create a claim record
    const claimId = await ctx.db.insert("supplierClaims", {
      supplierId: args.supplierId,
      userId: user._id,
      userEmail: args.userEmail,
      supplierEmail: supplier.email || "",
      status: "pending", // pending, approved, rejected
      claimedAt: args.claimedAt,
      verifiedAt: undefined,
      verifiedBy: undefined,
      notes: "",
    });
    
    // Update supplier with pending claim status
    await ctx.db.patch(args.supplierId, {
      claimStatus: "pending",
      claimId: claimId,
    });
    
    return { 
      success: true, 
      claimId,
      message: "Demande de réclamation soumise avec succès" 
    };
  }
});

// Admin: Get filtered suppliers using indexes
export const getFilteredSuppliers = query({
  args: {
    approved: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const limit = Math.min(args.limit ?? 500, 500);
    let suppliers: any[] = [];

    // Use index-based filtering when possible
    if (args.approved !== undefined && args.featured !== undefined) {
      // When both approved and featured are specified, use approved index first
      // then filter by featured
      const byApproved = await ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
        .take(limit);
      suppliers = byApproved.filter(s => s.featured === args.featured);
    } else if (args.approved !== undefined) {
      // Use approved index
      suppliers = await ctx.db
        .query("suppliers")
        .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
        .take(limit);
    } else if (args.featured !== undefined) {
      // Use featured index
      suppliers = await ctx.db
        .query("suppliers")
        .withIndex("featured", (q) => q.eq("featured", args.featured as boolean))
        .take(limit);
    } else {
      // No index filter, fetch all
      suppliers = await ctx.db
        .query("suppliers")
        .take(limit);
    }

    // Apply category filter in memory if specified
    if (args.category) {
      suppliers = suppliers.filter(s => s.category === args.category);
    }

    // Apply search filter in memory if specified
    if (args.searchQuery && args.searchQuery.trim()) {
      const q = args.searchQuery.toLowerCase().trim();
      suppliers = suppliers.filter(s => 
        s.business_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q)
      );
    }

    return suppliers;
  },
});

// Admin: Get all suppliers with pagination (no limit)
export const getAllSuppliersPaginated = query({
  args: {
    paginationOpts: v.object({
      cursor: v.union(v.null(), v.optional(v.string())),
      id: v.optional(v.number()),
      numItems: v.number(),
    }),
    approved: v.optional(v.boolean()),
    featured: v.optional(v.boolean()),
    category: v.optional(v.string()),
    searchQuery: v.optional(v.string()),
    sortBy: v.optional(v.string()), // 'name', 'created_at', 'category'
    sortOrder: v.optional(v.string()), // 'asc', 'desc'
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }

    const numItems = Math.min(args.paginationOpts.numItems, 500);
    const cursor = args.paginationOpts.cursor || undefined;
    const sortBy = args.sortBy || 'created_at';
    const sortOrder = args.sortOrder || 'desc';

    // If filters are applied, use index queries (no pagination cursor support for filtered results)
    if (args.approved !== undefined || args.featured !== undefined || args.category || args.searchQuery) {
      let suppliers: any[] = [];
      const limit = 1000; // Higher limit for filtered results

      // Use index-based filtering when possible
      if (args.approved !== undefined && args.featured !== undefined) {
        const byApproved = await ctx.db
          .query("suppliers")
          .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
          .take(limit);
        suppliers = byApproved.filter(s => s.featured === args.featured);
      } else if (args.approved !== undefined) {
        suppliers = await ctx.db
          .query("suppliers")
          .withIndex("approved", (q) => q.eq("approved", args.approved as boolean))
          .take(limit);
      } else if (args.featured !== undefined) {
        suppliers = await ctx.db
          .query("suppliers")
          .withIndex("featured", (q) => q.eq("featured", args.featured as boolean))
          .take(limit);
      } else if (args.category) {
        // Use category index
        suppliers = await ctx.db
          .query("suppliers")
          .withIndex("category", (q) => q.eq("category", args.category as string))
          .take(limit);
      } else {
        suppliers = await ctx.db
          .query("suppliers")
          .take(limit);
      }

      // Apply category filter in memory if specified (and not already filtered by index)
      if (args.category && !args.approved && !args.featured) {
        const categoryLower = args.category.toLowerCase().trim();
        suppliers = suppliers.filter(s => 
          s.category?.toLowerCase().trim() === categoryLower
        );
      }

      // Apply search filter in memory if specified
      if (args.searchQuery && args.searchQuery.trim()) {
        const q = args.searchQuery.toLowerCase().trim();
        suppliers = suppliers.filter(s => 
          s.business_name?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.city?.toLowerCase().includes(q) ||
          s.state?.toLowerCase().includes(q)
        );
      }

      // Apply sorting
      suppliers.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = (a.business_name || '').localeCompare(b.business_name || '');
            break;
          case 'category':
            comparison = (a.category || '').localeCompare(b.category || '');
            break;
          case 'city':
            comparison = (a.city || '').localeCompare(b.city || '');
            break;
          case 'created_at':
          default:
            comparison = (a.created_at || '').localeCompare(b.created_at || '');
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });

      // Return in paginated format
      return {
        page: suppliers,
        continueCursor: null, // No pagination for filtered results
        isDone: true,
      };
    }

    // No filters - use paginate for efficient fetching of all suppliers
    const result = await ctx.db
      .query("suppliers")
      .paginate({ cursor, numItems });

    // Apply sorting to paginated results
    if (sortBy !== 'created_at' || sortOrder !== 'desc') {
      result.page.sort((a: any, b: any) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            comparison = (a.business_name || '').localeCompare(b.business_name || '');
            break;
          case 'category':
            comparison = (a.category || '').localeCompare(b.category || '');
            break;
          case 'city':
            comparison = (a.city || '').localeCompare(b.city || '');
            break;
          case 'created_at':
          default:
            comparison = (a.created_at || '').localeCompare(b.created_at || '');
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  },
});

// Admin: Get all pending supplier claims
export const getPendingClaims = query({
  args: {},
  handler: async (ctx) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!user || !user.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get all pending claims
    const claims = await ctx.db
      .query("supplierClaims")
      .withIndex("status", (q) => q.eq("status", "pending"))
      .collect();
    
    // Get supplier details for each claim
    const claimsWithDetails = await Promise.all(
      claims.map(async (claim) => {
        const supplier = await ctx.db.get(claim.supplierId);
          
        const claimant = await ctx.db.get(claim.userId as Id<"users">);
          
        return {
          ...claim,
          supplier: supplier ? {
            _id: supplier._id,
            business_name: supplier.business_name,
            email: supplier.email,
            phone: supplier.phone,
            city: supplier.city,
            state: supplier.state,
          } : null,
          claimant: claimant ? {
            _id: claimant._id,
            email: claimant.email,
            firstName: claimant.firstName,
            lastName: claimant.lastName,
          } : null,
        };
      })
    );
    
    return claimsWithDetails;
  }
});

// Admin: Approve a supplier claim
export const approveClaim = mutation({
  args: {
    claimId: v.id("supplierClaims"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!admin || !admin.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get the claim
    const claim = await ctx.db.get(args.claimId);
      
    if (!claim) {
      throw new Error("Demande de réclamation non trouvée");
    }
    
    if (claim.status !== "pending") {
      throw new Error("Cette demande a déjà été traitée");
    }
    
    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "approved",
      verifiedAt: new Date().toISOString(),
      verifiedBy: admin._id,
      notes: args.notes || "",
    });
    
    // Update supplier: assign to the claiming user
    await ctx.db.patch(claim.supplierId, {
      userId: claim.userId,
      claimStatus: "approved",
      claimId: args.claimId,
      verified: true,
      approved: true,
      updated_at: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: "Demande de réclamation approuvée avec succès" 
    };
  }
});

// Admin: Reject a supplier claim
export const rejectClaim = mutation({
  args: {
    claimId: v.id("supplierClaims"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user is admin
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Non autorisé");
    
    const admin = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", identity.email))
      .first();
      
    if (!admin || !admin.is_admin) {
      throw new Error("Accès refusé. Seuls les administrateurs peuvent effectuer cette action.");
    }
    
    // Get the claim
    const claim = await ctx.db.get(args.claimId);
      
    if (!claim) {
      throw new Error("Demande de réclamation non trouvée");
    }
    
    if (claim.status !== "pending") {
      throw new Error("Cette demande a déjà été traitée");
    }
    
    // Update claim status
    await ctx.db.patch(args.claimId, {
      status: "rejected",
      verifiedAt: new Date().toISOString(),
      verifiedBy: admin._id,
      notes: args.notes || "",
    });
    
    // Update supplier: reset claim status
    await ctx.db.patch(claim.supplierId, {
      claimStatus: undefined,
      claimId: undefined,
      updated_at: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: "Demande de réclamation refusée" 
    };
  }
});


