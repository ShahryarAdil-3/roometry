// High-quality textures and materials for realistic rendering

// Wood textures
const woodTextures = {
  oak: {
    color: '#8c6a4f',
    roughness: 0.5,
    metalness: 0.05,
    textureUrl: 'https://images.unsplash.com/photo-1594025162989-48624572f696?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  pine: {
    color: '#a37d4f',
    roughness: 0.6,
    metalness: 0.03,
    textureUrl: 'https://images.unsplash.com/photo-1595514521493-a51746734264?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  walnut: {
    color: '#4a3a2a',
    roughness: 0.4,
    metalness: 0.08,
    textureUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  maple: {
    color: '#c4a882',
    roughness: 0.55,
    metalness: 0.04,
    textureUrl: 'https://images.unsplash.com/photo-1594025162989-48624572f696?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  cherry: {
    color: '#6b4a3e',
    roughness: 0.45,
    metalness: 0.06,
    textureUrl: 'https://images.unsplash.com/photo-1595514521493-a51746734264?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  }
}

// Stone and Marble textures
const stoneTextures = {
  marble: {
    color: '#f5f5f5',
    roughness: 0.3,
    metalness: 0.1,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  },
  granite: {
    color: '#5a5a5a',
    roughness: 0.4,
    metalness: 0.05,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  },
  limestone: {
    color: '#e8e0d6',
    roughness: 0.6,
    metalness: 0.03,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  },
  slate: {
    color: '#3a3a3a',
    roughness: 0.5,
    metalness: 0.05,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  }
}

// Metal textures
const metalTextures = {
  stainlessSteel: {
    color: '#c0c0c0',
    roughness: 0.1,
    metalness: 0.9,
    textureUrl: null,
    normalMap: false,
    repeat: [1, 1]
  },
  brushedSteel: {
    color: '#a0a0a0',
    roughness: 0.3,
    metalness: 0.8,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  copper: {
    color: '#cd7f32',
    roughness: 0.2,
    metalness: 0.85,
    textureUrl: null,
    normalMap: false,
    repeat: [1, 1]
  },
  brass: {
    color: '#b8860b',
    roughness: 0.3,
    metalness: 0.8,
    textureUrl: null,
    normalMap: false,
    repeat: [1, 1]
  },
  gold: {
    color: '#ffd700',
    roughness: 0.1,
    metalness: 0.95,
    textureUrl: null,
    normalMap: false,
    repeat: [1, 1]
  }
}

// Fabric textures
const fabricTextures = {
  leather: {
    color: '#4a3a2a',
    roughness: 0.8,
    metalness: 0.02,
    textureUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  velvet: {
    color: '#6b4a3e',
    roughness: 0.9,
    metalness: 0.01,
    textureUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  linen: {
    color: '#f5f0e8',
    roughness: 0.95,
    metalness: 0,
    textureUrl: 'https://images.unsplash.com/photo-1594025162989-48624572f696?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  cotton: {
    color: '#ffffff',
    roughness: 0.95,
    metalness: 0,
    textureUrl: 'https://images.unsplash.com/photo-1594025162989-48624572f696?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  }
}

// Floor textures
const floorTextures = {
  hardwood: {
    color: '#6a5a4a',
    roughness: 0.4,
    metalness: 0.05,
    textureUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  },
  tile: {
    color: '#d8d8d8',
    roughness: 0.3,
    metalness: 0.08,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  },
  carpet: {
    color: '#8a7260',
    roughness: 0.95,
    metalness: 0,
    textureUrl: 'https://images.unsplash.com/photo-1594025162989-48624572f696?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  },
  concrete: {
    color: '#a8a8a8',
    roughness: 0.7,
    metalness: 0.05,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 3]
  }
}

// Wall textures
const wallTextures = {
  drywall: {
    color: '#ffffff',
    roughness: 0.7,
    metalness: 0.02,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  brick: {
    color: '#8a4a2a',
    roughness: 0.6,
    metalness: 0.03,
    textureUrl: 'https://images.unsplash.com/photo-1594025162989-48624572f696?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [3, 2]
  },
  wallpaper: {
    color: '#f5f0e8',
    roughness: 0.5,
    metalness: 0.02,
    textureUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  },
  plaster: {
    color: '#f0e8e0',
    roughness: 0.55,
    metalness: 0.03,
    textureUrl: 'https://images.unsplash.com/photo-1617103994332-953880017a4a?w=256&h=256&fit=crop',
    normalMap: true,
    repeat: [2, 2]
  }
}

// Glass materials
const glassMaterials = {
  clear: {
    color: '#e0e0e0',
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.5,
    textureUrl: null,
    normalMap: false,
    repeat: [1, 1]
  },
  frosted: {
    color: '#f5f5f5',
    roughness: 0.8,
    metalness: 0.05,
    transparent: true,
    opacity: 0.8,
    textureUrl: null,
    normalMap: false,
    repeat: [1, 1]
  },
  tinted: {
    color: '#4a5a6a',
    roughness: 0.1,
    metalness: 0.1,
    transparent: true,
    opacity: 0.3,
    textureUrl: null,
    normalMap: false,
    repeat: [1, 1]
  }
}

// Paint colors
const paintColors = {
  white: '#ffffff',
  offWhite: '#f5f5f5',
  beige: '#e8e0d6',
  cream: '#f5f0e8',
  lightGray: '#d8d8d8',
  gray: '#a8a8a8',
  darkGray: '#5a5a5a',
  black: '#000000',
  warmWhite: '#f5f0e8',
  sand: '#c4b09a',
  terracotta: '#c07a45',
  rust: '#a8632e',
  coolWhite: '#f0f5f5',
  blueGray: '#8a9ba8',
  slate: '#6b7a8a',
  navy: '#2a3a4a',
  sage: '#8a9a7a',
  olive: '#6b7a4a',
  teal: '#4a7a6b',
  dustyRose: '#a87a6b',
  mauve: '#7a6b8a'
}

// Preset material collections
const materialPresets = {
  modern: {
    name: 'Modern',
    floor: woodTextures.oak,
    walls: paintColors.warmWhite,
    ceiling: paintColors.white,
    furniture: {
      primary: woodTextures.walnut,
      secondary: metalTextures.stainlessSteel,
      fabric: fabricTextures.leather
    }
  },
  minimalist: {
    name: 'Minimalist',
    floor: floorTextures.concrete,
    walls: paintColors.white,
    ceiling: paintColors.white,
    furniture: {
      primary: woodTextures.maple,
      secondary: metalTextures.brushedSteel,
      fabric: fabricTextures.linen
    }
  },
  traditional: {
    name: 'Traditional',
    floor: woodTextures.cherry,
    walls: wallTextures.wallpaper,
    ceiling: paintColors.cream,
    furniture: {
      primary: woodTextures.oak,
      secondary: metalTextures.brass,
      fabric: fabricTextures.velvet
    }
  },
  industrial: {
    name: 'Industrial',
    floor: floorTextures.concrete,
    walls: wallTextures.brick,
    ceiling: paintColors.black,
    furniture: {
      primary: metalTextures.stainlessSteel,
      secondary: woodTextures.pine,
      fabric: fabricTextures.leather
    }
  },
  scandinavian: {
    name: 'Scandinavian',
    floor: woodTextures.pine,
    walls: paintColors.white,
    ceiling: paintColors.white,
    furniture: {
      primary: woodTextures.maple,
      secondary: metalTextures.brushedSteel,
      fabric: fabricTextures.linen
    }
  }
}

// Export all textures
module.exports = {
  woodTextures,
  stoneTextures,
  metalTextures,
  fabricTextures,
  floorTextures,
  wallTextures,
  glassMaterials,
  paintColors,
  materialPresets,
  getTextureByName: (category, name) => {
    const textures = {
      wood: woodTextures,
      stone: stoneTextures,
      metal: metalTextures,
      fabric: fabricTextures,
      floor: floorTextures,
      wall: wallTextures,
      glass: glassMaterials
    }
    return textures[category]?.[name] || null
  },
  getRandomTexture: (category) => {
    const textures = {
      wood: Object.values(woodTextures),
      stone: Object.values(stoneTextures),
      metal: Object.values(metalTextures),
      fabric: Object.values(fabricTextures),
      floor: Object.values(floorTextures),
      wall: Object.values(wallTextures),
      glass: Object.values(glassMaterials)
    }
    const list = textures[category] || []
    return list[Math.floor(Math.random() * list.length)]
  },
  getPreset: (name) => {
    return materialPresets[name] || materialPresets.modern
  }
}