// Realistic 3D Furniture Models with accurate real-world dimensions
// All dimensions are in meters based on standard furniture sizes

import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useGLTF, useTexture } from '@react-three/drei'

// Realistic dimensions (in meters):
// Sofa: 2.0m x 0.9m x 0.8m (L x D x H)
// Chair: 0.5m x 0.5m x 0.8m
// Table: 1.2m x 0.8m x 0.75m (dining table)
// Bed: 2.0m x 1.5m x 0.5m (queen size)
// Desk: 1.4m x 0.7m x 0.75m
// Cabinet: 0.6m x 0.6m x 1.8m

// Custom geometry components for realistic furniture

// Modern Sofa with cushions
function Sofa({ color = '#7a8a99', ...props }) {
  const sofaGroup = useMemo(() => {
    const group = new THREE.Group()

    // Base frame (dark wood or metal)
    const frameColor = '#2a2a2a'

    // Seat cushions
    const seatGeometry = new THREE.BoxGeometry(1.8, 0.15, 0.8)
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.7,
      metalness: 0.05
    })
    const seat = new THREE.Mesh(seatGeometry, seatMaterial)
    seat.position.set(0, 0.2, 0)
    group.add(seat)

    // Back cushions
    const backGeometry = new THREE.BoxGeometry(1.8, 0.5, 0.15)
    const backCushion = new THREE.Mesh(backGeometry, seatMaterial)
    backCushion.position.set(0, 0.55, -0.325)
    group.add(backCushion)

    // Side arms
    const armGeometry = new THREE.BoxGeometry(0.25, 0.4, 0.3)
    const armMaterial = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.4,
      metalness: 0.1
    })

    const leftArm = new THREE.Mesh(armGeometry, armMaterial)
    leftArm.position.set(-0.85, 0.5, 0)
    group.add(leftArm)

    const rightArm = new THREE.Mesh(armGeometry, armMaterial)
    rightArm.position.set(0.85, 0.5, 0)
    group.add(rightArm)

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.08)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: frameColor,
      roughness: 0.3,
      metalness: 0.2
    })

    const legPositions = [
      [-0.7, -0.1, 0.3],
      [0.7, -0.1, 0.3],
      [-0.7, -0.1, -0.3],
      [0.7, -0.1, -0.3]
    ]

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(...pos)
      group.add(leg)
    })

    // Decorative pillows
    const pillowGeometry = new THREE.BoxGeometry(0.35, 0.1, 0.25)
    const pillowMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.8,
      metalness: 0
    })

    const pillow1 = new THREE.Mesh(pillowGeometry, pillowMaterial)
    pillow1.position.set(-0.5, 0.55, -0.15)
    pillow1.rotation.y = Math.PI / 4
    group.add(pillow1)

    const pillow2 = new THREE.Mesh(pillowGeometry, pillowMaterial)
    pillow2.position.set(0.5, 0.55, -0.15)
    pillow2.rotation.y = -Math.PI / 4
    group.add(pillow2)

    return group
  }, [color])

  return <primitive object={sofaGroup} {...props} />
}

// Modern Dining Chair
function Chair({ color = '#5c6370', ...props }) {
  const chairGroup = useMemo(() => {
    const group = new THREE.Group()

    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.45, 0.08, 0.45)
    const seatMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6,
      metalness: 0.05
    })
    const seat = new THREE.Mesh(seatGeometry, seatMaterial)
    seat.position.set(0, 0.45, 0)
    group.add(seat)

    // Backrest
    const backGeometry = new THREE.BoxGeometry(0.4, 0.45, 0.08)
    const backMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6,
      metalness: 0.05
    })
    const backrest = new THREE.Mesh(backGeometry, backMaterial)
    backrest.position.set(0, 0.75, -0.18)
    group.add(backrest)

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.06, 0.4, 0.06)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.4,
      metalness: 0.15
    })

    const legPositions = [
      [-0.18, 0.22, 0.18],
      [0.18, 0.22, 0.18],
      [-0.18, 0.22, -0.18],
      [0.18, 0.22, -0.18]
    ]

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(...pos)
      group.add(leg)
    })

    // Cross support
    const supportGeometry = new THREE.BoxGeometry(0.3, 0.04, 0.04)
    const support = new THREE.Mesh(supportGeometry, legMaterial)
    support.position.set(0, 0.3, 0)
    support.rotation.y = Math.PI / 2
    group.add(support)

    return group
  }, [color])

  return <primitive object={chairGroup} {...props} />
}

