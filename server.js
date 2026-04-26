const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ── in-memory auth & orders ── */
const users  = {};
const orders = {};
let   oid    = 1000;

/* ══════════════════════════════════════════════════════════════
   PRODUCT CATALOGUE  — 10 real products per category
   Each has Amazon + Flipkart deep-link URLs
══════════════════════════════════════════════════════════════ */
const catalogue = {

  laptop: [
    { id:'L01', name:'Apple MacBook Air M3 (13-inch, 8GB)',           img:'https://m.media-amazon.com/images/I/71tp4j1XERL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Apple+MacBook+Air+M3',             flipkartUrl:'https://www.flipkart.com/search?q=Apple+MacBook+Air+M3',             price:114900, mrp:134900, rating:4.7, reviews:3241 },
    { id:'L02', name:'Dell XPS 15 (Intel Core i7, 16GB, 512GB SSD)',  img:'https://m.media-amazon.com/images/I/71SEBsyCvAL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Dell+XPS+15',                      flipkartUrl:'https://www.flipkart.com/search?q=Dell+XPS+15',                      price: 99990, mrp:129990, rating:4.5, reviews:1823 },
    { id:'L03', name:'HP Pavilion 15 (Ryzen 5, 16GB, 512GB SSD)',     img:'https://m.media-amazon.com/images/I/71JiF7vNMTL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=HP+Pavilion+15+Ryzen',             flipkartUrl:'https://www.flipkart.com/search?q=HP+Pavilion+15+Ryzen',             price: 62990, mrp: 79990, rating:4.3, reviews:4512 },
    { id:'L04', name:'Lenovo IdeaPad Slim 5 (Core i5, 16GB, 512GB)', img:'https://m.media-amazon.com/images/I/61nd1UFXJLL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Lenovo+IdeaPad+Slim+5',            flipkartUrl:'https://www.flipkart.com/search?q=Lenovo+IdeaPad+Slim+5',            price: 54990, mrp: 72990, rating:4.4, reviews:6781 },
    { id:'L05', name:'ASUS ROG Strix G15 (Ryzen 9, RTX 4060)',        img:'https://m.media-amazon.com/images/I/81YbOAFxMFL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=ASUS+ROG+Strix+G15',              flipkartUrl:'https://www.flipkart.com/search?q=ASUS+ROG+Strix+G15',              price:109990, mrp:149990, rating:4.6, reviews:2134 },
    { id:'L06', name:'Acer Aspire 7 (Core i5, RTX 2050, 16GB)',       img:'https://m.media-amazon.com/images/I/71Lq3NQnMHL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Acer+Aspire+7+i5',                 flipkartUrl:'https://www.flipkart.com/search?q=Acer+Aspire+7',                    price: 59990, mrp: 74990, rating:4.2, reviews:3892 },
    { id:'L07', name:'Microsoft Surface Laptop 5 (Core i5, 8GB)',     img:'https://m.media-amazon.com/images/I/61cnnbkJ0kL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Microsoft+Surface+Laptop+5',       flipkartUrl:'https://www.flipkart.com/search?q=Microsoft+Surface+Laptop+5',       price: 89999, mrp:112999, rating:4.5, reviews:987  },
    { id:'L08', name:'Samsung Galaxy Book3 Pro (Core i7, 16GB)',       img:'https://m.media-amazon.com/images/I/71QWpTTfMbL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+Galaxy+Book3+Pro',         flipkartUrl:'https://www.flipkart.com/search?q=Samsung+Galaxy+Book3+Pro',         price: 94990, mrp:119990, rating:4.4, reviews:1456 },
    { id:'L09', name:'Xiaomi RedmiBook Pro 15 (Ryzen 7, 16GB)',        img:'https://m.media-amazon.com/images/I/61cSNzn7ESL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Xiaomi+RedmiBook+Pro+15',          flipkartUrl:'https://www.flipkart.com/search?q=RedmiBook+Pro+15',                 price: 55990, mrp: 69990, rating:4.3, reviews:2341 },
    { id:'L10', name:'MSI Thin GF63 (Core i5, RTX 4050, 16GB)',       img:'https://m.media-amazon.com/images/I/71e9NIQPL3L._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=MSI+Thin+GF63',                    flipkartUrl:'https://www.flipkart.com/search?q=MSI+Thin+GF63',                    price: 62490, mrp: 84990, rating:4.3, reviews:1789 },
  ],

  smartphone: [
    { id:'S01', name:'Apple iPhone 16 Pro (256GB, Black Titanium)',    img:'https://m.media-amazon.com/images/I/81dT9yECgsL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Apple+iPhone+16+Pro',              flipkartUrl:'https://www.flipkart.com/search?q=Apple+iPhone+16+Pro',              price:119900, mrp:134900, rating:4.8, reviews:8921 },
    { id:'S02', name:'Samsung Galaxy S25 Ultra (256GB, Titanium)',     img:'https://m.media-amazon.com/images/I/71Sa3dqTqZL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+Galaxy+S25+Ultra',         flipkartUrl:'https://www.flipkart.com/search?q=Samsung+Galaxy+S25+Ultra',         price:129999, mrp:159999, rating:4.7, reviews:6234 },
    { id:'S03', name:'OnePlus 13 (512GB, Black Eclipse)',              img:'https://m.media-amazon.com/images/I/61SctYBJfHL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=OnePlus+13',                       flipkartUrl:'https://www.flipkart.com/search?q=OnePlus+13',                       price: 69999, mrp: 79999, rating:4.6, reviews:4512 },
    { id:'S04', name:'Google Pixel 9 Pro (128GB, Obsidian)',           img:'https://m.media-amazon.com/images/I/71OjBXRhqXL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Google+Pixel+9+Pro',               flipkartUrl:'https://www.flipkart.com/search?q=Google+Pixel+9+Pro',               price: 99999, mrp:119999, rating:4.6, reviews:3201 },
    { id:'S05', name:'Xiaomi 14 Ultra (512GB, Black)',                 img:'https://m.media-amazon.com/images/I/61lRtQlOkRL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Xiaomi+14+Ultra',                  flipkartUrl:'https://www.flipkart.com/search?q=Xiaomi+14+Ultra',                  price: 99999, mrp:115000, rating:4.5, reviews:2187 },
    { id:'S06', name:'Realme GT 6 (256GB, Fluid Silver)',              img:'https://m.media-amazon.com/images/I/71L4cVgSz4L._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Realme+GT+6',                      flipkartUrl:'https://www.flipkart.com/search?q=Realme+GT+6',                      price: 41999, mrp: 49999, rating:4.3, reviews:5432 },
    { id:'S07', name:'Samsung Galaxy A55 5G (256GB, Navy)',            img:'https://m.media-amazon.com/images/I/71IcUn1OVML._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+Galaxy+A55',               flipkartUrl:'https://www.flipkart.com/search?q=Samsung+Galaxy+A55',               price: 37999, mrp: 44999, rating:4.3, reviews:7823 },
    { id:'S08', name:'iQOO 12 (256GB, Legend)',                        img:'https://m.media-amazon.com/images/I/71SoiCKXBNL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=iQOO+12',                          flipkartUrl:'https://www.flipkart.com/search?q=iQOO+12',                          price: 52999, mrp: 64999, rating:4.5, reviews:3412 },
    { id:'S09', name:'Nothing Phone (2a) (256GB, Black)',              img:'https://m.media-amazon.com/images/I/61v4WzNPv3L._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Nothing+Phone+2a',                 flipkartUrl:'https://www.flipkart.com/search?q=Nothing+Phone+2a',                 price: 23999, mrp: 29999, rating:4.4, reviews:6712 },
    { id:'S10', name:'Motorola Edge 50 Pro (256GB, Black Beauty)',     img:'https://m.media-amazon.com/images/I/61KU6-T-CQL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Motorola+Edge+50+Pro',             flipkartUrl:'https://www.flipkart.com/search?q=Motorola+Edge+50+Pro',             price: 31999, mrp: 39999, rating:4.2, reviews:2901 },
  ],

  headphones: [
    { id:'H01', name:'Sony WH-1000XM5 Wireless Noise Cancelling',     img:'https://m.media-amazon.com/images/I/61vJJNDRTfL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Sony+WH-1000XM5',                  flipkartUrl:'https://www.flipkart.com/search?q=Sony+WH-1000XM5',                  price: 26990, mrp: 34990, rating:4.7, reviews:12341 },
    { id:'H02', name:'Apple AirPods Pro (2nd Gen) with MagSafe',      img:'https://m.media-amazon.com/images/I/61SUj2aKoEL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Apple+AirPods+Pro+2nd+Gen',        flipkartUrl:'https://www.flipkart.com/search?q=Apple+AirPods+Pro+2',              price: 19900, mrp: 24900, rating:4.6, reviews:9823 },
    { id:'H03', name:'Bose QuietComfort 45 Wireless',                  img:'https://m.media-amazon.com/images/I/51jEJCSVqEL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Bose+QuietComfort+45',             flipkartUrl:'https://www.flipkart.com/search?q=Bose+QuietComfort+45',             price: 24990, mrp: 32990, rating:4.6, reviews:4521 },
    { id:'H04', name:'boAt Rockerz 550 Wireless (Black)',              img:'https://m.media-amazon.com/images/I/51MdQcREukL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=boAt+Rockerz+550',                 flipkartUrl:'https://www.flipkart.com/search?q=boAt+Rockerz+550',                 price:  1299, mrp:  4990, rating:4.1, reviews:87234 },
    { id:'H05', name:'Samsung Galaxy Buds2 Pro (Graphite)',            img:'https://m.media-amazon.com/images/I/51KRF5RQJEL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+Galaxy+Buds2+Pro',         flipkartUrl:'https://www.flipkart.com/search?q=Samsung+Galaxy+Buds2+Pro',         price:  9999, mrp: 17999, rating:4.4, reviews:6712 },
    { id:'H06', name:'JBL Tour One M2 Wireless ANC',                  img:'https://m.media-amazon.com/images/I/71pQTHc+mPL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=JBL+Tour+One+M2',                  flipkartUrl:'https://www.flipkart.com/search?q=JBL+Tour+One+M2',                  price: 16999, mrp: 22999, rating:4.4, reviews:3421 },
    { id:'H07', name:'Realme Buds Air 5 Pro ANC',                     img:'https://m.media-amazon.com/images/I/51hfOXmJxAL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Realme+Buds+Air+5+Pro',            flipkartUrl:'https://www.flipkart.com/search?q=Realme+Buds+Air+5+Pro',            price:  3499, mrp:  5999, rating:4.2, reviews:15234 },
    { id:'H08', name:'Sennheiser Momentum 4 Wireless',                img:'https://m.media-amazon.com/images/I/61lsPbNQe0L._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Sennheiser+Momentum+4',            flipkartUrl:'https://www.flipkart.com/search?q=Sennheiser+Momentum+4',            price: 26990, mrp: 34990, rating:4.6, reviews:2134 },
    { id:'H09', name:'OnePlus Buds Pro 2 (Obsidian Black)',            img:'https://m.media-amazon.com/images/I/51mM-FmA2GL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=OnePlus+Buds+Pro+2',               flipkartUrl:'https://www.flipkart.com/search?q=OnePlus+Buds+Pro+2',               price:  6999, mrp: 11999, rating:4.3, reviews:7812 },
    { id:'H10', name:'boAt Airdopes 141 ANC TWS Earbuds',             img:'https://m.media-amazon.com/images/I/51bFSRxKGvL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=boAt+Airdopes+141',                flipkartUrl:'https://www.flipkart.com/search?q=boAt+Airdopes+141',                price:   799, mrp:  3990, rating:4.0, reviews:43210 },
  ],

  television: [
    { id:'T01', name:'Samsung 65" 4K QLED Smart TV (QN65Q80C)',       img:'https://m.media-amazon.com/images/I/91XUUOgWOCL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+65+QLED+4K',               flipkartUrl:'https://www.flipkart.com/search?q=Samsung+65+QLED',                  price: 89999, mrp:129999, rating:4.5, reviews:3412 },
    { id:'T02', name:'LG 55" OLED C3 4K Smart TV',                    img:'https://m.media-amazon.com/images/I/71M7p1CTASL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=LG+55+OLED+C3',                    flipkartUrl:'https://www.flipkart.com/search?q=LG+55+OLED+C3',                    price: 99990, mrp:149990, rating:4.7, reviews:2134 },
    { id:'T03', name:'Sony Bravia 50" 4K Google TV (X75L)',            img:'https://m.media-amazon.com/images/I/71SnoGsT+iL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Sony+Bravia+50+X75L',              flipkartUrl:'https://www.flipkart.com/search?q=Sony+Bravia+50+4K',                price: 58990, mrp: 79990, rating:4.5, reviews:4512 },
    { id:'T04', name:'Xiaomi 43" 4K Smart TV X Series',               img:'https://m.media-amazon.com/images/I/71rcALGaNvL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Xiaomi+43+4K+TV',                  flipkartUrl:'https://www.flipkart.com/search?q=Xiaomi+43+4K+TV',                  price: 27999, mrp: 39999, rating:4.2, reviews:18234 },
    { id:'T05', name:'TCL 55" QLED 4K Google TV (55C645)',             img:'https://m.media-amazon.com/images/I/81tAkQSgZAL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=TCL+55+QLED',                      flipkartUrl:'https://www.flipkart.com/search?q=TCL+55+QLED',                      price: 42990, mrp: 64990, rating:4.3, reviews:6712 },
    { id:'T06', name:'OnePlus 50" Y1S Pro 4K Smart TV',               img:'https://m.media-amazon.com/images/I/71wISfxQarL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=OnePlus+50+Y1S+Pro',               flipkartUrl:'https://www.flipkart.com/search?q=OnePlus+50+Y1S+Pro',               price: 29999, mrp: 44999, rating:4.2, reviews:5421 },
    { id:'T07', name:'Hisense 65" ULED 4K MiniLED TV (65U8K)',        img:'https://m.media-amazon.com/images/I/81cRzgFnHLL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Hisense+65+ULED',                  flipkartUrl:'https://www.flipkart.com/search?q=Hisense+65+ULED',                  price: 79990, mrp:109990, rating:4.4, reviews:1823 },
    { id:'T08', name:'Realme 43" 4K Smart TV (RMV2207)',               img:'https://m.media-amazon.com/images/I/61z7FGUML+L._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Realme+43+4K+Smart+TV',            flipkartUrl:'https://www.flipkart.com/search?q=Realme+43+4K+TV',                  price: 21999, mrp: 32999, rating:4.1, reviews:9823 },
    { id:'T09', name:'Samsung 32" HD Ready Smart Monitor TV',          img:'https://m.media-amazon.com/images/I/51B6oqmPvNL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+32+Smart+TV',              flipkartUrl:'https://www.flipkart.com/search?q=Samsung+32+Smart+TV',              price: 12990, mrp: 18990, rating:4.0, reviews:23412 },
    { id:'T10', name:'Vu 55" 4K Cinema TV (55CA)',                     img:'https://m.media-amazon.com/images/I/71tnXWXFuXL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Vu+55+Cinema+TV',                  flipkartUrl:'https://www.flipkart.com/search?q=Vu+55+Cinema+TV',                  price: 31999, mrp: 47999, rating:4.2, reviews:7123 },
  ],

  refrigerator: [
    { id:'R01', name:'Samsung 253L 3★ Double Door (RT28C3342S8)',      img:'https://m.media-amazon.com/images/I/71R1BjFmMRL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+253L+Double+Door',         flipkartUrl:'https://www.flipkart.com/search?q=Samsung+253L+Double+Door',         price: 24490, mrp: 33490, rating:4.3, reviews:4512 },
    { id:'R02', name:'LG 655L Side-by-Side (GC-B257KQYA)',             img:'https://m.media-amazon.com/images/I/71TrJj3BEjL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=LG+655L+Side+by+Side',             flipkartUrl:'https://www.flipkart.com/search?q=LG+655L+Side+by+Side',             price: 79990, mrp:105000, rating:4.5, reviews:1823 },
    { id:'R03', name:'Whirlpool 215L 5★ Single Door (230 IMPWCOOL)',   img:'https://m.media-amazon.com/images/I/61sNz49TRFL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Whirlpool+215L+Single+Door',       flipkartUrl:'https://www.flipkart.com/search?q=Whirlpool+215L+Single+Door',       price: 16490, mrp: 23590, rating:4.2, reviews:12341 },
    { id:'R04', name:'Haier 320L 3★ Double Door (HRB-3404BS-E)',       img:'https://m.media-amazon.com/images/I/61xVQ+zWCCL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Haier+320L+Double+Door',           flipkartUrl:'https://www.flipkart.com/search?q=Haier+320L+Double+Door',           price: 27990, mrp: 38990, rating:4.1, reviews:6712 },
    { id:'R05', name:'Godrej 564L French Door (RF EON 564B RCZIT)',    img:'https://m.media-amazon.com/images/I/71P4DvPkXoL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Godrej+French+Door+Refrigerator', flipkartUrl:'https://www.flipkart.com/search?q=Godrej+French+Door+Refrigerator', price: 64990, mrp: 84990, rating:4.4, reviews:987  },
    { id:'R06', name:'Bosch 364L 3★ Multi Door (KMF46SB30I)',          img:'https://m.media-amazon.com/images/I/61tSFHaQlnL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Bosch+364L+Multi+Door',            flipkartUrl:'https://www.flipkart.com/search?q=Bosch+364L+Multi+Door',            price: 59990, mrp: 75990, rating:4.5, reviews:1456 },
    { id:'R07', name:'Voltas Beko 340L 3★ Double Door (RFF375IF)',     img:'https://m.media-amazon.com/images/I/61BHmPLWMFL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Voltas+Beko+340L',                 flipkartUrl:'https://www.flipkart.com/search?q=Voltas+Beko+340L',                 price: 29990, mrp: 40990, rating:4.2, reviews:2341 },
    { id:'R08', name:'Samsung 324L 2★ Double Door (RT37T4633S8)',      img:'https://m.media-amazon.com/images/I/71R1BjFmMRL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Samsung+324L+Double+Door',         flipkartUrl:'https://www.flipkart.com/search?q=Samsung+324L+Double+Door',         price: 31490, mrp: 42490, rating:4.2, reviews:8901 },
    { id:'R09', name:'LG 190L 5★ Single Door (GL-D201ABEU)',           img:'https://m.media-amazon.com/images/I/61d+7mJUWmL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=LG+190L+Single+Door',              flipkartUrl:'https://www.flipkart.com/search?q=LG+190L+Single+Door',              price: 17990, mrp: 24990, rating:4.3, reviews:15234 },
    { id:'R10', name:'Panasonic 338L 3★ Double Door (NR-BC371VKX1)',   img:'https://m.media-amazon.com/images/I/61cJj0zYWVL._SL1500_.jpg',  amazonUrl:'https://www.amazon.in/s?k=Panasonic+338L+Double+Door',       flipkartUrl:'https://www.flipkart.com/search?q=Panasonic+338L+Double+Door',       price: 29990, mrp: 41990, rating:4.2, reviews:3412 },
  ],
};

