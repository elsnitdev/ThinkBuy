import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const OUT = process.argv[2]
mkdirSync(OUT, { recursive: true })

/** Bàn phím vẽ theo phối cảnh: hàng dưới rộng và cao hơn hàng trên */
function keyboard(keyColor, glow) {
  const rows = [
    { y: 182, x0: 80, x1: 320, n: 14, h: 6 },
    { y: 190, x0: 77, x1: 323, n: 14, h: 6.4 },
    { y: 198.5, x0: 73, x1: 327, n: 13, h: 6.8 },
  ]
  let out = ''
  if (glow) {
    // Đèn nền: quầng toả mềm, KHÔNG dùng hình chữ nhật đặc —
    // hình chữ nhật cho ra một thanh màu chứ không ra ánh sáng.
    out += `<ellipse cx="200" cy="194" rx="140" ry="19" fill="url(#glow)"/>`
  }
  for (const r of rows) {
    const span = r.x1 - r.x0
    const gap = 1.8
    const w = (span - gap * (r.n - 1)) / r.n
    for (let i = 0; i < r.n; i++) {
      const x = (r.x0 + i * (w + gap)).toFixed(1)
      out += `<rect x="${x}" y="${r.y}" width="${w.toFixed(1)}" height="${r.h}" rx="1.2" fill="${keyColor}"/>`
    }
  }
  return out
}

