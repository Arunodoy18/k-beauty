const sharp = require("sharp")
const fs = require("fs")
const path = require("path")

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconDir = path.join(process.cwd(), "public", "icons")

if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir, { recursive: true })

async function generateIcon(size) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#0D0608" rx="${size * 0.22}"/>
      <text
        x="50%" y="54%"
        font-family="serif"
        font-size="${size * 0.38}px"
        fill="#C49A6C"
        text-anchor="middle"
        dominant-baseline="middle"
        font-weight="300"
        letter-spacing="${size * 0.02}"
      >MG</text>
    </svg>
  `
  await sharp(Buffer.from(svg)).png().toFile(path.join(iconDir, `icon-${size}.png`))
  console.log(`Generated icon-${size}.png`)
}

async function main() {
  for (const size of sizes) {
    await generateIcon(size)
  }
  console.log("All icons generated!")
}

main()
