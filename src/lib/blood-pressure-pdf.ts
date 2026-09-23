import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export type BloodPressureRow = {
  recordedAt: string
  systolic: number
  diastolic: number
  heartRateBpm: number | null
  temperatureDisplay: string | null
  temperatureUnit: string
  oxygenSaturation: string | null
}

export async function bloodPressurePdf(name: string, rows: BloodPressureRow[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const pageWidth = 612
  const pageHeight = 792
  const margin = 48
  const rowHeight = 18
  const columns = [150, 80, 70, 80, 70]

  let page = doc.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  function drawHeader() {
    page.drawText('Mezurilo', { x: margin, y, size: 11, font, color: rgb(0.33, 0.4, 0.48) })
    y -= 18
    page.drawText('Blood pressure readings', { x: margin, y, size: 16, font: bold })
    y -= 16
    page.drawText(name, { x: margin, y, size: 11, font })
    y -= 22
    const headers = ['When', 'Blood pressure', 'Heart rate', 'Temperature', 'O2 sat']
    let x = margin
    headers.forEach((header, i) => {
      page.drawText(header, { x, y, size: 9, font: bold })
      x += columns[i]
    })
    y -= 8
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageWidth - margin, y },
      thickness: 0.5,
      color: rgb(0.7, 0.7, 0.7),
    })
    y -= rowHeight
  }

  drawHeader()

  if (rows.length === 0) {
    page.drawText('No blood pressure readings.', { x: margin, y, size: 11, font })
  }

  for (const row of rows) {
    if (y < margin + rowHeight) {
      page = doc.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
      drawHeader()
    }
    const when = new Date(row.recordedAt).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
    const cells = [
      when,
      `${row.systolic}/${row.diastolic}`,
      row.heartRateBpm != null ? String(row.heartRateBpm) : '—',
      row.temperatureDisplay != null ? `${row.temperatureDisplay}${row.temperatureUnit}` : '—',
      row.oxygenSaturation != null ? `${row.oxygenSaturation}%` : '—',
    ]
    let x = margin
    cells.forEach((cell, i) => {
      page.drawText(cell, { x, y, size: 9, font })
      x += columns[i]
    })
    y -= rowHeight
  }

  return doc.save()
}