// Dining Table
function Table({ color = '#8c6a4f', ...props }) {
  const tableGroup = useMemo(() => {
    const group = new THREE.Group()

    // Table top (wood)
    const topGeometry = new THREE.BoxGeometry(1.2, 0.03, 0.8)
    const topMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.08
    })
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.set(0, 0.74, 0)
    group.add(top)

    // Table edge/rim
    const edgeGeometry = new THREE.BoxGeometry(1.3, 0.05, 0.9, 1, 1, 1)
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: '#5a4a3a',
      roughness: 0.4,
      metalness: 0.1
    })
    const edge = new THREE.Mesh(edgeGeometry, edgeMaterial)
    edge.position.set(0, 0.72, 0)
    group.add(edge)

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.08, 0.7, 0.08)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.3,
      metalness: 0.2
    })

    const legPositions = [
      [-0.5, 0.35, 0.35],
      [0.5, 0.35, 0.35],
      [-0.5, 0.35, -0.35],
      [0.5, 0.35, -0.35]
    ]

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(...pos)
      group.add(leg)
    })

    return group
  }, [color])

  return <primitive object={tableGroup} {...props} />
}

// Queen Size Bed
function Bed({ color = '#7688a1', ...props }) {
  const bedGroup = useMemo(() => {
    const group = new THREE.Group()

    // Mattress
    const mattressGeometry = new THREE.BoxGeometry(2.0, 0.25, 1.5)
    const mattressMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.8,
      metalness: 0.02
    })
    const mattress = new THREE.Mesh(mattressGeometry, mattressMaterial)
    mattress.position.set(0, 0.25, 0)
    group.add(mattress)

    // Bed frame headboard
    const headboardGeometry = new THREE.BoxGeometry(2.1, 0.8, 0.1)
    const headboardMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.4,
      metalness: 0.1
    })
    const headboard = new THREE.Mesh(headboardGeometry, headboardMaterial)
    headboard.position.set(0, 0.65, -0.775)
    group.add(headboard)

    // Bed frame footboard
    const footboardGeometry = new THREE.BoxGeometry(2.1, 0.4, 0.08)
    const footboard = new THREE.Mesh(footboardGeometry, headboardMaterial)
    footboard.position.set(0, 0.45, 0.725)
    group.add(footboard)

    // Side rails
    const railGeometry = new THREE.BoxGeometry(2.1, 0.1, 0.05)
    const leftRail = new THREE.Mesh(railGeometry, headboardMaterial)
    leftRail.position.set(-1.025, 0.35, 0)
    leftRail.rotation.y = Math.PI / 2
    group.add(leftRail)

    const rightRail = new THREE.Mesh(railGeometry, headboardMaterial)
    rightRail.position.set(1.025, 0.35, 0)
    rightRail.rotation.y = Math.PI / 2
    group.add(rightRail)

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.08)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.3,
      metalness: 0.2
    })

    const legPositions = [
      [-0.9, 0.125, -0.7],
      [0.9, 0.125, -0.7],
      [-0.9, 0.125, 0.7],
      [0.9, 0.125, 0.7]
    ]

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(...pos)
      group.add(leg)
    })

    // Pillows
    const pillowGeometry = new THREE.BoxGeometry(0.5, 0.12, 0.4)
    const pillowMaterial = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.85,
      metalness: 0
    })

    const pillow1 = new THREE.Mesh(pillowGeometry, pillowMaterial)
    pillow1.position.set(-0.5, 0.37, -0.3)
    group.add(pillow1)

    const pillow2 = new THREE.Mesh(pillowGeometry, pillowMaterial)
    pillow2.position.set(0.5, 0.37, -0.3)
    group.add(pillow2)

    return group
  }, [color])

  return <primitive object={bedGroup} {...props} />
}

// Office Desk
function Desk({ color = '#7a5a44', ...props }) {
  const deskGroup = useMemo(() => {
    const group = new THREE.Group()

    // Desktop
    const topGeometry = new THREE.BoxGeometry(1.4, 0.02, 0.7)
    const topMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.4,
      metalness: 0.08
    })
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.set(0, 0.74, 0)
    group.add(top)

    // Desk frame
    const frameGeometry = new THREE.BoxGeometry(1.35, 0.03, 0.65)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      roughness: 0.3,
      metalness: 0.15
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.set(0, 0.725, 0)
    group.add(frame)

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.08, 0.7, 0.08)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.3,
      metalness: 0.2
    })

    const legPositions = [
      [-0.6, 0.35, 0.28],
      [0.6, 0.35, 0.28],
      [-0.6, 0.35, -0.28],
      [0.6, 0.35, -0.28]
    ]

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(...pos)
      group.add(leg)
    })

    // Drawer unit
    const drawerGeometry = new THREE.BoxGeometry(0.5, 0.2, 0.45)
    const drawerMaterial = new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      roughness: 0.4,
      metalness: 0.1
    })
    const drawer = new THREE.Mesh(drawerGeometry, drawerMaterial)
    drawer.position.set(0, 0.5, -0.25)
    group.add(drawer)

    // Drawer handles
    const handleGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.1)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: '#8a8a8a',
      roughness: 0.2,
      metalness: 0.5
    })

    const handle1 = new THREE.Mesh(handleGeometry, handleMaterial)
    handle1.position.set(0, 0.55, -0.175)
    group.add(handle1)

    const handle2 = new THREE.Mesh(handleGeometry, handleMaterial)
    handle2.position.set(0, 0.45, -0.175)
    group.add(handle2)

    return group
  }, [color])

  return <primitive object={deskGroup} {...props} />
}

