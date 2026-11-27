/**
 * FloorPlanImportModal
 *
 * A three-step modal that lets the user:
 *   Step 1 – Upload a floor-plan image (drag-and-drop or file picker)
 *   Step 2 – Set a scale calibration (how many pixels represent 1 metre) and
 *             preview the detected rooms overlaid on the original image
 *   Step 3 – Review the room list, name the project, and confirm
 *
 * On confirm it calls onImport({ name, rooms, canvasWidthM, canvasDepthM,
 * pixelsPerMetre }).  The caller is responsible for creating the actual
 * project record and navigating to the editor.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Upload, Image as ImageIcon, Ruler, CheckCircle, AlertCircle, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { analyseFloorPlan, loadImage } from '@utils/floorPlanAnalyser'

// ─── constants ───────────────────────────────────────────────────────────────

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp']
const MAX_FILE_SIZE_MB = 20
const PREVIEW_MAX_HEIGHT = 340 // px – max height of the annotated preview

// ─── helpers ─────────────────────────────────────────────────────────────────

const ROOM_COLORS = [
  'rgba(192,122,69,0.25)',
  'rgba(69,122,192,0.22)',
  'rgba(69,192,122,0.22)',
  'rgba(192,69,122,0.22)',
  'rgba(122,69,192,0.22)',
  'rgba(192,169,69,0.22)',
]

const ROOM_BORDERS = [
  '#c07a45',
  '#457ac0',
  '#45c07a',
  '#c0457a',
  '#7a45c0',
  '#c0a945',
]

/**
 * Draw the analysed rooms as colour-coded overlays on a canvas element
 * sized to fit within maxHeight.
 */
function drawPreview(canvasEl, img, rooms, canvasWidthM, canvasDepthM) {
  if (!canvasEl || !img) return

  const aspect = img.naturalWidth / img.naturalHeight
  const availableWidth = canvasEl.parentElement?.clientWidth || 560
  const displayW = Math.min(availableWidth, PREVIEW_MAX_HEIGHT * aspect)
  const displayH = displayW / aspect

  canvasEl.width = Math.round(displayW)
  canvasEl.height = Math.round(displayH)

  const ctx = canvasEl.getContext('2d')
  ctx.drawImage(img, 0, 0, displayW, displayH)

  if (!rooms || rooms.length === 0) return

  // Scale from metres → display pixels
  const scaleX = displayW / canvasWidthM
  const scaleY = displayH / canvasDepthM

  rooms.forEach((room, i) => {
    const x = room.x * scaleX
    const y = room.z * scaleY
    const w = room.width * scaleX
    const h = room.depth * scaleY
    const color = ROOM_COLORS[i % ROOM_COLORS.length]
    const border = ROOM_BORDERS[i % ROOM_BORDERS.length]

    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)

    ctx.strokeStyle = border
    ctx.lineWidth = 2
    ctx.strokeRect(x, y, w, h)

    // Label
    ctx.fillStyle = border
    ctx.font = `bold ${Math.max(10, Math.min(14, w / 6))}px Manrope, sans-serif`
    ctx.fillText(
      room.name ?? `Room ${i + 1}`,
      x + 6,
      y + Math.max(14, Math.min(18, h / 4)),
    )
  })
}

// ─── Step components ──────────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="fimp-steps">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`fimp-step-dot ${i + 1 === current ? 'active' : i + 1 < current ? 'done' : ''}`}
        />
      ))}
    </div>
  )
}