function laptop({
  chassis,
  chassisDark,
  bezel,
  keyColor,
  glow,
  screen,
  vents,
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="Minh hoạ laptop">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${screen[0]}"/><stop offset="100%" stop-color="${screen[1]}"/>
</linearGradient>
<linearGradient id="d" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${chassis}"/><stop offset="100%" stop-color="${chassisDark}"/>
</linearGradient>
${
  glow
    ? `<radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
<stop offset="0%" stop-color="${glow}" stop-opacity="0.85"/>
<stop offset="55%" stop-color="${glow}" stop-opacity="0.45"/>
<stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
</radialGradient>`
    : ''
}
</defs>

<ellipse cx="200" cy="243" rx="152" ry="10" fill="${chassisDark}" opacity="0.13"/>

<!-- Nắp màn hình -->
<rect x="82" y="24" width="236" height="148" rx="9" fill="${chassis}"/>
<rect x="86" y="28" width="228" height="140" rx="7" fill="${bezel}"/>
<rect x="92" y="34" width="216" height="122" rx="2.5" fill="url(#s)"/>
<!-- Vệt sáng trên mặt kính -->
<path d="M92 142 L152 34 L186 34 L110 156 Z" fill="#fff" opacity="0.06"/>
<circle cx="200" cy="31" r="1.9" fill="${chassisDark}" opacity="0.85"/>
<rect x="176" y="159" width="48" height="3" rx="1.5" fill="${chassisDark}" opacity="0.5"/>

<!-- Chiếu nghỉ tay: cao hơn để bàn phím và touchpad có chỗ thở -->
<path d="M64 172 H336 A5 5 0 0 1 340.7 175.4 L353 229 A4 4 0 0 1 349.2 234.5 H50.8 A4 4 0 0 1 47 229 L59.3 175.4 A5 5 0 0 1 64 172 Z" fill="url(#d)"/>
${keyboard(keyColor, glow)}
<!-- Touchpad -->
<rect x="166" y="210" width="68" height="15" rx="2.5" fill="${chassisDark}" opacity="0.75"/>
<rect x="167.5" y="211.5" width="65" height="12" rx="2" fill="${keyColor}" opacity="0.35"/>
<!-- Rãnh mở nắp -->
<rect x="185" y="172" width="30" height="2.5" rx="1.25" fill="${chassisDark}"/>
${vents ? `<rect x="86" y="226" width="40" height="4" rx="2" fill="${chassisDark}" opacity="0.65"/><rect x="274" y="226" width="40" height="4" rx="2" fill="${chassisDark}" opacity="0.65"/>` : ''}
</svg>
`
}

/** Góc 2 — nắp đóng, nhìn từ trên xuống */
function topView({ chassis, chassisDark, keyColor, vents }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="Minh hoạ laptop nhìn từ trên">
<defs><linearGradient id="t" x1="0" y1="0" x2="0.6" y2="1">
<stop offset="0%" stop-color="${chassis}"/><stop offset="100%" stop-color="${chassisDark}"/>
</linearGradient></defs>
<ellipse cx="200" cy="242" rx="140" ry="10" fill="${chassisDark}" opacity="0.13"/>
<rect x="66" y="52" width="268" height="186" rx="12" fill="url(#t)"/>
<rect x="74" y="60" width="252" height="170" rx="8" fill="${chassisDark}" opacity="0.18"/>
<!-- Dấu hiệu hãng ở giữa nắp -->
<rect x="176" y="134" width="48" height="7" rx="3.5" fill="${keyColor}" opacity="0.65"/>
<rect x="176" y="147" width="30" height="4" rx="2" fill="${keyColor}" opacity="0.4"/>
${vents ? `<rect x="120" y="228" width="60" height="4" rx="2" fill="${chassisDark}" opacity="0.55"/><rect x="220" y="228" width="60" height="4" rx="2" fill="${chassisDark}" opacity="0.55"/>` : ''}
</svg>
`
}

/** Góc 3 — cạnh bên, thấy độ mỏng và cổng kết nối */
function sideView({ chassis, chassisDark, keyColor }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="400" height="300" role="img" aria-label="Minh hoạ cạnh bên laptop">
<ellipse cx="200" cy="182" rx="146" ry="8" fill="${chassisDark}" opacity="0.13"/>
<!-- Thân máy dạng nêm: mỏng phía trước, dày phía sau -->
<path d="M58 172 L342 172 A5 5 0 0 0 347 167 L347 143 A6 6 0 0 0 341 137 L64 152 A7 7 0 0 0 58 159 Z" fill="${chassis}"/>
<path d="M58 172 L342 172 A5 5 0 0 0 347 167 L347 162 L58 166 Z" fill="${chassisDark}"/>
<!-- Cổng kết nối -->
<rect x="110" y="156" width="22" height="6" rx="1.5" fill="${chassisDark}"/>
<rect x="142" y="157" width="13" height="5" rx="2.5" fill="${chassisDark}"/>
<rect x="165" y="157" width="13" height="5" rx="2.5" fill="${chassisDark}"/>
<rect x="250" y="154" width="26" height="7" rx="1.5" fill="${chassisDark}"/>
<circle cx="300" cy="157" r="3.4" fill="${chassisDark}"/>
<!-- Khe thoát nhiệt -->
<g fill="${keyColor}" opacity="0.5">
<rect x="196" y="156" width="3" height="6" rx="1.5"/><rect x="203" y="156" width="3" height="6" rx="1.5"/>
<rect x="210" y="156" width="3" height="6" rx="1.5"/><rect x="217" y="155" width="3" height="6" rx="1.5"/>
</g>
</svg>
`
}

const VARIANTS = {
  // Gaming: vỏ tối, quầng sáng bàn phím, khe tản nhiệt hai bên
  gaming: {
    chassis: '#2c3140',
    chassisDark: '#1b1f2b',
    bezel: '#14171f',
    keyColor: '#3d4354',
    glow: '#0058e1',
    screen: ['#2f4d8f', '#101a33'],
    vents: true,
  },
  // Ultrabook: nhôm bạc, mỏng, sạch
  ultrabook: {
    chassis: '#cdd4dd',
    chassisDark: '#9aa4b2',
    bezel: '#2a2f38',
    keyColor: '#8b95a4',
    glow: null,
    screen: ['#5b8bd0', '#22406e'],
    vents: false,
  },
  // MacBook: bạc sáng, viền mảnh
  macbook: {
    chassis: '#dfe3e8',
    chassisDark: '#adb5bf',
    bezel: '#20242b',
    keyColor: '#4a5058',
    glow: null,
    screen: ['#7fa8dd', '#2d4f80'],
    vents: false,
  },
  // Đồ hoạ: màn hình rực màu như đang chấm màu
  creator: {
    chassis: '#3a3f4b',
    chassisDark: '#252932',
    bezel: '#171a21',
    keyColor: '#4d5462',
    glow: null,
    screen: ['#c2557a', '#2f5fa8'],
    vents: false,
  },
  // Văn phòng: navy trầm, nghiêm túc
  office: {
    chassis: '#3c4557',
    chassisDark: '#232a38',
    bezel: '#171b25',
    keyColor: '#505a6d',
    glow: null,
    screen: ['#6d8fbf', '#2a3f60'],
    vents: false,
  },
  // Phổ thông: xám nhạt, đơn giản
  budget: {
    chassis: '#b8bfc9',
    chassisDark: '#8d95a1',
    bezel: '#262a32',
    keyColor: '#7c8492',
    glow: null,
    screen: ['#7ba0c9', '#3a577a'],
    vents: false,
  },
}

for (const [name, cfg] of Object.entries(VARIANTS)) {
  for (const [suffix, render] of [
    ['', laptop],
    ['-top', topView],
    ['-side', sideView],
  ]) {
    const file = join(OUT, `${name}${suffix}.svg`)
    writeFileSync(file, render(cfg), 'utf8')
    console.log('viết', file)
  }
}