// Bookshelf/Cabinet
function Cabinet({ color = '#5f7182', ...props }) {
  const cabinetGroup = useMemo(() => {
    const group = new THREE.Group()

    // Main cabinet body
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.6, 0.5)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.08
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(0, 0.8, 0)
    group.add(body)

    // Cabinet doors
    const doorGeometry = new THREE.BoxGeometry(0.28, 1.5, 0.03)
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      roughness: 0.4,
      metalness: 0.1
    })

    const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial)
    leftDoor.position.set(-0.16, 0.75, 0.265)
    group.add(leftDoor)

    const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial)
    rightDoor.position.set(0.16, 0.75, 0.265)
    group.add(rightDoor)

    // Door handles
    const handleGeometry = new THREE.BoxGeometry(0.02, 0.02, 0.06)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: '#8a8a8a',
      roughness: 0.2,
      metalness: 0.5
    })

    const handle1 = new THREE.Mesh(handleGeometry, handleMaterial)
    handle1.position.set(-0.25, 0.75, 0.265)
    group.add(handle1)

    const handle2 = new THREE.Mesh(handleGeometry, handleMaterial)
    handle2.position.set(0.25, 0.75, 0.265)
    group.add(handle2)

    // Shelf dividers (horizontal lines)
    const shelfGeometry = new THREE.BoxGeometry(0.56, 0.02, 0.46)
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: '#4a4a4a',
      roughness: 0.4,
      metalness: 0.1
    })

    const shelf1 = new THREE.Mesh(shelfGeometry, shelfMaterial)
    shelf1.position.set(0, 0.45, 0)
    group.add(shelf1)

    const shelf2 = new THREE.Mesh(shelfGeometry, shelfMaterial)
    shelf2.position.set(0, 0.95, 0)
    group.add(shelf2)

    const shelf3 = new THREE.Mesh(shelfGeometry, shelfMaterial)
    shelf3.position.set(0, 1.45, 0)
    group.add(shelf3)

    return group
  }, [color])

  return <primitive object={cabinetGroup} {...props} />
}

// Wardrobe/Closet
function Wardrobe({ color = '#4a5a6a', ...props }) {
  const wardrobeGroup = useMemo(() => {
    const group = new THREE.Group()

    // Main body
    const bodyGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.6)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.08
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(0, 0.9, 0)
    group.add(body)

    // Doors
    const doorGeometry = new THREE.BoxGeometry(0.58, 1.7, 0.03)
    const doorMaterial = new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      roughness: 0.4,
      metalness: 0.1
    })

    const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial)
    leftDoor.position.set(-0.31, 0.85, 0.315)
    group.add(leftDoor)

    const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial)
    rightDoor.position.set(0.31, 0.85, 0.315)
    group.add(rightDoor)

    // Handles
    const handleGeometry = new THREE.BoxGeometry(0.03, 0.03, 0.08)
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: '#8a8a8a',
      roughness: 0.2,
      metalness: 0.5
    })

    const handle1 = new THREE.Mesh(handleGeometry, handleMaterial)
    handle1.position.set(-0.45, 0.85, 0.315)
    group.add(handle1)

    const handle2 = new THREE.Mesh(handleGeometry, handleMaterial)
    handle2.position.set(0.45, 0.85, 0.315)
    group.add(handle2)

    return group
  }, [color])

  return <primitive object={wardrobeGroup} {...props} />
}