// Step 1 — Upload
function UploadStep({ onFileSelected, error }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const validate = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Please upload a PNG, JPEG, WebP, or BMP image.'
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`
    }
    return null
  }

  const handleFiles = (files) => {
    const file = files[0]
    if (!file) return
    const err = validate(file)
    if (err) {
      onFileSelected(null, err)
      return
    }
    onFileSelected(file, null)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="fimp-upload-area">
      <p className="fimp-step-label">Step 1 of 3 — Upload your floor plan</p>
      <p className="fimp-step-hint">
        Upload a photo or scan of your existing floor plan. The importer will
        detect wall outlines and generate rooms automatically — you can adjust
        them in the editor afterwards.
      </p>

      <div
        className={`fimp-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
        aria-label="Upload floor plan image"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={(e) => handleFiles(e.target.files)}
          style={{ display: 'none' }}
        />
        <div className="fimp-dropzone-icon">
          <Upload size={32} />
        </div>
        <p className="fimp-dropzone-primary">Drop your floor plan here</p>
        <p className="fimp-dropzone-secondary">or click to browse — PNG, JPEG, WebP, BMP · max {MAX_FILE_SIZE_MB} MB</p>
      </div>

      {error && (
        <div className="fimp-error" role="alert">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      <div className="fimp-tips">
        <p className="fimp-tips-title">Tips for best results</p>
        <ul>
          <li>Use a clean, high-contrast scan or photo taken straight down.</li>
          <li>Walls should be dark lines on a white/light background.</li>
          <li>Avoid images with heavy furniture or shading filling the rooms.</li>
        </ul>
      </div>
    </div>
  )
}

// Step 2 — Calibrate & preview
function CalibrationStep({
  imageFile,
  pixelsPerMetre,
  setPixelsPerMetre,
  threshold,
  setThreshold,
  analysisResult,
  analysing,
  analysisError,
  onReanalyse,
  projectName,
  setProjectName,
}) {
  const previewCanvasRef = useRef(null)
  const [imgEl, setImgEl] = useState(null)

  // Load image element for preview drawing
  useEffect(() => {
    if (!imageFile) return
    let cancelled = false
    loadImage(imageFile).then((el) => {
      if (!cancelled) setImgEl(el)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [imageFile])

  // Redraw preview whenever analysis result or image changes
  useEffect(() => {
    if (!imgEl || !analysisResult) return
    drawPreview(
      previewCanvasRef.current,
      imgEl,
      analysisResult.rooms,
      analysisResult.canvasWidthM,
      analysisResult.canvasDepthM,
    )
  }, [imgEl, analysisResult])

  return (
    <div className="fimp-calibrate-area">
      <p className="fimp-step-label">Step 2 of 3 — Set scale &amp; preview rooms</p>

      <div className="fimp-controls-row">
        <label className="fimp-control-label">
          <span>Project name</span>
          <input
            type="text"
            className="fimp-input"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="e.g. My Apartment"
          />
        </label>

        <label className="fimp-control-label">
          <span>
            <Ruler size={13} style={{ display: 'inline', marginRight: 4 }} />
            Scale — pixels per metre
          </span>
          <div className="fimp-input-row">
            <input
              type="number"
              className="fimp-input"
              value={pixelsPerMetre}
              min={5}
              max={500}
              step={1}
              onChange={(e) => setPixelsPerMetre(Math.max(5, Number(e.target.value) || 50))}
            />
            <button
              type="button"
              className="fimp-reanalyse-btn"
              onClick={onReanalyse}
              disabled={analysing}
            >
              {analysing ? 'Analysing…' : 'Re-detect'}
            </button>
          </div>
          <span className="fimp-control-hint">
            Measure any known distance on the image in pixels and divide by its
            real length in metres. E.g. a 4 m wall that spans 200 px → 50 px/m.
          </span>
        </label>

        <label className="fimp-control-label">
          <span>Wall contrast threshold ({threshold})</span>
          <input
            type="range"
            min={80}
            max={240}
            step={5}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="fimp-range"
          />
          <span className="fimp-control-hint">
            Lower values detect only dark walls; higher values also include lighter
            wall lines. Increase the threshold if separate rooms are being merged.
            Door-sized gaps are sealed during detection; large open-plan openings
            may intentionally remain connected.
          </span>
        </label>
      </div>

      <div className="fimp-preview-wrap">
        {analysing && (
          <div className="fimp-preview-overlay">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
              className="fimp-spinner"
            />
            <span>Analysing floor plan…</span>
          </div>
        )}
        {analysisError && !analysing && (
          <div className="fimp-preview-overlay fimp-preview-error">
            <AlertCircle size={24} />
            <span>{analysisError}</span>
          </div>
        )}
        <canvas
          ref={previewCanvasRef}
          className="fimp-preview-canvas"
          style={{ opacity: analysing ? 0.3 : 1 }}
        />
      </div>

      {analysisResult && !analysing && analysisResult.rooms.length === 0 && (
        <div className="fimp-error" role="alert">
          <AlertCircle size={15} />
          No enclosed rooms found. Add a white margin around the plan, then adjust
          the contrast or scale and re-detect.
        </div>
      )}
      {analysisResult && !analysing && analysisResult.rooms.length > 0 && (
        <p className="fimp-detected-count">
          <CheckCircle size={14} style={{ display: 'inline', marginRight: 5, color: '#22c55e' }} />
          {analysisResult.rooms.length} room{analysisResult.rooms.length !== 1 ? 's' : ''} detected
          · image area {analysisResult.canvasWidthM.toFixed(1)} × {analysisResult.canvasDepthM.toFixed(1)} m
        </p>
      )}
    </div>
  )
}

// Step 3 — Confirm rooms
function ConfirmStep({ analysisResult, roomNames, setRoomNames }) {
  if (!analysisResult) return null

  return (
    <div className="fimp-confirm-area">
      <p className="fimp-step-label">Step 3 of 3 — Review detected rooms</p>
      <p className="fimp-step-hint">
        Each coloured region below is a detected room. Give them names — these
        appear as the room labels in the editor.
      </p>

      {analysisResult.rooms.length === 0 ? (
        <div className="fimp-error" role="alert">
          <AlertCircle size={15} />
          No rooms were detected. Go back and adjust the scale or threshold.
        </div>
      ) : (
        <ul className="fimp-room-list">
          {analysisResult.rooms.map((room, i) => (
            <li key={i} className="fimp-room-item">
              <span
                className="fimp-room-swatch"
                style={{ background: ROOM_BORDERS[i % ROOM_BORDERS.length] }}
              />
              <div className="fimp-room-info">
                <input
                  type="text"
                  className="fimp-input fimp-room-name-input"
                  value={roomNames[i] ?? `Room ${i + 1}`}
                  onChange={(e) => {
                    const next = [...roomNames]
                    next[i] = e.target.value
                    setRoomNames(next)
                  }}
                  placeholder={`Room ${i + 1}`}
                  aria-label={`Name for room ${i + 1}`}
                />
                <span className="fimp-room-dims">
                  {room.width.toFixed(1)} × {room.depth.toFixed(1)} m
                  · {(room.width * room.depth).toFixed(1)} m²
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function FloorPlanImportModal({ isOpen, onClose, onImport }) {
  const [step, setStep] = useState(1)

  // Step 1
  const [imageFile, setImageFile] = useState(null)
  const [uploadError, setUploadError] = useState('')

  // Step 2
  const [pixelsPerMetre, setPixelsPerMetre] = useState(50)
  const [threshold, setThreshold] = useState(175)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysing, setAnalysing] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [projectName, setProjectName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const analysisRequestRef = useRef(0)

  // Step 3
  const [roomNames, setRoomNames] = useState([])

  // ── analysis ──
  const runAnalysis = useCallback(async (file, ppm, thresh) => {
    if (!file) return
    const requestId = ++analysisRequestRef.current
    setAnalysing(true)
    setAnalysisError('')
    try {
      const img = await loadImage(file)
      const result = analyseFloorPlan(img, {
        pixelsPerMetre: ppm,
        threshold: thresh,
      })
      if (requestId !== analysisRequestRef.current) return
      setAnalysisResult(result)
      setRoomNames(result.rooms.map((_, i) => `Room ${i + 1}`))
    } catch (err) {
      if (requestId !== analysisRequestRef.current) return
      setAnalysisError(err.message || 'Analysis failed. Try a different image or adjust settings.')
      setAnalysisResult(null)
    } finally {
      if (requestId === analysisRequestRef.current) setAnalysing(false)
    }
  }, [])

  // Auto-analyse when file is first selected
  useEffect(() => {
    if (imageFile && step === 2) {
      runAnalysis(imageFile, pixelsPerMetre, threshold)
    }
  }, [imageFile, step]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── navigation ──
  const canGoNext = () => {
    if (step === 1) return imageFile !== null
    if (step === 2) return analysisResult !== null && analysisResult.rooms.length > 0 && !analysing
    return !isImporting
  }

  const handleNext = () => {
    if (step === 1 && imageFile) {
      setStep(2)
      return
    }
    if (step === 2) {
      setStep(3)
      return
    }
    if (step === 3) {
      handleConfirm()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  const handleConfirm = async () => {
    if (!analysisResult || isImporting) return

    const namedRooms = analysisResult.rooms.map((room, i) => ({
      ...room,
      name: (roomNames[i] || `Room ${i + 1}`).trim() || `Room ${i + 1}`,
    }))

    setIsImporting(true)
    try {
      await onImport({
        name: projectName.trim() || 'Imported Floor Plan',
        rooms: namedRooms,
        canvasWidthM: analysisResult.canvasWidthM,
        canvasDepthM: analysisResult.canvasDepthM,
        pixelsPerMetre,
      })
    } finally {
      setIsImporting(false)
    }
  }

  // ── reset on close ──
  const handleClose = () => {
    analysisRequestRef.current += 1
    setStep(1)
    setImageFile(null)
    setUploadError('')
    setAnalysisResult(null)
    setAnalysisError('')
    setAnalysing(false)
    setProjectName('')
    setRoomNames([])
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="modal-content fimp-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="fimp-modal-title-row">
                <ImageIcon size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                <h2 className="modal-title">Import Floor Plan</h2>
              </div>
              <div className="fimp-header-right">
                <StepIndicator current={step} total={3} />
                <button className="modal-close" onClick={handleClose} aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="fimp-body">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <UploadStep
                      onFileSelected={(file, err) => {
                        setImageFile(file)
                        setUploadError(err || '')
                      }}
                      error={uploadError}
                    />
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CalibrationStep
                      imageFile={imageFile}
                      pixelsPerMetre={pixelsPerMetre}
                      setPixelsPerMetre={setPixelsPerMetre}
                      threshold={threshold}
                      setThreshold={setThreshold}
                      analysisResult={analysisResult}
                      analysing={analysing}
                      analysisError={analysisError}
                      onReanalyse={() => runAnalysis(imageFile, pixelsPerMetre, threshold)}
                      projectName={projectName}
                      setProjectName={setProjectName}
                    />
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ConfirmStep
                      analysisResult={analysisResult}
                      roomNames={roomNames}
                      setRoomNames={setRoomNames}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="modal-actions fimp-footer">
              <button
                type="button"
                className="modal-button-secondary fimp-back-btn"
                onClick={step === 1 ? handleClose : handleBack}
              >
                {step === 1 ? (
                  'Cancel'
                ) : (
                  <>
                    <ChevronLeft size={15} />
                    Back
                  </>
                )}
              </button>

              <button
                type="button"
                className="modal-button-primary"
                onClick={handleNext}
                disabled={!canGoNext()}
              >
                {step === 3 ? (
                  <>
                    <CheckCircle size={15} />
                    {isImporting ? 'Creating…' : 'Create Project'}
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight size={15} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
