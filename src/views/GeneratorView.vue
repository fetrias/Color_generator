<template>
  <div class="generator-view">
    <div class="generator-controls">
      <h2>Настройки генерации</h2>
      <!-- Выбор базового цвета -->
      <div class="control-group">
        <label>Базовый цвет:</label>
        <input type="color" v-model="baseColor" class="color-picker">
        <span class="color-value">{{ baseColor }}</span>
      </div>
      <!-- Тип палитры -->
      <div class="control-group">
        <label>Тип палитры:</label>
        <select v-model="paletteType" class="select-input">
          <option value="analogous">Аналогичная</option>
          <option value="monochromatic">Монохромная</option>
          <option value="triadic">Триада</option>
          <option value="complementary">Комплементарная</option>
        </select>
      </div>
      <!-- Настроение -->
      <div class="control-group">
        <label>Настроение:</label>
        <select v-model="mood" class="select-input">
          <option value="calm">Спокойное</option>
          <option value="energetic">Энергичное</option>
          <option value="professional">Профессиональное</option>
        </select>
      </div>
      <!-- Количество цветов -->
      <div class="control-group">
        <label>Количество цветов:</label>
        <select v-model.number="colorCount" class="select-input">
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="7">7</option>
        </select>
      </div>
      <!-- Формат отображения -->
      <div class="control-group">
        <label>Формат:</label>
        <select v-model="colorFormat" class="select-input">
          <option value="hex">HEX</option>
          <option value="rgb">RGB</option>
        </select>
      </div>
      <button @click="generatePalette" class="generate-button">
        Сгенерировать палитру
      </button>
    </div>
    <!-- Палитра -->
    <div class="palette-section">
      <h2>Цветовая палитра</h2>
      <div v-if="showCopyNotification" class="notification">
        {{ copiedColor }}
      </div>
      <div class="palette">
        <div 
          v-for="(color, index) in palette" 
          :key="index"
          class="color-card"
          :style="{ backgroundColor: color.hex }"
          @click="copyToClipboard(color)"
        >
          <button 
            @click.stop="toggleLock(index)" 
            class="lock-button"
            :class="{ locked: color.locked }"
          >
            <span class="lock-icon">{{ color.locked ? '🔒' : '🔓' }}</span>
          </button>
          <div class="color-info">
            <span class="color-value">{{ getColorValue(color) }}</span>
          </div>
        </div>
      </div>
      <!-- Анализ доступности -->
      <div class="accessibility-section">
        <h3>Анализ доступности</h3>
        <!-- Цветовой круг Иттена -->
        <div class="color-wheel-container">
          <h4>Цветовой круг</h4>
          <svg class="color-wheel" viewBox="0 0 240 240" width="240" height="240">
            <defs>
              <!-- Градиенты для сегментов -->
              <clipPath v-for="i in 12" :key="'clip-' + i" :id="'segment-' + i">
                <path :d="getSegmentPath(i - 1)" />
              </clipPath>
            </defs>
            <!-- 12 сегментов круга Иттена -->
            <g v-for="i in 12" :key="'color-' + i">
              <path 
                :d="getSegmentPath(i - 1)"
                :fill="getIttenColor(i - 1)"
                stroke="white"
                stroke-width="2"
              />
            </g>
            <!-- Центральный круг -->
            <circle cx="120" cy="120" r="35" fill="white" stroke="#ddd" stroke-width="2" />
            <!-- Точки для цветов палитры -->
            <g v-for="(color, index) in palette" :key="'point-' + index">
              <circle 
                :cx="getWheelX(color.hex)" 
                :cy="getWheelY(color.hex)" 
                r="8" 
                :fill="color.hex" 
                stroke="white" 
                stroke-width="3"
              />
              <text 
                :x="getWheelX(color.hex)" 
                :y="getWheelY(color.hex) + 4" 
                text-anchor="middle" 
                font-size="12" 
                font-weight="bold"
                fill="white"
                style="pointer-events: none;"
              >{{ index + 1 }}</text>
            </g>
          </svg>
          <p class="wheel-hint">Цифры показывают позицию цветов на цветовом круге</p>
        </div>
        <!-- Контрастность -->
        <h4>Контрастность (WCAG)</h4>
        <div class="contrast-grid">
          <div 
            v-for="(result, index) in contrastResults" 
            :key="index"
            class="contrast-item"
          >
            <div class="contrast-colors">
              <span class="color-sample" :style="{ backgroundColor: result.color1 }"></span>
              <span>×</span>
              <span class="color-sample" :style="{ backgroundColor: result.color2 }"></span>
            </div>
            <div class="contrast-ratio">{{ result.ratio }}</div>
            <div class="contrast-level" :class="result.level">
              {{ result.levelText }}
            </div>
          </div>
        </div>
      </div>
      <!-- Сохранение палитры -->
      <div class="save-section">
        <input 
          v-model="paletteName" 
          placeholder="Название палитры" 
          class="palette-name-input"
        >
        <button @click="savePalette" class="save-button">
          Сохранить в библиотеку
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, computed, watch, onMounted } from 'vue'
export default {
  name: 'GeneratorView',
  setup() {
    const baseColor = ref('#3498db')
    const paletteType = ref('analogous')
    const mood = ref('calm')
    const colorCount = ref(5)
    const colorFormat = ref('hex')
    const palette = ref([])
    const showCopyNotification = ref(false)
    const copiedColor = ref('')
    const paletteName = ref('')
    const hexToHsl = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2
      if (max === min) {
        h = s = 0
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
          case g: h = ((b - r) / d + 2) / 6; break
          case b: h = ((r - g) / d + 4) / 6; break
        }
      }
      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      }
    }
    const hslToHex = (h, s, l) => {
      l /= 100
      const a = s * Math.min(l, 1 - l) / 100
      const f = n => {
        const k = (n + h / 30) % 12
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
        return Math.round(255 * color).toString(16).padStart(2, '0')
      }
      return `#${f(0)}${f(8)}${f(4)}`
    }
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }
    const getTextColor = (hexColor) => {
      const rgb = hexToRgb(hexColor)
      const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
      return brightness > 128 ? '#000000' : '#ffffff'
    }
    const generatePalette = () => {
      const base = hexToHsl(baseColor.value)
      const colors = []
      let saturationMod = 0
      let lightnessMod = 0
      if (mood.value === 'calm') {
        saturationMod = -20
        lightnessMod = 10
      } else if (mood.value === 'energetic') {
        saturationMod = 20
        lightnessMod = -5
      } else if (mood.value === 'professional') {
        saturationMod = -10
        lightnessMod = -10
      }
      colors.push(baseColor.value)
      const randomVariation = () => Math.random() * 10 - 5
      if (paletteType.value === 'analogous') {
        for (let i = 1; i < colorCount.value; i++) {
          const hueShift = (i % 2 === 0 ? (i * 15) : -(i * 15)) + randomVariation()
          const hue = (base.h + hueShift + 360) % 360
          const saturation = Math.max(50, Math.min(100, base.s + saturationMod + randomVariation()))
          const lightness = (i % 2 === 0 ? 20 : 80) + randomVariation()
          colors.push(hslToHex(hue, saturation, Math.max(15, Math.min(90, lightness))))
        }
      } else if (paletteType.value === 'monochromatic') {
        for (let i = 1; i < colorCount.value; i++) {
          const saturation = Math.max(50, Math.min(100, base.s + saturationMod + randomVariation()))
          const lightness = (i % 2 === 0 ? 15 : 85) + randomVariation()
          colors.push(hslToHex(base.h, saturation, Math.max(10, Math.min(95, lightness))))
        }
      } else if (paletteType.value === 'triadic') {
        for (let i = 1; i < colorCount.value; i++) {
          const hue = (base.h + (Math.floor(i / Math.ceil(colorCount.value / 3)) * 120) + randomVariation()) % 360
          const saturation = Math.max(50, Math.min(100, base.s + saturationMod + randomVariation()))
          const lightness = (i % 2 === 0 ? 20 : 80) + randomVariation()
          colors.push(hslToHex(hue, saturation, Math.max(15, Math.min(90, lightness))))
        }
      } else if (paletteType.value === 'complementary') {
        for (let i = 1; i < colorCount.value; i++) {
          const hue = (i % 2 === 0 ? base.h : (base.h + 180)) % 360
          const saturation = Math.max(50, Math.min(100, base.s + saturationMod + randomVariation()))
          const lightness = (i % 2 === 0 ? 15 : 85) + randomVariation()
          colors.push(hslToHex(hue, saturation, Math.max(10, Math.min(95, lightness))))
        }
      }
      const newPalette = []
      for (let i = 0; i < colorCount.value; i++) {
        if (palette.value[i]?.locked) {
          newPalette.push(palette.value[i])
        } else {
          const hex = colors[i]
          newPalette.push({
            hex,
            rgb: hexToRgb(hex),
            locked: false
          })
        }
      }
      palette.value = newPalette
      localStorage.setItem('currentPalette', JSON.stringify(palette.value))
    }
    const calculateContrast = (hex1, hex2) => {
      const getLuminance = (hex) => {
        const rgb = hexToRgb(hex)
        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
          val = val / 255
          return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const lum1 = getLuminance(hex1)
      const lum2 = getLuminance(hex2)
      const brightest = Math.max(lum1, lum2)
      const darkest = Math.min(lum1, lum2)
      return ((brightest + 0.05) / (darkest + 0.05)).toFixed(2)
    }
    const contrastResults = computed(() => {
      if (palette.value.length < 2) return []
      const results = []
      for (let i = 0; i < palette.value.length - 1; i++) {
        const ratio = calculateContrast(palette.value[i].hex, palette.value[i + 1].hex)
        let level = 'fail'
        let levelText = 'Недостаточно'
        if (ratio >= 7) {
          level = 'aaa'
          levelText = 'AAA'
        } else if (ratio >= 4.5) {
          level = 'aa'
          levelText = 'AA'
        }
        results.push({
          color1: palette.value[i].hex,
          color2: palette.value[i + 1].hex,
          ratio: ratio + ':1',
          level,
          levelText
        })
      }
      return results
    })
    const getColorValue = (color) => {
      if (colorFormat.value === 'hex') {
        return color.hex.toUpperCase()
      } else {
        return `rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`
      }
    }
    const getIttenColor = (index) => {
      const colors = [
        '#FF0000',
        '#FF8000',
        '#FFFF00',
        '#80FF00',
        '#00FF00',
        '#00FF80',
        '#00FFFF',
        '#0080FF',
        '#0000FF',
        '#8000FF',
        '#FF00FF',
        '#FF0080'
      ]
      return colors[index]
    }
    const getSegmentPath = (index) => {
      const centerX = 120
      const centerY = 120
      const radius = 95
      const angleStep = 30
      const startAngle = index * angleStep - 90
      const endAngle = startAngle + angleStep
      const startRad = startAngle * (Math.PI / 180)
      const endRad = endAngle * (Math.PI / 180)
      const x1 = centerX + radius * Math.cos(startRad)
      const y1 = centerY + radius * Math.sin(startRad)
      const x2 = centerX + radius * Math.cos(endRad)
      const y2 = centerY + radius * Math.sin(endRad)
      return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`
    }
    const getWheelX = (hex) => {
      const hsl = hexToHsl(hex)
      const angle = (hsl.h - 90) * (Math.PI / 180)
      return 120 + 75 * Math.cos(angle)
    }
    const getWheelY = (hex) => {
      const hsl = hexToHsl(hex)
      const angle = (hsl.h - 90) * (Math.PI / 180)
      return 120 + 75 * Math.sin(angle)
    }
    const copyToClipboard = (color) => {
      const value = getColorValue(color)
      navigator.clipboard.writeText(value).then(() => {
        copiedColor.value = value
        showCopyNotification.value = true
        setTimeout(() => {
          showCopyNotification.value = false
        }, 2000)
      })
    }
    const toggleLock = (index) => {
      palette.value[index].locked = !palette.value[index].locked
      localStorage.setItem('currentPalette', JSON.stringify(palette.value))
    }
    const savePalette = () => {
      if (!paletteName.value.trim()) {
        copiedColor.value = 'Введите название палитры'
        showCopyNotification.value = true
        setTimeout(() => {
          showCopyNotification.value = false
        }, 2000)
        return
      }
      const savedPalettes = JSON.parse(localStorage.getItem('savedPalettes') || '[]')
      savedPalettes.push({
        id: Date.now(),
        name: paletteName.value,
        colors: palette.value.map(c => c.hex),
        type: paletteType.value,
        mood: mood.value,
        createdAt: new Date().toISOString()
      })
      localStorage.setItem('savedPalettes', JSON.stringify(savedPalettes))
      copiedColor.value = `Палитра "${paletteName.value}" сохранена`
      showCopyNotification.value = true
      paletteName.value = ''
      setTimeout(() => {
        showCopyNotification.value = false
      }, 3000)
    }
    const loadSavedPalette = () => {
      const saved = localStorage.getItem('currentPalette')
      if (saved) {
        palette.value = JSON.parse(saved)
      } else {
        generatePalette()
      }
    }
    onMounted(() => {
      const urlParams = new URLSearchParams(window.location.search)
      const colors = urlParams.get('colors')
      if (colors) {
        const colorArray = colors.split('-').map(c => '#' + c)
        palette.value = colorArray.map(hex => ({
          hex,
          rgb: hexToRgb(hex),
          locked: false
        }))
        localStorage.setItem('currentPalette', JSON.stringify(palette.value))
      } else {
        loadSavedPalette()
      }
    })
    return {
      baseColor,
      paletteType,
      mood,
      colorCount,
      colorFormat,
      palette,
      showCopyNotification,
      copiedColor,
      paletteName,
      contrastResults,
      generatePalette,
      getColorValue,
      getIttenColor,
      getSegmentPath,
      getWheelX,
      getWheelY,
      copyToClipboard,
      toggleLock,
      savePalette
    }
  }
}
</script>
<style scoped>
.generator-view {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}
.generator-controls {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.generator-controls h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}
.control-group {
  margin-bottom: 1.5rem;
}
.control-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #34495e;
}
.color-picker {
  width: 80px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
}
.color-value {
  margin-left: 1rem;
  font-family: monospace;
  color: #666;
}
.select-input {
  width: 100%;
  padding: 0.5rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.generate-button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #34a853 0%, #0f9d58 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}
.generate-button:hover {
  transform: translateY(-2px);
}
.palette-section {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.palette-section h2 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}
.notification {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  color: #28a745;
  padding: 20px 40px;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  animation: fadeIn 0.3s ease;
  z-index: 1000;
  font-size: 1.1rem;
  font-weight: 600;
}
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 2rem;
  min-height: 200px;
}
.color-card {
  flex: 1;
  min-width: 120px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding: 15px;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  position: relative;
}
.color-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}
.lock-button {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  padding: 8px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  z-index: 10;
}
.lock-button:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
.lock-icon {
  font-size: 18px;
}
.color-info {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 8px 12px;
  border-radius: 6px;
}
.color-value {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}
.accessibility-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #eee;
}
.accessibility-section h3 {
  margin-bottom: 1.5rem;
  color: #2c3e50;
}
.accessibility-section h4 {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: #34495e;
  font-size: 1rem;
}
.color-wheel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
}
.color-wheel {
  margin: 1rem 0;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,0.1));
}
.wheel-hint {
  color: #666;
  font-size: 0.85rem;
  text-align: center;
  margin-top: 0.5rem;
}
.contrast-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.contrast-item {
  padding: 1rem;
  border: 2px solid #eee;
  border-radius: 8px;
  text-align: center;
}
.contrast-colors {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.color-sample {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 2px solid #ddd;
}
.contrast-ratio {
  font-weight: bold;
  font-size: 1.2rem;
  margin: 0.5rem 0;
}
.contrast-level {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-weight: 600;
  font-size: 0.9rem;
}
.contrast-level.aaa {
  background-color: #d4edda;
  color: #155724;
}
.contrast-level.aa {
  background-color: #fff3cd;
  color: #856404;
}
.contrast-level.fail {
  background-color: #f8d7da;
  color: #721c24;
}
.save-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #eee;
  display: flex;
  gap: 1rem;
}
.palette-name-input {
  flex: 1;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}
.save-button {
  padding: 0.75rem 2rem;
  background: #34a853;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.save-button:hover {
  background: #2d8e47;
}
@media (max-width: 1024px) {
  .generator-view {
    grid-template-columns: 1fr;
  }
}
</style>