// Coffee Table
function CoffeeTable({ color = '#6a5a4a', ...props }) {
  const tableGroup = useMemo(() => {
    const group = new THREE.Group()

    // Table top (glass or wood)
    const topGeometry = new THREE.BoxGeometry(1.0, 0.02, 0.6)
    const topMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.1,
      transparent: true,
      opacity: 0.8
    })
    const top = new THREE.Mesh(topGeometry, topMaterial)
    top.position.set(0, 0.2, 0)
    group.add(top)

    // Frame
    const frameGeometry = new THREE.BoxGeometry(0.95, 0.03, 0.55)
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.3,
      metalness: 0.2
    })
    const frame = new THREE.Mesh(frameGeometry, frameMaterial)
    frame.position.set(0, 0.185, 0)
    group.add(frame)

    // Legs
    const legGeometry = new THREE.BoxGeometry(0.06, 0.18, 0.06)
    const legMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.3,
      metalness: 0.3
    })

    const legPositions = [
      [-0.43, 0.09, 0.25],
      [0.43, 0.09, 0.25],
      [-0.43, 0.09, -0.25],
      [0.43, 0.09, -0.25]
    ]

    legPositions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, legMaterial)
      leg.position.set(...pos)
      group.add(leg)
    })

    return group
  }, [color])

  return <primitive object={tableGroup} {...props} />
}

// Floor Lamp
function FloorLamp({ color = '#3a3a3a', ...props }) {
  const lampGroup = useMemo(() => {
    const group = new THREE.Group()

    // Base
    const baseGeometry = new THREE.BoxGeometry(0.3, 0.05, 0.3)
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: '#2a2a2a',
      roughness: 0.3,
      metalness: 0.2
    })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.set(0, 0, 0)
    group.add(base)

    // Pole
    const poleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 16)
    const poleMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.2,
      metalness: 0.4
    })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.set(0, 0.775, 0)
    group.add(pole)

    // Lamp shade
    const shadeGeometry = new THREE.CylinderGeometry(0.2, 0.15, 0.2, 16)
    const shadeMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.6,
      metalness: 0.05
    })
    const shade = new THREE.Mesh(shadeGeometry, shadeMaterial)
    shade.position.set(0, 1.5, 0)
    shade.rotation.x = Math.PI / 2
    group.add(shade)

    // Light bulb (emissive)
    const bulbGeometry = new THREE.SphereGeometry(0.04, 16, 16)
    const bulbMaterial = new THREE.MeshStandardMaterial({
      color: '#ffeb3b',
      emissive: '#ffeb3b',
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.05
    })
    const bulb = new THREE.Mesh(bulbGeometry, bulbMaterial)
    bulb.position.set(0, 1.4, 0)
    group.add(bulb)

    return group
  }, [color])

  return <primitive object={lampGroup} {...props} />
}

// Bookshelf
function Bookshelf({ color = '#4a4a3a', ...props }) {
  const bookshelfGroup = useMemo(() => {
    const group = new THREE.Group()

    // Main structure
    const bodyGeometry = new THREE.BoxGeometry(1.0, 1.8, 0.3)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.5,
      metalness: 0.08
    })
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
    body.position.set(0, 0.9, 0)
    group.add(body)

    // Shelves
    const shelfGeometry = new THREE.BoxGeometry(0.95, 0.02, 0.28)
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: '#3a3a3a',
      roughness: 0.4,
      metalness: 0.1
    })

    const shelfPositions = [0.3, 0.7, 1.1, 1.5]
    shelfPositions.forEach(y => {
      const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial)
      shelf.position.set(0, y, 0)
      group.add(shelf)
    })

    // Books (decorative)
    const bookGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.2)
    const bookMaterial = new THREE.MeshStandardMaterial({
      color: '#8b4513',
      roughness: 0.7,
      metalness: 0
    })

    // Add some books
    const bookPositions = [
      [-0.35, 0.35, 0],
      [-0.25, 0.35, 0],
      [-0.15, 0.35, 0],
      [0.1, 0.75, 0],
      [0.25, 0.75, 0],
      [-0.3, 1.15, 0],
      [-0.1, 1.15, 0],
      [0.2, 1.55, 0]
    ]

    bookPositions.forEach(pos => {
      const book = new THREE.Mesh(bookGeometry, bookMaterial)
      book.position.set(...pos)
      group.add(book)
    })

    return group
  }, [color])

  return <primitive object={bookshelfGroup} {...props} />
}

// Main export component
const FurnitureModel = ({ type, color, ...props }) => {
  const furnitureMap = {
    sofa: Sofa,
    chair: Chair,
    table: Table,
    bed: Bed,
    desk: Desk,
    cabinet: Cabinet,
    wardrobe: Wardrobe,
    coffeeTable: CoffeeTable,
    floorLamp: FloorLamp,
    bookshelf: Bookshelf
  }

  const FurnitureComponent = furnitureMap[type] || Sofa

  return <FurnitureComponent color={color} {...props} />
}

export default FurnitureModel

export {
  Sofa,
  Chair,
  Table,
  Bed,
  Desk,
  Cabinet,
  Wardrobe,
  CoffeeTable,
  FloorLamp,
  Bookshelf
}