/* ── SEARCH ─────────────────────────────────────────────────── */
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json({ results: [], query: '' });

  let key = Object.keys(catalogue).find(k => q.includes(k) || k.includes(q));
  if (!key) {
    const synonyms = { phone:'smartphone', mobile:'smartphone', iphone:'smartphone', samsung:'smartphone', fridge:'refrigerator', tv:'television', earphone:'headphones', earbud:'headphones', headset:'headphones' };
    for (const [syn, cat] of Object.entries(synonyms)) {
      if (q.includes(syn)) { key = cat; break; }
    }
  }
  if (!key) {
    for (const w of q.split(' ')) {
      key = Object.keys(catalogue).find(k => k.includes(w) || w.includes(k));
      if (key) break;
    }
  }
  if (!key) return res.json({ results: [], query: q, message: 'Try: laptop, smartphone, headphones, television, refrigerator' });

  const results = catalogue[key].map(p => ({
    ...p,
    discount: Math.round(((p.mrp - p.price) / p.mrp) * 100)
  }));

  res.json({ results, query: q, category: key, total: results.length });
});

app.get('/api/categories', (req, res) => {
  res.json({
    categories: [
      { key: 'laptop',       label: 'Laptops',        icon: '💻', count: 10, desc: 'Ultrabooks, Gaming, Business' },
      { key: 'smartphone',   label: 'Smartphones',    icon: '📱', count: 10, desc: 'iPhone, Android, 5G'          },
      { key: 'headphones',   label: 'Headphones',     icon: '🎧', count: 10, desc: 'ANC, TWS, Over-ear'           },
      { key: 'television',   label: 'Televisions',    icon: '📺', count: 10, desc: '4K, OLED, QLED Smart TVs'     },
      { key: 'refrigerator', label: 'Refrigerators',  icon: '❄️', count: 10, desc: 'Single, Double, Side-by-Side' },
    ]
  });
});

/* ── AUTH ───────────────────────────────────────────────────── */
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (users[email]) return res.status(409).json({ error: 'Email already registered' });
  users[email] = { name, email, password, orders: [] };
  res.json({ success: true, user: { name, email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const u = users[email];
  if (!u || u.password !== password) return res.status(401).json({ error: 'Invalid email or password' });
  res.json({ success: true, user: { name: u.name, email: u.email } });
});

/* ── ORDERS ─────────────────────────────────────────────────── */
app.post('/api/order', (req, res) => {
  const { email, productId, productName, store, price, paymentMethod, cardLast4, upiId, bankName } = req.body;
  const orderId = 'PS' + (++oid);
  const order = {
    orderId, productId, productName, store, price, paymentMethod,
    cardLast4: cardLast4 || null, upiId: upiId || null, bankName: bankName || null,
    status: 'Confirmed',
    placedAt: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
  };
  orders[orderId] = order;
  if (email && users[email]) users[email].orders.push(orderId);
  res.json({ success: true, order });
});

app.get('/api/orders/:email', (req, res) => {
  const u = users[req.params.email];
  if (!u) return res.status(404).json({ error: 'Not found' });
  res.json({ orders: u.orders.map(id => orders[id]).filter(Boolean).reverse() });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`\n🚀  PriceScout → http://localhost:${PORT}\n`));